import { useEffect, useRef, useCallback } from "react";

/**
 * Scrolls to bottom whenever `dep` changes, but
 * stops auto-scrolling if the user scrolls >40 px up.
 */
export function useAutoScroll<T>(dep: T) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const freeze = useRef(false);

  const handleScroll = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // distance in px from bottom
    freeze.current = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
  }, []);

  useEffect(() => {
    if (freeze.current) return;
    const el = wrapperRef.current;
    el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [dep]);

  return { wrapperRef, handleScroll };
}
