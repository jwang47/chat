import React, { useMemo, useRef, type JSX } from "react";
import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import { useCodeBlockManager } from "../../hooks/useCodeBlockManager";
import { CodeBlock } from "./CodeBlock";
import type { ExpandedCodeBlock } from "@/types/chat";

const renderToken = (
  token: Token,
  manager: ReturnType<typeof useCodeBlockManager>,
  codeBlockCounter: { current: number },
  messageId: string
): React.ReactNode => {
  switch (token.type) {
    case "hr":
      return <hr key={token.raw} />;
    case "heading":
      // Use 'as' to create dynamic heading tags H1, H2, etc.
      const Tag = `h${token.depth}` as keyof JSX.IntrinsicElements;
      return <Tag key={token.raw}>{token.text}</Tag>;

    case "paragraph":
      return (
        <p key={token.raw} className="mb-4 last:mb-0 whitespace-pre-line">
          {/* Paragraphs can contain other tokens like 'strong', 'em', etc. */}
          {token.tokens
            ? token.tokens.map((t) =>
                renderToken(t, manager, codeBlockCounter, messageId)
              )
            : token.text}
        </p>
      );

    case "code":
      // We are in a code block
      const index = codeBlockCounter.current++;
      return (
        <CodeBlock
          blockIndex={index}
          key={index}
          language={token.lang || "text"}
          code={token.text}
          isExpanded={manager.isExpanded(index)}
          onToggleExpand={() =>
            manager.toggle(index, {
              code: token.text,
              language: token.lang || "text",
            })
          }
        />
      );

    case "list":
      const ListTag = token.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={token.raw}
          className={
            token.ordered
              ? "list-decimal list-outside mb-4 ml-6"
              : "list-disc list-outside mb-4 ml-6"
          }
        >
          {token.items.map((item: Token) =>
            renderToken(item, manager, codeBlockCounter, messageId)
          )}
        </ListTag>
      );

    case "list_item":
      return (
        <li key={token.raw}>
          {token.tokens?.map((t) =>
            renderToken(t, manager, codeBlockCounter, messageId)
          )}
        </li>
      );

    case "strong":
      return <strong key={token.raw}>{token.text}</strong>;

    case "em":
      return <em key={token.raw}>{token.text}</em>;

    case "codespan":
      return (
        <code
          key={token.raw}
          className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm font-mono"
        >
          {token.text}
        </code>
      );

    case "blockquote":
      return (
        <blockquote key={token.raw}>
          {token.tokens?.map((t, i) => (
            <React.Fragment key={i}>
              {renderToken(t, manager, codeBlockCounter, messageId)}
            </React.Fragment>
          ))}
        </blockquote>
      );

    case "html":
      // Only allow center tags, sanitize everything else
      const sanitizedHtml = DOMPurify.sanitize(token.text, {
        ALLOWED_TAGS: ["center"],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });

      // Handle center tags specifically
      if (
        sanitizedHtml.includes("<center>") ||
        sanitizedHtml.includes("</center>")
      ) {
        // Split content by center tags and process each part
        const parts = sanitizedHtml.split(/(<\/?center>)/);
        const elements: React.ReactNode[] = [];
        let isInsideCenter = false;
        let centerContent = "";
        let elementIndex = 0;

        for (const part of parts) {
          if (part === "<center>") {
            isInsideCenter = true;
            centerContent = "";
          } else if (part === "</center>") {
            if (isInsideCenter) {
              elements.push(
                <div key={`${token.raw}-${elementIndex++}`} className="text-center">
                  {centerContent.trim()}
                </div>
              );
            }
            isInsideCenter = false;
            centerContent = "";
          } else if (isInsideCenter) {
            centerContent += part;
          } else if (part.trim()) {
            // Content outside center tags - check if it contains markdown that should be parsed
            const trimmedPart = part.trim();
            
            // Split by lines and check if any line starts with '>'
            const lines = trimmedPart.split('\n');
            const hasBlockquote = lines.some(line => line.trim().startsWith('>'));
            
            if (hasBlockquote) {
              // This contains markdown blockquote - parse it as markdown
              const markdownTokens = marked.lexer(trimmedPart);
              markdownTokens.forEach((mdToken, mdIndex) => {
                elements.push(
                  <React.Fragment key={`${token.raw}-md-${elementIndex++}-${mdIndex}`}>
                    {renderToken(mdToken, manager, codeBlockCounter, messageId)}
                  </React.Fragment>
                );
              });
            } else {
              // Regular content outside center tags
              elements.push(
                <span key={`${token.raw}-${elementIndex++}`}>{part}</span>
              );
            }
          }
        }

        // Handle case where center tag wasn't closed
        if (isInsideCenter && centerContent.trim()) {
          elements.push(
            <div key={`${token.raw}-${elementIndex++}`} className="text-center">
              {centerContent.trim()}
            </div>
          );
        }

        return elements.length > 1 ? (
          <React.Fragment key={token.raw}>{elements}</React.Fragment>
        ) : (
          elements[0] || null
        );
      }

      // If no center tags remain after sanitization, treat as text
      if (sanitizedHtml.trim()) {
        return <span key={token.raw}>{sanitizedHtml}</span>;
      }

      return null;

    case "text":
      // Handle nested text tokens if they also have tokens (rare but possible)
      if (token.tokens) {
        return (
          <React.Fragment key={token.raw}>
            {token.tokens.map((t, index) => (
              <React.Fragment key={t.raw || index}>
                {renderToken(t, manager, codeBlockCounter, messageId)}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      }
      return <React.Fragment key={token.raw}>{token.text}</React.Fragment>;

    case "space":
      return null; // Ignore space tokens, layout is handled by CSS

    default:
      console.warn("Unhandled token type:", token.type);
      return (
        <p key={token.raw} className="text-red-400">
          Unhandled type: {token.type}
        </p>
      );
  }
};

interface MarkedRendererProps {
  content: string;
  messageId: string;
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalCodeBlockToggle?: (
    messageId: string,
    blockIndex: number,
    payload: any
  ) => void;
}

// Function to handle incomplete code blocks for the lexer
function handleIncompleteCodeBlocksForLexer(content: string): string {
  const codeBlockMarkers = content.match(/```/g) || [];
  if (codeBlockMarkers.length % 2 === 1) {
    return content + "\n```";
  }
  return content;
}

export function MarkedRenderer({
  content,
  messageId,
  globalExpandedState,
  onGlobalCodeBlockToggle,
}: MarkedRendererProps) {
  const manager = useCodeBlockManager(content, {
    globalExpandedState,
    onGlobalToggle: onGlobalCodeBlockToggle,
    messageId,
  });

  // Memoize the tokens to avoid re-parsing on every render
  const tokens = useMemo(() => {
    // Handle incomplete code blocks first, then let marked parse naturally
    // Don't sanitize the entire content here as it breaks markdown syntax like blockquotes
    let processedContent = handleIncompleteCodeBlocksForLexer(content);
    
    // Pre-process content to handle mixed center tags and markdown
    // Split content by center tags and process each part separately
    if (processedContent.includes('<center>')) {
      const parts = processedContent.split(/(<\/?center[^>]*>)/);
      const processedParts: string[] = [];
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (part.match(/<\/?center[^>]*>/)) {
          // Keep center tags as-is
          processedParts.push(part);
        } else if (part.trim()) {
          // For content between center tags, check if it has markdown that needs preservation
          const lines = part.split('\n');
          const hasBlockquote = lines.some(line => line.trim().startsWith('>'));
          
          if (hasBlockquote) {
            // Temporarily replace center tags in this part to prevent HTML parsing
            // This allows markdown parsing to work properly
            processedParts.push('\n\n' + part.trim() + '\n\n');
          } else {
            processedParts.push(part);
          }
        } else {
          processedParts.push(part);
        }
      }
      
      processedContent = processedParts.join('');
    }
    
    return marked.lexer(processedContent);
  }, [content]);

  // Use a mutable ref to count code blocks during a single render pass
  const codeBlockCounter = React.useRef(0);
  codeBlockCounter.current = 0; // Reset on each render

  return (
    <div className="prose prose-invert max-w-none">
      {tokens.map((token) =>
        renderToken(token, manager, codeBlockCounter, messageId)
      )}
    </div>
  );
}
