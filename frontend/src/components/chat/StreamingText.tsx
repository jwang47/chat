import { useState, useEffect, useRef, useMemo } from "react";
import React from "react";
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

// Helper function to split HTML into individual elements
function splitHtmlIntoElements(html: string): string[] {
  if (!html.trim()) return [];

  // Create a temporary DOM element to parse the HTML properly
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const elements: string[] = [];

  // Process each top-level child element
  Array.from(tempDiv.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Special handling for blockquotes - split them into individual lines
      if (element.tagName.toLowerCase() === "blockquote") {
        const paragraphs = element.querySelectorAll("p");
        if (paragraphs.length === 1) {
          // Check if the single paragraph contains newlines
          const pContent = paragraphs[0].textContent || "";
          const lines = pContent.split("\n").filter((line) => line.trim());

          if (lines.length > 1) {
            // Split into individual lines, each wrapped in its own blockquote
            lines.forEach((line) => {
              const singleBlockquote = document.createElement("blockquote");
              singleBlockquote.className = element.className;
              const p = document.createElement("p");
              p.className = paragraphs[0].className;
              p.textContent = line.trim();
              singleBlockquote.appendChild(p);
              elements.push(singleBlockquote.outerHTML);
            });
          } else {
            // Single line blockquote, keep as is
            elements.push(element.outerHTML);
          }
        } else if (paragraphs.length > 1) {
          // Multiple paragraphs, split them into individual blockquotes
          paragraphs.forEach((p) => {
            const singleBlockquote = document.createElement("blockquote");
            singleBlockquote.className = element.className;
            singleBlockquote.appendChild(p.cloneNode(true));
            elements.push(singleBlockquote.outerHTML);
          });
        } else {
          // No paragraphs, keep as is
          elements.push(element.outerHTML);
        }
      } else {
        // For other element nodes, get the complete HTML including all children
        elements.push(element.outerHTML);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // For text nodes, only add if they have meaningful content
      const textContent = node.textContent?.trim();
      if (textContent) {
        elements.push(`<p class="mb-2 last:mb-0">${textContent}</p>`);
      }
    }
  });

  return elements.filter((el) => el.trim().length > 0);
}

// Component to render markdown with custom code block handling
function MarkdownRenderer({ content }: { content: string }) {
  const processedContent = useMemo(() => {
    if (!content) {
      return { elements: [] };
    }

    try {
      const elements: React.ReactNode[] = [];
      let remainingContent = content;
      let elementIndex = 0;

      // Check if we're in the middle of a code block (for streaming)
      const openCodeBlocks = (content.match(/```/g) || []).length;
      const isInCodeBlock = openCodeBlocks % 2 === 1;

      // If we're in a code block, temporarily close it for processing
      let contentToProcess = remainingContent;
      let incompleteCodeBlock: { language: string; code: string } | null = null;

      if (isInCodeBlock) {
        // Find the last opening ```
        const lastCodeBlockStart = content.lastIndexOf("```");
        if (lastCodeBlockStart !== -1) {
          const beforeCodeBlock = content.substring(0, lastCodeBlockStart);
          const codeBlockContent = content.substring(lastCodeBlockStart);

          // Extract language and code
          const languageMatch = codeBlockContent.match(/```(\w+)?\n([\s\S]*)/);
          if (languageMatch) {
            const language = languageMatch[1] || "";
            const code = languageMatch[2];

            incompleteCodeBlock = { language, code };
            contentToProcess = beforeCodeBlock;
          }
        }
      }

      // Process the complete content (without the incomplete code block)
      remainingContent = contentToProcess;

      // Process content sequentially
      while (remainingContent) {
        // Find the next code block
        const codeBlockMatch = remainingContent.match(
          /```(\w+)?\n([\s\S]*?)```/
        );

        if (codeBlockMatch) {
          const beforeCodeBlock = remainingContent.substring(
            0,
            codeBlockMatch.index
          );
          const language = codeBlockMatch[1] || "";
          const code = codeBlockMatch[2].trim();

          // Add content before the code block
          if (beforeCodeBlock.trim()) {
            const html = micromark(beforeCodeBlock, {
              extensions: [gfm()],
              htmlExtensions: [gfmHtml()],
            });
            const styledHtml = addCustomStyling(html);

            // Split the HTML into individual elements
            const htmlElements = splitHtmlIntoElements(styledHtml);

            htmlElements.forEach((elementHtml) => {
              elements.push(
                <motion.div
                  key={`html-${elementIndex++}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  dangerouslySetInnerHTML={{ __html: elementHtml }}
                />
              );
            });
          }

          // Add the code block
          elements.push(
            <motion.div
              key={`code-${elementIndex++}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <CollapsibleCodeBlock language={language}>
                {code}
              </CollapsibleCodeBlock>
            </motion.div>
          );

          // Continue with the rest of the content
          remainingContent = remainingContent.substring(
            codeBlockMatch.index! + codeBlockMatch[0].length
          );
        } else {
          // No more code blocks, process the remaining content
          if (remainingContent.trim()) {
            const html = micromark(remainingContent, {
              extensions: [gfm()],
              htmlExtensions: [gfmHtml()],
            });
            const styledHtml = addCustomStyling(html);

            // Split the HTML into individual elements
            const htmlElements = splitHtmlIntoElements(styledHtml);

            htmlElements.forEach((elementHtml) => {
              elements.push(
                <motion.div
                  key={`html-${elementIndex++}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  dangerouslySetInnerHTML={{ __html: elementHtml }}
                />
              );
            });
          }
          break;
        }
      }

      // Add the incomplete code block if we have one
      if (incompleteCodeBlock) {
        elements.push(
          <motion.div
            key={`incomplete-code-${elementIndex++}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <CollapsibleCodeBlock language={incompleteCodeBlock.language}>
              {incompleteCodeBlock.code}
            </CollapsibleCodeBlock>
          </motion.div>
        );
      }

      return { elements };
    } catch (error) {
      console.error("Error rendering markdown:", error);
      return {
        elements: [
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            dangerouslySetInnerHTML={{
              __html: `<p class="mb-2 last:mb-0">${content}</p>`,
            }}
          />,
        ],
      };
    }
  }, [content]);

  return <>{processedContent.elements}</>;
}

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  const [renderedBlocks, setRenderedBlocks] = useState<React.ReactNode[]>([]);
  const [lastContentHash, setLastContentHash] = useState<string>("");
  const elementIndexRef = useRef(0);
  const prevIsStreamingRef = useRef(isStreaming);

  // Debug: Log when streaming is complete
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      console.log("🎯 STREAMING COMPLETE - Full LLM Output:");
      console.log("Content length:", content.length);
      console.log("Full content:", content);
      console.log("─".repeat(80));
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, content]);

  // Simple hash function for content comparison
  const hashContent = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  // Process content and generate blocks
  useEffect(() => {
    if (!content) {
      setRenderedBlocks([]);
      setLastContentHash("");
      elementIndexRef.current = 0;
      return;
    }

    // Check if content has actually changed
    const currentHash = hashContent(content);
    if (currentHash === lastContentHash) {
      return;
    }

    try {
      const elements: React.ReactNode[] = [];
      let remainingContent = content;
      let elementIndex = 0;

      // Check if we're in the middle of a code block (for streaming)
      const openCodeBlocks = (content.match(/```/g) || []).length;
      const isInCodeBlock = openCodeBlocks % 2 === 1;

      // If we're in a code block, temporarily close it for processing
      let contentToProcess = remainingContent;
      let incompleteCodeBlock: { language: string; code: string } | null = null;

      if (isInCodeBlock) {
        // Find the last opening ```
        const lastCodeBlockStart = content.lastIndexOf("```");
        if (lastCodeBlockStart !== -1) {
          const beforeCodeBlock = content.substring(0, lastCodeBlockStart);
          const codeBlockContent = content.substring(lastCodeBlockStart);

          // Extract language and code
          const languageMatch = codeBlockContent.match(/```(\w+)?\n([\s\S]*)/);
          if (languageMatch) {
            const language = languageMatch[1] || "";
            const code = languageMatch[2];

            incompleteCodeBlock = { language, code };
            contentToProcess = beforeCodeBlock;
          }
        }
      }

      // Process the complete content (without the incomplete code block)
      remainingContent = contentToProcess;

      // Process content sequentially
      while (remainingContent) {
        // Find the next code block
        const codeBlockMatch = remainingContent.match(
          /```(\w+)?\n([\s\S]*?)```/
        );

        if (codeBlockMatch) {
          const beforeCodeBlock = remainingContent.substring(
            0,
            codeBlockMatch.index
          );
          const language = codeBlockMatch[1] || "";
          const code = codeBlockMatch[2].trim();

          // Add content before the code block
          if (beforeCodeBlock.trim()) {
            const html = micromark(beforeCodeBlock, {
              extensions: [gfm()],
              htmlExtensions: [gfmHtml()],
            });
            const styledHtml = addCustomStyling(html);

            // Split the HTML into individual elements
            const htmlElements = splitHtmlIntoElements(styledHtml);

            htmlElements.forEach((elementHtml) => {
              elements.push(
                <motion.div
                  key={`html-${elementIndex++}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  dangerouslySetInnerHTML={{ __html: elementHtml }}
                />
              );
            });
          }

          // Add the code block
          elements.push(
            <motion.div
              key={`code-${elementIndex++}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <CollapsibleCodeBlock language={language}>
                {code}
              </CollapsibleCodeBlock>
            </motion.div>
          );

          // Continue with the rest of the content
          remainingContent = remainingContent.substring(
            codeBlockMatch.index! + codeBlockMatch[0].length
          );
        } else {
          // No more code blocks, process the remaining content
          if (remainingContent.trim()) {
            const html = micromark(remainingContent, {
              extensions: [gfm()],
              htmlExtensions: [gfmHtml()],
            });
            const styledHtml = addCustomStyling(html);

            // Split the HTML into individual elements
            const htmlElements = splitHtmlIntoElements(styledHtml);

            htmlElements.forEach((elementHtml) => {
              elements.push(
                <motion.div
                  key={`html-${elementIndex++}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  dangerouslySetInnerHTML={{ __html: elementHtml }}
                />
              );
            });
          }
          break;
        }
      }

      // Add the incomplete code block if we have one
      if (incompleteCodeBlock) {
        elements.push(
          <motion.div
            key={`incomplete-code-${elementIndex++}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <CollapsibleCodeBlock language={incompleteCodeBlock.language}>
              {incompleteCodeBlock.code}
            </CollapsibleCodeBlock>
          </motion.div>
        );
      }

      // Only update if we have different number of elements or content changed significantly
      setRenderedBlocks((prevBlocks) => {
        if (prevBlocks.length !== elements.length) {
          return elements;
        }
        return prevBlocks;
      });

      setLastContentHash(currentHash);
    } catch (error) {
      console.error("Error processing streaming content:", error);
    }
  }, [content, lastContentHash]);

  // Add streaming cursor to the last block if streaming
  const displayBlocks = useMemo(() => {
    if (!isStreaming || !content || renderedBlocks.length === 0) {
      return renderedBlocks;
    }

    // Add cursor as a separate element after the blocks
    return [
      ...renderedBlocks,
      <span key="streaming-cursor" className="animate-pulse">
        █
      </span>,
    ];
  }, [renderedBlocks, isStreaming, content]);

  return (
    <div className={className}>
      {displayBlocks}

      {/* Streaming indicator */}
      {isStreaming && !content && (
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
