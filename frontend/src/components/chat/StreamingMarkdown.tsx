import { useEffect, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { DiffDOM } from "diff-dom";
import debounce from "lodash/debounce";

interface StreamingMarkdownProps {
  content: string;
  className?: string;
}

export function StreamingMarkdown({
  content,
  className,
}: StreamingMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef("");
  const diffDom = useRef(new DiffDOM());

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

  // Save selection
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  };

  // Restore selection
  const restoreSelection = (range: Range | null) => {
    if (range) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  // Debounced DOM update
  const updateDOM = debounce(() => {
    if (!containerRef.current) return;

    const selection = saveSelection();
    const rawHtml = marked.parse(content, { renderer }) as string;
    const safeHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ["center"],
      ADD_ATTR: ["class"],
    });

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = safeHtml;
    diffDom.current.diff(containerRef.current, tempDiv);
    diffDom.current.apply(
      containerRef.current,
      diffDom.current.diff(containerRef.current, tempDiv)
    );
    restoreSelection(selection);
  }, 150);

  useEffect(() => {
    if (content.length <= bufferRef.current.length) return;
    bufferRef.current = content;
    updateDOM();
  }, [content]);

  useEffect(() => {
    return () => {
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
