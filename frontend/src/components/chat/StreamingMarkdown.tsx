import { useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import { DiffDOM } from "diff-dom";

interface StreamingMarkdownProps {
  content: string;
  className?: string;
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function StreamingMarkdown({
  content,
  className,
}: StreamingMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLenRef = useRef(0);
  const dd = useMemo(() => new DiffDOM(), []);

  /* syntax-highlighting renderer */
  const renderer = useMemo(() => {
    const r = new marked.Renderer();
    r.code = ({ text, lang }: { text: string; lang?: string }) => {
      const language = (lang || "").trim().split(/\s+/)[0];
      const html =
        language && hljs.getLanguage(language)
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value;
      return `<pre><code class="hljs language-${language}">${html}</code></pre>`;
    };
    return r;
  }, []);

  /* debounced DOM patch */
  const updateDOM = useMemo(
    () =>
      debounce(async () => {
        if (!containerRef.current) return;

        const sel = window.getSelection();
        const mark = sel?.rangeCount ? sel.getRangeAt(0).cloneRange() : null;

        const raw = await marked.parse(content, { renderer });
        const safe = DOMPurify.sanitize(raw);

        const temp = document.createElement("div");
        temp.innerHTML = safe;

        const diff = dd.diff(containerRef.current, temp);
        dd.apply(containerRef.current, diff);

        // apply highlight.js to any new blocks
        containerRef.current.querySelectorAll("pre code").forEach((el) => {
          if (!el.classList.contains("hljs"))
            hljs.highlightElement(el as HTMLElement);
        });

        if (mark) {
          sel?.removeAllRanges();
          sel?.addRange(mark);
        }
      }, 150),
    [content, dd, renderer]
  );

  /* stream in only when content grows */
  useEffect(() => {
    if (content.length > lastLenRef.current) {
      lastLenRef.current = content.length;
      updateDOM();
    }
  }, [content, updateDOM]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      lastLenRef.current = 0;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${className ?? ""} prose prose-invert max-w-none`}
    />
  );
}
