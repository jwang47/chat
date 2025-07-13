import { useRef, useCallback, useEffect } from "react";
import { useSmoothScroll } from "./useSmoothScroll"; // Assuming this path is correct

interface UseChatScrollOptions {
  lerp?: boolean;
  lerpFactor?: number;
  maxScrollPerSecond?: number;
}

export function useChatScroll(options?: UseChatScrollOptions) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const hasInitialScrolled = useRef(false);

  const { smoothScrollToBottom, cancelScroll, onUserScroll } = useSmoothScroll(
    options || { lerp: true, lerpFactor: 0.02, maxScrollPerSecond: 100 }
  );

  const isAtBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return true;
    const scrollableElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (!scrollableElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
    // Use a small threshold (5px) to account for sub-pixel rendering
    return scrollTop + clientHeight >= scrollHeight - 5;
  }, []);

  const scrollToBottom = useCallback(
    (immediate = false) => {
      const scrollArea = scrollAreaRef.current;
      if (scrollArea) {
        const scrollableElement = scrollArea.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) as HTMLElement;
        if (scrollableElement) {
          if (immediate) {
            console.debug("⚡ Immediate scroll to bottom");
            scrollableElement.scrollTop = scrollableElement.scrollHeight;
          } else {
            console.debug("🌊 Smooth scroll to bottom called");
            smoothScrollToBottom(scrollableElement);
          }
        }
      }
    },
    [smoothScrollToBottom]
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
        console.debug("🔼 User scrolled up - breaking autoscroll", {
          direction: scrollDirection,
          position: currentScrollTop
        });
        shouldAutoScrollRef.current = false;
        isUserScrollingRef.current = true;
        cancelScroll();
      }
      // Re-enable autoscroll only when user reaches the bottom
      else if (isAtBottom()) {
        console.debug("🔽 User at bottom - enabling autoscroll");
        shouldAutoScrollRef.current = true;
        isUserScrollingRef.current = false;
      }

      lastScrollTopRef.current = currentScrollTop;
    },
    [isAtBottom, cancelScroll, onUserScroll]
  );

  const handleScrollStart = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldAutoScrollRef.current, scrollToBottom]); // Added shouldAutoScrollRef.current to dependencies

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const scrollableElement = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
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
