import { useEffect, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

interface StreamingMarkdownProps {
  content: string; // streaming text
  className?: string;
}

export function StreamingMarkdown({
  content,
  className,
}: StreamingMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef(""); // buffer full markdown
  const frameRef = useRef<number | null>(null);

  // Configure marked renderer for syntax highlighting
  const renderer = new marked.Renderer();
  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    if (lang && hljs.getLanguage(lang)) {
      const highlighted = hljs.highlight(text, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    }
    const highlighted = hljs.highlightAuto(text).value;
    return `<pre><code class="hljs">${highlighted}</code></pre>`;
  };

  useEffect(() => {
    if (content.length <= bufferRef.current.length) return;

    bufferRef.current = content;

    if (frameRef.current !== null) return; // avoid multiple renders per frame

    frameRef.current = requestAnimationFrame(() => {
      const rawHtml = marked.parse(bufferRef.current, { renderer }) as string;
      const safeHtml = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ["center"],
        ADD_ATTR: ["class"],
      });

      if (containerRef.current) {
        containerRef.current.innerHTML = safeHtml;
      }

      frameRef.current = null;
    });
  }, [content]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      bufferRef.current = "";
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className + " prose prose-invert max-w-none"}
    />
  );
}
