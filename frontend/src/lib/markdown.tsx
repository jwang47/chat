import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "rehype-sanitize";
import { CodeBlock } from "@/components/chat/CodeBlock";

// Custom sanitization schema that allows center tag while keeping security
// SECURITY NOTE: We use rehype-raw to parse HTML tags like <center>, but this
// introduces XSS risks. To mitigate this, we use rehype-sanitize with a custom
// schema that:
// 1. Inherits the default safe schema (blocks <script>, dangerous attributes, etc.)
// 2. Explicitly allows only the <center> tag for centering content
// 3. Blocks all dangerous HTML elements and event handlers
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "center", // Allow center tag for centering content
    "br", // Allow br tag for line breaks
  ],
  attributes: {
    ...defaultSchema.attributes,
    // No additional attributes needed for center or br tags
    // Event handlers like onclick, onload, etc. are blocked by default schema
  },
};

// Function to convert standalone newlines to <br /> tags
function preprocessContent(content: string): string {
  // Split content into lines
  const lines = content.split("\n");
  const processedLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we're entering or leaving a code block
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    // If we're in a code block, don't process the line
    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // If line is empty and not the last line, convert to <br />
    if (line.trim() === "" && i < lines.length - 1) {
      processedLines.push("<br />");
    } else {
      processedLines.push(line);
    }
  }

  return processedLines.join("\n");
}

// Simple markdown renderer using react-markdown
export function renderMarkdown(
  content: string,
  isUserMessage: boolean = false
) {
  // Preprocess content to convert standalone newlines to <br /> tags
  const processedContent = preprocessContent(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw, // Parse raw HTML (needed for <center> tags)
        [rehypeSanitize, sanitizeSchema], // Sanitize HTML to prevent XSS
      ]}
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

            return <CodeBlock language={language} code={codeContent} />;
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
          // Extract language and content from children
          let language = "";
          let textContent = "";

          if (typeof children === "string") {
            textContent = children;
          } else if (
            React.isValidElement(children) &&
            (children.type === "code" ||
              (typeof children.type === "function" &&
                children.type.name === "code"))
          ) {
            // Direct code child
            const props = children.props as any;
            if (props?.className && typeof props.className === "string") {
              const match = props.className.match(/language-(\w+)/);
              if (match) {
                language = match[1];
              }
            }
            textContent = String(props?.children || "");
          } else {
            // Multiple children - look for code element
            React.Children.forEach(children, (child) => {
              if (React.isValidElement(child) && child.type === "code") {
                const props = child.props as any;
                if (props?.className && typeof props.className === "string") {
                  const match = props.className.match(/language-(\w+)/);
                  if (match) {
                    language = match[1];
                  }
                }
                textContent = String(props?.children || "");
              }
            });

            // If no code element found, extract text from all children
            if (!textContent) {
              textContent = React.Children.toArray(children)
                .map((child) => {
                  if (typeof child === "string") return child;
                  if (React.isValidElement(child)) {
                    const props = child.props as any;
                    return String(props?.children || "");
                  }
                  return "";
                })
                .join("");
            }
          }

          // Clean up trailing newlines
          textContent = textContent.replace(/\n$/, "");

          return <CodeBlock language={language || "text"} code={textContent} />;
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}

// For backward compatibility, export the same function name
export const renderComplexContent = renderMarkdown;
