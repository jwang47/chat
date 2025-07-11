import React, { useMemo, type JSX } from "react";
import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import { useCodeBlockManager } from "../../hooks/useCodeBlockManager"; // Reuse the hook!
import { CodeBlock } from "./CodeBlock"; // Your interactive component

// This is a simplified renderer. A production one would handle more token types.
const renderToken = (
  token: Token,
  manager: ReturnType<typeof useCodeBlockManager>,
  codeBlockCounter: { current: number }
): React.ReactNode => {
  switch (token.type) {
    case "heading":
      // Use 'as' to create dynamic heading tags H1, H2, etc.
      const Tag = `h${token.depth}` as keyof JSX.IntrinsicElements;
      return <Tag key={token.raw}>{token.text}</Tag>;

    case "paragraph":
      return (
        <p key={token.raw} className="mb-4 last:mb-0 whitespace-pre-line">
          {/* Paragraphs can contain other tokens like 'strong', 'em', etc. */}
          {token.tokens
            ? token.tokens.map((t) => renderToken(t, manager, codeBlockCounter))
            : token.text}
        </p>
      );

    case "code":
      const index = codeBlockCounter.current;
      codeBlockCounter.current++;
      return (
        <CodeBlock
          key={`code-block-${index}`}
          blockIndex={index}
          language={token.lang || "text"}
          code={token.text}
          isExpanded={manager.isExpanded(index)}
          onToggleExpand={() => manager.toggle(index)}
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
            renderToken(item, manager, codeBlockCounter)
          )}
        </ListTag>
      );

    case "list_item":
      return (
        <li key={token.raw}>
          {token.tokens?.map((t) => renderToken(t, manager, codeBlockCounter))}
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
        const centerContent = sanitizedHtml.replace(/<\/?center>/g, "");
        return (
          <div key={token.raw} className="text-center">
            {centerContent}
          </div>
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
          <>
            {token.tokens.map((t) => renderToken(t, manager, codeBlockCounter))}
          </>
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
}

// Function to handle incomplete code blocks for the lexer
function handleIncompleteCodeBlocksForLexer(content: string): string {
  const codeBlockMarkers = content.match(/```/g) || [];
  if (codeBlockMarkers.length % 2 === 1) {
    return content + "\n```";
  }
  return content;
}

export function MarkedRenderer({ content }: MarkedRendererProps) {
  const manager = useCodeBlockManager(content);

  const tokens = useMemo(() => {
    // Ensure incomplete code blocks don't break the lexer
    const cleanContent = handleIncompleteCodeBlocksForLexer(content);
    // Use marked.lexer to get the token stream
    return marked.lexer(cleanContent);
  }, [content]);

  // Use a mutable ref to count code blocks during a single render pass
  const codeBlockCounter = React.useRef(0);
  codeBlockCounter.current = 0; // Reset on each render

  return (
    <div className="prose prose-invert max-w-none">
      {tokens.map((token) => renderToken(token, manager, codeBlockCounter))}
    </div>
  );
}
