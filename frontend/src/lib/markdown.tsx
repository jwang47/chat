import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Collapsible code block component for long code blocks
interface CollapsibleCodeBlockProps {
  children: string;
  language: string;
  isUserMessage?: boolean;
}

function CollapsibleCodeBlock({
  children,
  language,
  isUserMessage = false,
}: CollapsibleCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);

  const lineCount = children.split("\n").length;

  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const maxHeight = viewportHeight * 0.25;
    const estimatedHeight = lineCount * 20; // Rough estimate
    setShouldShowToggle(estimatedHeight > maxHeight);
  }, [lineCount]);

  const maxHeight = shouldShowToggle && !isExpanded ? "25vh" : "none";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Let container background take over - no custom backgrounds needed

  return (
    <div className="relative mb-4">
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          style={oneDark as any}
          language={language}
          PreTag="div"
          className="!m-0 !p-3 !text-xs !font-mono"
          customStyle={{
            backgroundColor: "var(--surface)",
            margin: 0,
            padding: "12px",
            borderRadius:
              shouldShowToggle && isExpanded ? "0.5rem 0.5rem 0 0" : "0.5rem",
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
      {shouldShowToggle && !isExpanded && (
        <button
          onClick={handleToggle}
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1"
          style={{ backgroundColor: "var(--surface)" }}
        >
          Show more ({lineCount} lines)
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
      {shouldShowToggle && isExpanded && (
        <div
          className="border-t rounded-b-lg"
          style={{
            borderColor: "var(--accent)",
            backgroundColor: "var(--surface)",
          }}
        >
          <button
            onClick={handleToggle}
            className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 rounded-b-lg"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Show less
            <svg
              className="w-3 h-3 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// Simple markdown renderer using react-markdown
export function renderMarkdown(
  content: string,
  isUserMessage: boolean = false
) {
  // Let container background take over for inline code too

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 last:mb-0 whitespace-pre-line">{children}</p>
        ),

        // Headings
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold mb-3 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mb-3 mt-5 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold mb-2 mt-3 first:mt-0">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-sm font-semibold mb-2 mt-3 first:mt-0">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-sm font-semibold mb-2 mt-3 first:mt-0">
            {children}
          </h6>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside mb-4 ml-6 space-y-1 [&_ul]:mt-1 [&_ul]:mb-1 [&_ul]:ml-6">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside mb-4 ml-6 space-y-1 [&_ol]:mt-1 [&_ol]:mb-1 [&_ol]:ml-6">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="[&>ul]:mt-1 [&>ol]:mt-1 [&>ul]:mb-1 [&>ol]:mb-1">
            {children}
          </li>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent/30 pl-4 italic mb-4 mt-2 whitespace-pre-line">
            {children}
          </blockquote>
        ),

        // Horizontal rules
        hr: () => <hr className="border-0 h-px bg-muted-foreground/20 my-6" />,

        // Text formatting
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),

        // Inline code
        code: ({ children, className }) => {
          // Check if this is a code block (has language class) or inline code
          const isCodeBlock = className && className.startsWith("language-");

          if (isCodeBlock) {
            // This is a code block, extract language and content
            const language = className.replace("language-", "");
            const codeContent = String(children).replace(/\n$/, "");

            return (
              <CollapsibleCodeBlock
                language={language}
                isUserMessage={isUserMessage}
              >
                {codeContent}
              </CollapsibleCodeBlock>
            );
          }

          // This is inline code
          return (
            <code
              className="px-1 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--foreground)",
              }}
            >
              {children}
            </code>
          );
        },

        // Pre blocks (fallback for code blocks)
        pre: ({ children }) => {
          // Extract code content from pre > code structure
          const codeElement = React.Children.only(
            children
          ) as React.ReactElement<any>;
          if (codeElement.props?.className) {
            const language = codeElement.props.className.replace(
              "language-",
              ""
            );
            const codeContent = String(codeElement.props.children).replace(
              /\n$/,
              ""
            );

            return (
              <CollapsibleCodeBlock
                language={language}
                isUserMessage={isUserMessage}
              >
                {codeContent}
              </CollapsibleCodeBlock>
            );
          }

          // Fallback for pre without language
          return (
            <CollapsibleCodeBlock language="" isUserMessage={isUserMessage}>
              {String(codeElement.props?.children || "")}
            </CollapsibleCodeBlock>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// For backward compatibility, export the same function name
export const renderComplexContent = renderMarkdown;
