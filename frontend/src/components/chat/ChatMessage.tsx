import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
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
              code: ({ children, className, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                // If it's a code block (has language class), use syntax highlighter
                if (match) {
                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      className="rounded-lg !m-0 !p-3 !text-xs !font-mono !mb-2"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                }

                // Inline code
                return (
                  <code
                    className="bg-surface px-1 py-0.5 rounded text-xs font-mono"
                    {...props}
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
