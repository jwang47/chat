import { useRef, useCallback, useEffect } from "react";
import { useSmoothScroll } from "./useSmoothScroll"; // Assuming this path is correct

interface UseChatScrollOptions {
  lerp?: boolean;
  lerpFactor?: number;
  maxScrollPerSecond?: number;
  duration?: number;
}

export function useChatScroll(options?: UseChatScrollOptions) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const hasInitialScrolled = useRef(false);

  const smoothScrollOptions = {
    lerp: true, 
    lerpFactor: 0.08, 
    maxScrollPerSecond: 100,
    duration: 800,
    ...options, // Override defaults with provided options
  };

  const { smoothScrollToBottom, cancelScroll, onUserScroll } = useSmoothScroll(
    smoothScrollOptions,
  );

  const getScrollElement = useCallback(() => {
    if (scrollElementRef.current) return scrollElementRef.current;

    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return null;

    const element = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;

    if (element) {
      scrollElementRef.current = element;
    }

    return element;
  }, []);

  const isAtBottom = useCallback(() => {
    const scrollableElement = getScrollElement();
    if (!scrollableElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
    // Use a small threshold (5px) to account for sub-pixel rendering
    return scrollTop + clientHeight >= scrollHeight - 5;
  }, [getScrollElement]);

  const scrollToBottom = useCallback(
    (immediate = false) => {
      const scrollableElement = getScrollElement();
      if (scrollableElement) {
        if (immediate) {
          scrollableElement.scrollTop = scrollableElement.scrollHeight;
        } else {
          smoothScrollToBottom(scrollableElement);
        }
      }
    },
    [smoothScrollToBottom, getScrollElement],
  );

  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const currentScrollTop = target.scrollTop;
      const scrollDirection = currentScrollTop - lastScrollTopRef.current;

      // Only process significant scroll changes (> 1 pixel) to reduce noise
      if (Math.abs(scrollDirection) < 1) {
        return;
      }

      onUserScroll(currentScrollTop);

      // Break autoscroll immediately when user scrolls up any significant amount
      // Use a threshold to avoid breaking on tiny movements
      if (scrollDirection < -2) {
        shouldAutoScrollRef.current = false;
        isUserScrollingRef.current = true;
        cancelScroll();
      }
      // Re-enable autoscroll only when user reaches the bottom
      else if (isAtBottom()) {
        shouldAutoScrollRef.current = true;
        isUserScrollingRef.current = false;
      }

      lastScrollTopRef.current = currentScrollTop;
    },
    [isAtBottom, cancelScroll, onUserScroll],
  );

  const handleScrollStart = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  // Auto-scroll effect - removed, as scrolling should be triggered explicitly
  // This was causing continuous scrolling due to ref in dependencies

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const scrollableElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    if (!scrollableElement) return;

    scrollableElement.addEventListener("scroll", handleScroll);

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Initial scroll
  useEffect(() => {
    if (!hasInitialScrolled.current) {
      hasInitialScrolled.current = true;
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [scrollToBottom]);

  return {
    scrollAreaRef,
    scrollToBottom,
    handleScrollStart,
    shouldAutoScrollRef, // Expose this if ChatInterface still needs to control it
    isAtBottom, // Expose this if ChatInterface still needs to check it
  };
}
