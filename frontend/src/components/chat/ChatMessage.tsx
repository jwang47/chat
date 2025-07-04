import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useRef, useEffect } from "react";

interface ChatMessageProps {
  message: Message;
}

interface CollapsibleCodeBlockProps {
  children: string;
  language: string;
}

function CollapsibleCodeBlock({
  children,
  language,
}: CollapsibleCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const lineCount = children.split("\n").length;

  useEffect(() => {
    if (codeRef.current) {
      const height = codeRef.current.scrollHeight;
      const viewportHeight = window.innerHeight;
      const maxHeight = viewportHeight * 0.25; // 25vh
      setShouldShowToggle(height > maxHeight);
    }
  }, [children]);

  const maxHeight = shouldShowToggle && !isExpanded ? "25vh" : "none";

  const handleExpand = () => {
    if (shouldShowToggle && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative mb-2">
      <div
        ref={codeRef}
        className={cn(
          "overflow-hidden transition-all duration-100",
          shouldShowToggle &&
            !isExpanded &&
            "cursor-pointer hover:ring-1 hover:ring-accent/30 rounded-lg",
          isButtonHovered &&
            shouldShowToggle &&
            "ring-1 ring-accent/30 rounded-lg"
        )}
        style={{ maxHeight }}
        onClick={handleExpand}
      >
        <div className="relative">
          <SyntaxHighlighter
            style={oneDark as any}
            language={language}
            PreTag="div"
            className="rounded-lg !m-0 !p-3 !text-xs !font-mono"
            customStyle={{
              backgroundColor: "rgba(45, 44, 40, 0.6)",
              margin: 0,
              padding: "12px",
              paddingTop: "32px", // Make room for line count
            }}
          >
            {children}
          </SyntaxHighlighter>
          <div className="absolute top-2 right-3 text-xs text-muted-foreground bg-[rgba(25,24,21,0.8)] px-2 py-1 rounded">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </div>
        </div>
      </div>
      {shouldShowToggle && (
        <button
          onClick={handleToggle}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[rgba(45,44,40,0.9)] to-transparent px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors duration-100 flex items-center justify-center gap-1 backdrop-blur-sm cursor-pointer"
        >
          {isExpanded ? "Show less" : `Show more (${lineCount} lines)`}
          <svg
            className={cn(
              "w-3 h-3 transition-transform duration-100",
              isExpanded && "rotate-180"
            )}
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
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex p-4", isUser && "justify-end")}>
      <div
        className={cn(
          "p-3 rounded-lg max-w-[80%]",
          isUser && "bg-accent text-background"
        )}
      >
        <div className="text-sm leading-relaxed">
          <ReactMarkdown
            components={{
              // Custom styling for markdown elements
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mb-1">{children}</h3>
              ),
              code: ({ children, className }) => {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                // If it's a code block (has language class), use collapsible wrapper
                if (match) {
                  return (
                    <CollapsibleCodeBlock language={language}>
                      {String(children).replace(/\n$/, "")}
                    </CollapsibleCodeBlock>
                  );
                }

                // Inline code
                return (
                  <code
                    className="px-1 py-0.5 rounded text-xs font-mono"
                    style={{ backgroundColor: "rgba(45, 44, 40, 0.4)" }}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => {
                // Don't wrap code blocks in pre since SyntaxHighlighter handles it
                return <>{children}</>;
              },
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-2">{children}</ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-accent pl-3 italic mb-2">
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
