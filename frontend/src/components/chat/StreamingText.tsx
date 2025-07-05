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
    <div className="relative mb-4">
      <div
        ref={codeRef}
        className={`overflow-hidden transition-all duration-500 rounded-lg ${
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
            className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors duration-500 flex items-center justify-center gap-1 bg-background/90 cursor-pointer"
          >
            Show more ({lineCount} lines)
            <svg
              className={`w-3 h-3 transition-transform duration-500 ${
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
              className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors duration-500 flex items-center justify-center gap-1 cursor-pointer hover:bg-[rgba(45,44,40,0.6)] rounded-b-lg"
            >
              Show less
              <svg
                className={`w-3 h-3 transition-transform duration-500 ${
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
      // Paragraphs - preserve whitespace for better formatting, but not for paragraphs with inline code
      .replace(
        /<p>(?![^<]*<code)/g,
        '<p class="mt-4 mb-4 whitespace-pre-line">'
      )
      .replace(/<center>/g, '<div class="flex justify-center mb-4 last:mb-0">')
      .replace(/<p>(?=[^<]*<code)/g, '<p class="mb-4 last:mb-0">')
      // Headings - larger spacing for better hierarchy
      .replace(
        /<h1>/g,
        '<h1 class="text-xl font-semibold mb-3 mt-6 first:mt-0">'
      )
      .replace(
        /<h2>/g,
        '<h2 class="text-lg font-semibold mb-3 mt-5 first:mt-0">'
      )
      .replace(
        /<h3>/g,
        '<h3 class="text-base font-semibold mb-2 mt-4 first:mt-0">'
      )
      .replace(
        /<h4>/g,
        '<h4 class="text-sm font-semibold mb-2 mt-3 first:mt-0">'
      )
      .replace(
        /<h5>/g,
        '<h5 class="text-sm font-semibold mb-2 mt-3 first:mt-0">'
      )
      .replace(
        /<h6>/g,
        '<h6 class="text-sm font-semibold mb-2 mt-3 first:mt-0">'
      )
      // Lists - better spacing
      .replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 space-y-1">')
      .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-4 space-y-1">')
      .replace(/<li>/g, '<li class="">')
      // Fix list items with paragraphs - remove margin from paragraphs inside list items
      .replace(
        /<li class="">\s*<p class="mb-4 last:mb-0([^"]*)">/g,
        '<li class=""><p class="mb-0$1">'
      )
      // Blockquotes - more prominent spacing
      .replace(
        /<blockquote>/g,
        '<blockquote class="border-l-2 border-accent/30 pl-4 italic mb-4 mt-2 whitespace-pre-line">'
      )
      // Horizontal rules
      .replace(
        /<hr\s*\/?>/g,
        '<hr class="border-0 h-px bg-muted-foreground/20 my-6" />'
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

// Helper function to parse content into complete markdown elements
function parseContentIntoElements(content: string): string[] {
  if (!content.trim()) return [];

  const elements: string[] = [];
  let currentElement = "";
  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockContent = "";

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block markers
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        // Starting a code block
        // First, save any current element
        if (currentElement.trim()) {
          elements.push(currentElement.trim());
          currentElement = "";
        }

        inCodeBlock = true;
        codeBlockLanguage = line.substring(3).trim();
        codeBlockContent = "";
      } else {
        // Ending a code block
        inCodeBlock = false;
        elements.push(
          `\`\`\`${codeBlockLanguage}\n${codeBlockContent}\n\`\`\``
        );
        codeBlockLanguage = "";
        codeBlockContent = "";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? "\n" : "") + line;
      continue;
    }

    // Handle different markdown elements
    if (line.trim() === "") {
      // Empty line - if we have a current element, complete it
      if (currentElement.trim()) {
        elements.push(currentElement.trim());
        currentElement = "";
      }
    } else if (line.match(/^#{1,6}\s/)) {
      // Heading - complete any current element first
      if (currentElement.trim()) {
        elements.push(currentElement.trim());
        currentElement = "";
      }
      elements.push(line);
    } else if (line.match(/^>\s/)) {
      // Blockquote - complete any current element first
      if (currentElement.trim()) {
        elements.push(currentElement.trim());
        currentElement = "";
      }
      elements.push(line);
    } else if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/)) {
      // List item
      if (
        currentElement.trim() &&
        !currentElement.includes("- ") &&
        !currentElement.includes("* ") &&
        !currentElement.match(/\d+\./)
      ) {
        // Complete non-list element
        elements.push(currentElement.trim());
        currentElement = "";
      }
      currentElement += (currentElement ? "\n" : "") + line;
    } else {
      // Regular paragraph content
      if (
        currentElement.trim() &&
        (currentElement.includes("- ") ||
          currentElement.includes("* ") ||
          currentElement.match(/\d+\./))
      ) {
        // Complete list element
        elements.push(currentElement.trim());
        currentElement = "";
      }
      currentElement += (currentElement ? "\n" : "") + line;
    }
  }

  // Add any remaining element
  if (currentElement.trim()) {
    elements.push(currentElement.trim());
  }

  // Handle incomplete code block (streaming)
  if (inCodeBlock) {
    // Don't add incomplete code blocks - they'll be hidden during streaming
    return elements;
  }

  return elements.filter((el) => el.trim().length > 0);
}

// Common animation settings for all blocks
const blockAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: {
    duration: 1.0,
    ease: "easeInOut" as const,
    delay: 0,
  },
};

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  const [renderedBlocks, setRenderedBlocks] = useState<React.ReactNode[]>([]);
  const [lastProcessedElements, setLastProcessedElements] = useState<string[]>(
    []
  );
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

  // Generate stable key for an element based on its content
  const generateElementKey = (element: string, index: number): string => {
    // Use a simple hash of the content combined with index for uniqueness
    const hash = element.split("").reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    return `${index}-${Math.abs(hash)}`;
  };

  // Process content and generate blocks
  useEffect(() => {
    if (!content) {
      setRenderedBlocks([]);
      setLastProcessedElements([]);
      return;
    }

    try {
      // Parse content into complete markdown elements
      const markdownElements = parseContentIntoElements(content);

      // Only process elements that are complete (during streaming)
      let elementsToProcess = markdownElements;

      if (isStreaming) {
        // During streaming, only show complete elements
        // Check if the last element might be incomplete
        const lastElement = markdownElements[markdownElements.length - 1];
        if (lastElement) {
          // More sophisticated check for complete elements
          const isCompleteElement =
            lastElement.endsWith(".") ||
            lastElement.endsWith("!") ||
            lastElement.endsWith("?") ||
            lastElement.endsWith(":") ||
            lastElement.endsWith(";") ||
            lastElement.match(/```$/) ||
            lastElement.match(/^#{1,6}\s/) || // Headings are usually complete
            lastElement.match(/^>\s/) || // Blockquotes
            lastElement.match(/^\d+\.\s.*[.!?]$/) || // Numbered list items that end with punctuation
            lastElement.match(/^[-*+]\s.*[.!?]$/) || // Bullet list items that end with punctuation
            (lastElement.trim().length < 15 && lastElement.trim().length > 0); // Very short elements are likely complete

          if (!isCompleteElement) {
            // Last element might be incomplete, exclude it during streaming
            elementsToProcess = markdownElements.slice(0, -1);
          }
        }
      }

      // Check if we need to update (only if elements changed)
      const elementsChanged =
        JSON.stringify(elementsToProcess) !==
        JSON.stringify(lastProcessedElements);

      if (!elementsChanged) {
        return;
      }

      console.log("🔄 Processing elements:", {
        total: elementsToProcess.length,
        isStreaming,
        elements: elementsToProcess.map((el, i) => ({
          index: i,
          type: el.startsWith("```") ? "code" : "text",
          length: el.length,
          preview: el.substring(0, 50) + (el.length > 50 ? "..." : ""),
        })),
      });

      // Only process new elements that haven't been rendered yet
      const newElementsStartIndex = lastProcessedElements.length;
      const newElements = elementsToProcess.slice(newElementsStartIndex);

      if (newElements.length === 0) {
        return;
      }

      // Create blocks for new elements only
      const newBlocks: React.ReactNode[] = [];

      newElements.forEach((markdownElement, relativeIndex) => {
        const absoluteIndex = newElementsStartIndex + relativeIndex;
        const elementKey = generateElementKey(markdownElement, absoluteIndex);

        if (markdownElement.startsWith("```")) {
          // Code block
          const lines = markdownElement.split("\n");
          const language = lines[0].substring(3).trim();
          const code = lines.slice(1, -1).join("\n");

          newBlocks.push(
            <motion.div key={`code-${elementKey}`} {...blockAnimation}>
              <CollapsibleCodeBlock language={language}>
                {code}
              </CollapsibleCodeBlock>
            </motion.div>
          );
        } else {
          // Regular markdown element
          const html = micromark(markdownElement, {
            extensions: [gfm()],
            htmlExtensions: [gfmHtml()],
          });
          const styledHtml = addCustomStyling(html);

          newBlocks.push(
            <motion.div
              key={`element-${elementKey}`}
              {...blockAnimation}
              dangerouslySetInnerHTML={{ __html: styledHtml }}
            />
          );
        }
      });

      // Append new blocks to existing ones
      setRenderedBlocks((prevBlocks) => [...prevBlocks, ...newBlocks]);
      setLastProcessedElements(elementsToProcess);
    } catch (error) {
      console.error("Error processing streaming content:", error);
    }
  }, [content, isStreaming, lastProcessedElements]);

  // Add streaming cursor to the last block if streaming
  const displayBlocks = useMemo(() => {
    return renderedBlocks;
  }, [renderedBlocks]);

  return (
    <div className={`${className} [&>*:last-child]:mb-0`}>
      {displayBlocks}

      {/* Streaming indicator */}
      {isStreaming && !content && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="inline-flex items-center gap-1"
        >
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.0, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.0,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-1 h-1 bg-accent rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.0,
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
