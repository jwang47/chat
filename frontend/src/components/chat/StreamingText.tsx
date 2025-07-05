import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
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
        className={`overflow-hidden transition-all duration-100 rounded-lg ${
          shouldShowToggle &&
          !isExpanded &&
          "cursor-pointer hover:ring-1 hover:ring-accent/30"
        } ${isButtonHovered && shouldShowToggle && "ring-1 ring-accent/30"}`}
        style={{ maxHeight }}
        onClick={handleExpand}
      >
        <div className="relative">
          <SyntaxHighlighter
            style={oneDark as any}
            language={language}
            PreTag="div"
            className="!m-0 !p-3 !text-xs !font-mono"
            customStyle={{
              backgroundColor: "rgba(45, 44, 40, 0.6)",
              margin: 0,
              padding: "12px",
              paddingTop: "32px",
              borderRadius:
                shouldShowToggle && isExpanded ? "0.5rem 0.5rem 0 0" : "0.5rem",
            }}
          >
            {children}
          </SyntaxHighlighter>
          <div className="absolute top-2 right-3 text-xs text-muted-foreground bg-[rgba(25,24,21,0.8)] px-2 py-1 rounded">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </div>
        </div>
        {shouldShowToggle && !isExpanded && (
          <button
            onClick={handleToggle}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors duration-100 flex items-center justify-center gap-1 bg-background/90 cursor-pointer"
          >
            Show more ({lineCount} lines)
            <svg
              className={`w-3 h-3 transition-transform duration-100 ${
                isExpanded && "rotate-180"
              }`}
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
          <div className="border-t border-[rgba(45,44,40,0.8)] bg-[rgba(45,44,40,0.4)] rounded-b-lg">
            <button
              onClick={handleToggle}
              className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors duration-100 flex items-center justify-center gap-1 cursor-pointer hover:bg-[rgba(45,44,40,0.6)] rounded-b-lg"
            >
              Show less
              <svg
                className={`w-3 h-3 transition-transform duration-100 ${
                  isExpanded && "rotate-180"
                }`}
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
    </div>
  );
}

// Post-process HTML to add custom styling classes
function addCustomStyling(html: string): string {
  return (
    html
      // Paragraphs
      .replace(/<p>/g, '<p class="mb-2 last:mb-0">')
      // Headings
      .replace(/<h1>/g, '<h1 class="text-lg font-semibold mb-2">')
      .replace(/<h2>/g, '<h2 class="text-base font-semibold mb-2">')
      .replace(/<h3>/g, '<h3 class="text-sm font-semibold mb-1">')
      .replace(/<h4>/g, '<h4 class="text-sm font-semibold mb-1">')
      .replace(/<h5>/g, '<h5 class="text-sm font-semibold mb-1">')
      .replace(/<h6>/g, '<h6 class="text-sm font-semibold mb-1">')
      // Lists
      .replace(/<ul>/g, '<ul class="list-disc list-inside mb-2 ml-4">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-2 ml-4">')
      .replace(/<li>/g, '<li class="mb-1">')
      // Blockquotes
      .replace(
        /<blockquote>/g,
        '<blockquote class="border-l-2 border-accent/30 pl-4 italic mb-2">'
      )
      // Text formatting
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<em>/g, '<em class="italic">')
      // Links
      .replace(
        /<a href="([^"]*)">/g,
        '<a href="$1" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">'
      )
      // Inline code
      .replace(
        /<code>/g,
        '<code class="px-1 py-0.5 rounded text-xs font-mono" style="background-color: rgba(45, 44, 40, 0.4);">'
      )
  );
}

// Component to render markdown with custom code block handling
function MarkdownRenderer({ content }: { content: string }) {
  const [processedContent, setProcessedContent] = useState<{
    html: string;
    codeBlocks: Array<{
      id: string;
      language: string;
      code: string;
      placeholder: string;
    }>;
  }>({ html: "", codeBlocks: [] });

  useEffect(() => {
    if (!content) {
      setProcessedContent({ html: "", codeBlocks: [] });
      return;
    }

    try {
      // Extract code blocks first
      const codeBlocks: Array<{
        id: string;
        language: string;
        code: string;
        placeholder: string;
      }> = [];
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;
      let contentWithPlaceholders = content;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        const id = Math.random().toString(36).substr(2, 9);
        const placeholder = `__CODE_BLOCK_${id}__`;
        codeBlocks.push({
          id,
          language: match[1] || "",
          code: match[2].trim(),
          placeholder,
        });

        // Replace the code block with a placeholder
        contentWithPlaceholders = contentWithPlaceholders.replace(
          match[0],
          `\n\n${placeholder}\n\n`
        );
      }

      // Generate HTML from markdown (without code blocks)
      const rawHtml = micromark(contentWithPlaceholders, {
        extensions: [gfm()],
        htmlExtensions: [gfmHtml()],
      });

      // Add custom styling
      const styledHtml = addCustomStyling(rawHtml);

      setProcessedContent({ html: styledHtml, codeBlocks });
    } catch (error) {
      console.error("Error rendering markdown:", error);
      setProcessedContent({
        html: `<p class="mb-2 last:mb-0">${content}</p>`,
        codeBlocks: [],
      });
    }
  }, [content]);

  // Split HTML by code block placeholders and render
  const renderContent = () => {
    const { html, codeBlocks } = processedContent;

    if (codeBlocks.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    // Split HTML by placeholders and intersperse with code blocks
    let currentHtml = html;
    const elements: React.ReactNode[] = [];

    codeBlocks.forEach((block, index) => {
      const parts = currentHtml.split(block.placeholder);

      if (parts.length > 1) {
        // Add the HTML before the code block
        if (parts[0].trim()) {
          elements.push(
            <div
              key={`text-${index}`}
              dangerouslySetInnerHTML={{ __html: parts[0] }}
            />
          );
        }

        // Add the code block
        elements.push(
          <CollapsibleCodeBlock
            key={`code-${block.id}`}
            language={block.language}
          >
            {block.code}
          </CollapsibleCodeBlock>
        );

        // Continue with the rest of the HTML
        currentHtml = parts.slice(1).join(block.placeholder);
      }
    });

    // Add any remaining HTML
    if (currentHtml.trim()) {
      elements.push(
        <div
          key="text-final"
          dangerouslySetInnerHTML={{ __html: currentHtml }}
        />
      );
    }

    return <>{elements}</>;
  };

  return <>{renderContent()}</>;
}

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  return (
    <div className={className}>
      <MarkdownRenderer content={content} />

      {/* Streaming indicator */}
      {isStreaming && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-flex items-center gap-1 mt-2"
        >
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
        </motion.div>
      )}
    </div>
  );
}
