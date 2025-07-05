import React from "react";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import DOMPurify from "dompurify";

// Shared collapsible code block component
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
  }, [lineCount]); // Only depend on lineCount, not children

  const maxHeight = shouldShowToggle && !isExpanded ? "25vh" : "none";

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Adjust background colors based on whether it's a user message
  const codeBlockBg = isUserMessage
    ? "rgba(25, 24, 21, 0.8)" // Darker for user messages
    : "rgba(45, 44, 40, 0.6)"; // Original for assistant messages

  const expandButtonBg = isUserMessage
    ? "rgba(25, 24, 21, 0.9)" // Darker for user messages
    : "rgba(45, 44, 40, 0.4)"; // Original for assistant messages

  const expandButtonBorder = isUserMessage
    ? "rgba(25, 24, 21, 0.9)" // Darker for user messages
    : "rgba(45, 44, 40, 0.8)"; // Original for assistant messages

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
            backgroundColor: codeBlockBg,
            margin: 0,
            padding: "12px",
            borderRadius:
              shouldShowToggle && isExpanded ? "0.5rem 0.5rem 0 0" : "0.5rem",
          }}
        >
          {/* Code content is safely rendered by SyntaxHighlighter - no need for additional sanitization */}
          {children}
        </SyntaxHighlighter>
      </div>
      {shouldShowToggle && !isExpanded && (
        <button
          onClick={handleToggle}
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1"
          style={{ backgroundColor: expandButtonBg }}
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
            borderColor: expandButtonBorder,
            backgroundColor: expandButtonBg,
          }}
        >
          <button
            onClick={handleToggle}
            className="w-full px-3 py-2 text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1 rounded-b-lg"
            style={{
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isUserMessage
                ? "rgba(25, 24, 21, 0.6)"
                : "rgba(45, 44, 40, 0.6)";
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

// Shared markdown styling function
export function addCustomStyling(
  html: string,
  isUserMessage: boolean = false
): string {
  const inlineCodeBg = isUserMessage
    ? "rgba(25, 24, 21, 0.6)" // Darker for user messages
    : "rgba(45, 44, 40, 0.4)"; // Original for assistant messages

  const styledHtml = html
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
    .replace(
      /<ol>/g,
      '<ol class="list-decimal list-outside mb-4 space-y-1 pl-6">'
    )
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
      `<code class="px-1 py-0.5 rounded text-xs font-mono" style="background-color: ${inlineCodeBg};">`
    );

  // Sanitize the HTML to prevent XSS attacks
  return DOMPurify.sanitize(styledHtml, {
    ALLOWED_TAGS: [
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "hr",
      "strong",
      "em",
      "a",
      "code",
      "pre",
      "br",
    ],
    ALLOWED_ATTR: ["class", "href", "target", "rel", "style"],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

// Shared complex content renderer with code block support
export function renderComplexContent(
  text: string,
  isUserMessage: boolean = false
) {
  const parts: React.JSX.Element[] = [];
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
        if (currentIndex < i) {
          // Add any preceding content
          const precedingContent = lines.slice(currentIndex, i).join("\n");
          if (precedingContent.trim()) {
            const html = micromark(precedingContent, {
              extensions: [gfm()],
              htmlExtensions: [gfmHtml()],
            });
            const styledHtml = addCustomStyling(html, isUserMessage);
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
            isUserMessage={isUserMessage}
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

  // Handle incomplete code block or remaining content
  if (currentIndex < lines.length) {
    const remainingContent = lines.slice(currentIndex).join("\n");

    if (inCodeBlock && codeBlockContent.trim()) {
      // We're in an incomplete code block - render it as a code block
      parts.push(
        <CollapsibleCodeBlock
          key={`code-${parts.length}`}
          language={codeBlockLanguage}
          isUserMessage={isUserMessage}
        >
          {codeBlockContent}
        </CollapsibleCodeBlock>
      );
    } else if (remainingContent.trim()) {
      // Regular content - render as markdown
      const html = micromark(remainingContent, {
        extensions: [gfm()],
        htmlExtensions: [gfmHtml()],
      });
      const styledHtml = addCustomStyling(html, isUserMessage);
      parts.push(
        <div
          key={`text-${parts.length}`}
          dangerouslySetInnerHTML={{ __html: styledHtml }}
        />
      );
    }
  }

  // If no parts were created, render the entire content as markdown
  if (parts.length === 0 && text.trim()) {
    const html = micromark(text, {
      extensions: [gfm()],
      htmlExtensions: [gfmHtml()],
    });
    const styledHtml = addCustomStyling(html, isUserMessage);
    return <div dangerouslySetInnerHTML={{ __html: styledHtml }} />;
  }

  return <div>{parts}</div>;
}

// Simple markdown renderer (for basic content without code blocks)
export function renderMarkdown(
  content: string,
  isUserMessage: boolean = false
): string {
  const html = micromark(content, {
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });
  return addCustomStyling(html, isUserMessage);
}
