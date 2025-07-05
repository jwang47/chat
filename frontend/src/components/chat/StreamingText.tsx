import { useState, useEffect } from "react";
import React from "react";
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

  const lineCount = children.split("\n").length;

  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const maxHeight = viewportHeight * 0.25;
    const estimatedHeight = lineCount * 20; // Rough estimate
    setShouldShowToggle(estimatedHeight > maxHeight);
  }, [children, lineCount]);

  const maxHeight = shouldShowToggle && !isExpanded ? "25vh" : "none";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

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
            backgroundColor: "rgba(45, 44, 40, 0.6)",
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
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 bg-background/90"
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
        <div className="border-t border-[rgba(45,44,40,0.8)] bg-[rgba(45,44,40,0.4)] rounded-b-lg">
          <button
            onClick={handleToggle}
            className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 hover:bg-[rgba(45,44,40,0.6)] rounded-b-lg"
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

// Post-process HTML to add custom styling classes
function addCustomStyling(html: string): string {
  return html
    .replace(/<p>/g, '<p class="mb-4 last:mb-0 whitespace-pre-line">')
    .replace(/<h1>/g, '<h1 class="text-xl font-semibold mb-3 mt-6 first:mt-0">')
    .replace(/<h2>/g, '<h2 class="text-lg font-semibold mb-3 mt-5 first:mt-0">')
    .replace(
      /<h3>/g,
      '<h3 class="text-base font-semibold mb-2 mt-4 first:mt-0">'
    )
    .replace(/<h4>/g, '<h4 class="text-sm font-semibold mb-2 mt-3 first:mt-0">')
    .replace(/<h5>/g, '<h5 class="text-sm font-semibold mb-2 mt-3 first:mt-0">')
    .replace(/<h6>/g, '<h6 class="text-sm font-semibold mb-2 mt-3 first:mt-0">')
    .replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 space-y-1">')
    .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-4 space-y-1">')
    .replace(/<li>/g, '<li class="">')
    .replace(
      /<li class="">\s*<p class="mb-4 last:mb-0([^"]*)">/g,
      '<li class=""><p class="mb-0$1">'
    )
    .replace(
      /<blockquote>/g,
      '<blockquote class="border-l-2 border-accent/30 pl-4 italic mb-4 mt-2 whitespace-pre-line">'
    )
    .replace(
      /<hr\s*\/?>/g,
      '<hr class="border-0 h-px bg-muted-foreground/20 my-6" />'
    )
    .replace(/<strong>/g, '<strong class="font-semibold">')
    .replace(/<em>/g, '<em class="italic">')
    .replace(
      /<a href="([^"]*)">/g,
      '<a href="$1" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">'
    )
    .replace(
      /<code>/g,
      '<code class="px-1 py-0.5 rounded text-xs font-mono" style="background-color: rgba(45, 44, 40, 0.4);">'
    );
}

export function StreamingText({
  content,
  isStreaming,
  className,
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [lastContentUpdate, setLastContentUpdate] = useState(Date.now());
  const [adaptiveDelay, setAdaptiveDelay] = useState(20);

  // Track content arrival speed and adjust typewriter speed accordingly
  useEffect(() => {
    if (content.length > displayedContent.length) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastContentUpdate;

      // Calculate adaptive delay based on content arrival speed
      // If content is arriving fast (< 100ms), speed up typewriter
      // If content is arriving slow (> 500ms), slow down typewriter
      let newDelay = adaptiveDelay;

      if (timeSinceLastUpdate < 100) {
        // Content arriving fast - speed up typewriter (reduce delay)
        newDelay = Math.max(5, adaptiveDelay * 0.8);
      } else if (timeSinceLastUpdate > 500) {
        // Content arriving slow - slow down typewriter (increase delay)
        newDelay = Math.min(50, adaptiveDelay * 1.2);
      }

      setAdaptiveDelay(newDelay);
      setLastContentUpdate(now);
    }
  }, [
    content.length,
    displayedContent.length,
    lastContentUpdate,
    adaptiveDelay,
  ]);

  useEffect(() => {
    if (!isStreaming) {
      // When streaming is complete, show all content immediately
      setDisplayedContent(content);
      return;
    }

    if (content.length <= displayedContent.length) {
      // Content hasn't grown, no need to update
      return;
    }

    // Calculate how many characters to reveal based on content gap
    const contentGap = content.length - displayedContent.length;
    const charsToReveal = Math.min(
      contentGap,
      Math.max(1, Math.floor(contentGap / 10))
    );

    // Typewriter effect - gradually reveal content with adaptive speed
    const timer = setTimeout(() => {
      setDisplayedContent(
        content.substring(0, displayedContent.length + charsToReveal)
      );
    }, adaptiveDelay);

    return () => clearTimeout(timer);
  }, [content, isStreaming, displayedContent, adaptiveDelay]);

  // Reset displayed content when content changes significantly (new message)
  useEffect(() => {
    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
    }
  }, [content, displayedContent.length]);

  // Render the content
  const renderContent = () => {
    if (!displayedContent.trim()) {
      // Show animated dots while waiting for initial response
      if (isStreaming) {
        return (
          <div className="flex items-center space-x-1 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
            </div>
          </div>
        );
      }
      return null;
    }

    // Check if content contains code blocks
    if (displayedContent.includes("```")) {
      return renderComplexContent(displayedContent);
    }

    // Simple content - render as markdown
    const html = micromark(displayedContent, {
      extensions: [gfm()],
      htmlExtensions: [gfmHtml()],
    });
    const styledHtml = addCustomStyling(html);

    return <div dangerouslySetInnerHTML={{ __html: styledHtml }} />;
  };

  const renderComplexContent = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockContent = "";

    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          // Starting code block
          if (currentIndex < parts.length) {
            // Add any preceding content
            const precedingContent = lines.slice(currentIndex, i).join("\n");
            if (precedingContent.trim()) {
              const html = micromark(precedingContent, {
                extensions: [gfm()],
                htmlExtensions: [gfmHtml()],
              });
              const styledHtml = addCustomStyling(html);
              parts.push(
                <div
                  key={`text-${parts.length}`}
                  dangerouslySetInnerHTML={{ __html: styledHtml }}
                />
              );
            }
          }

          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
          codeBlockContent = "";
          currentIndex = i + 1;
        } else {
          // Ending code block
          inCodeBlock = false;
          parts.push(
            <CollapsibleCodeBlock
              key={`code-${parts.length}`}
              language={codeBlockLanguage}
            >
              {codeBlockContent}
            </CollapsibleCodeBlock>
          );
          currentIndex = i + 1;
          codeBlockContent = "";
        }
      } else if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? "\n" : "") + line;
      }
    }

    // Add any remaining content
    if (currentIndex < lines.length) {
      const remainingContent = lines.slice(currentIndex).join("\n");
      if (remainingContent.trim()) {
        const html = micromark(remainingContent, {
          extensions: [gfm()],
          htmlExtensions: [gfmHtml()],
        });
        const styledHtml = addCustomStyling(html);
        parts.push(
          <div
            key={`text-${parts.length}`}
            dangerouslySetInnerHTML={{ __html: styledHtml }}
          />
        );
      }
    }

    return <div>{parts}</div>;
  };

  return (
    <div className={`${className} [&>*:last-child]:mb-0`}>
      {renderContent()}
    </div>
  );
}
