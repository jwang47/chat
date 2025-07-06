import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// Simple markdown renderer using react-markdown
export function renderMarkdown(
  content: string,
  isUserMessage: boolean = false
) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Center
        center: ({ children }) => (
          <div className="flex justify-center">{children}</div>
        ),
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
              <div className="mb-4">
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={language}
                  PreTag="div"
                  className="!m-0 !p-3 !text-xs !font-mono !bg-surface"
                  customStyle={{
                    margin: 0,
                    padding: "12px",
                    borderRadius: "0.5rem",
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          }

          // This is inline code
          return (
            <code className="px-1 py-0.5 rounded text-xs font-mono bg-surface text-foreground">
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
              <div className="mb-4">
                <SyntaxHighlighter
                  style={oneDark as any}
                  language={language}
                  PreTag="div"
                  className="!m-0 !p-3 !text-xs !font-mono !bg-surface"
                  customStyle={{
                    margin: 0,
                    padding: "12px",
                    borderRadius: "0.5rem",
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          }

          // Fallback for pre without language
          return (
            <div className="mb-4">
              <SyntaxHighlighter
                style={oneDark as any}
                language=""
                PreTag="div"
                className="!m-0 !p-3 !text-xs !font-mono !bg-surface"
                customStyle={{
                  margin: 0,
                  padding: "12px",
                  borderRadius: "0.5rem",
                }}
              >
                {String(codeElement.props?.children || "")}
              </SyntaxHighlighter>
            </div>
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
