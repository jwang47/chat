import { useRef, useCallback, useEffect } from "react";
import { useSmoothScroll } from "./useSmoothScroll"; // Assuming this path is correct

interface UseChatScrollOptions {
  streamingBuffer?: number;
}

export function useChatScroll(options: UseChatScrollOptions = {}) {
  const { streamingBuffer = 0 } = options;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const hasInitialScrolled = useRef(false);
  const isStreamingRef = useRef(false);

  const { smoothScrollTo, smoothScrollToBottom, cancelScroll, onUserScroll } =
    useSmoothScroll();

  // SmoothDamp scroll for streaming (no throttling, natural spring motion)
  const streamingScrollRef = useRef<number | null>(null);
  const streamingCurrentPos = useRef<number>(0);
  const streamingVelocity = useRef<number>(0);
  const lastStreamingTime = useRef<number>(0);

  const smoothStreamingScroll = useCallback(
    (element: HTMLElement, target: number) => {
      if (streamingScrollRef.current) {
        cancelAnimationFrame(streamingScrollRef.current);
      }

      // Initialize position if this is a new scroll
      if (!streamingScrollRef.current) {
        streamingCurrentPos.current = element.scrollTop;
        lastStreamingTime.current = performance.now();
      }

      const animate = (timestamp: number) => {
        const deltaTime = Math.min(
          (timestamp - lastStreamingTime.current) / 1000,
          1 / 60,
        );
        lastStreamingTime.current = timestamp;

        const diff = target - streamingCurrentPos.current;
        if (Math.abs(diff) < 0.5 && Math.abs(streamingVelocity.current) < 0.5) {
          element.scrollTop = target;
          streamingScrollRef.current = null;
          return;
        }

        // SmoothDamp parameters - tuned for fast, smooth streaming
        const smoothTime = 0.15; // 150ms to reach target (fast)
        const maxSpeed = 200; // Max pixels per second (reduced for smoother motion)
        const omega = 2 / smoothTime;
        const x = 0.9 * omega; // Slightly under-damped for smooth motion
        const exp = Math.exp(-x * deltaTime);

        // Apply smoothdamp
        const change = streamingCurrentPos.current - target;
        const temp = (streamingVelocity.current + x * change) * deltaTime;
        streamingVelocity.current =
          (streamingVelocity.current - x * temp) * exp;
        streamingCurrentPos.current = target + (change + temp) * exp;

        // Apply speed limiting
        const maxDelta = maxSpeed * deltaTime;
        const actualDelta = streamingCurrentPos.current - element.scrollTop;
        if (Math.abs(actualDelta) > maxDelta) {
          streamingCurrentPos.current =
            element.scrollTop + Math.sign(actualDelta) * maxDelta;
        }

        element.scrollTop = streamingCurrentPos.current;
        streamingScrollRef.current = requestAnimationFrame(animate);
      };

      streamingScrollRef.current = requestAnimationFrame(animate);
    },
    [],
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

    // Account for streaming buffer - consider "at bottom" if we're within buffer range
    const activeStreamingBuffer = isStreamingRef.current ? streamingBuffer : 0;
    const threshold = 5 + activeStreamingBuffer; // 5px base + streaming buffer

    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, [getScrollElement, streamingBuffer]);

  const scrollToBottom = useCallback(
    (immediate = false) => {
      const scrollableElement = getScrollElement();
      if (scrollableElement) {
        if (immediate) {
          scrollableElement.scrollTop = scrollableElement.scrollHeight;
        } else {
          if (isStreamingRef.current) {
            // During streaming: use custom smooth scroll with buffer
            const targetScroll = Math.max(
              0,
              scrollableElement.scrollHeight -
                scrollableElement.clientHeight -
                streamingBuffer,
            );
            // Use streaming-specific smooth scroll (no throttling)
            smoothStreamingScroll(scrollableElement, targetScroll);
          } else {
            // When not streaming: normal smooth scroll to true bottom
            smoothScrollToBottom(scrollableElement);
          }
        }
      }
    },
    [
      smoothScrollTo,
      smoothScrollToBottom,
      smoothStreamingScroll,
      getScrollElement,
      streamingBuffer,
    ],
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
      // But ignore upward movement if we're still within the "at bottom" range (including streaming buffer)
      if (scrollDirection < -2 && !isAtBottom()) {
        shouldAutoScrollRef.current = false;
        isUserScrollingRef.current = true;
        cancelScroll();
      }
      // Re-enable autoscroll when user reaches the bottom
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

  const setStreaming = useCallback(
    (streaming: boolean) => {
      const wasStreaming = isStreamingRef.current;
      isStreamingRef.current = streaming;

      // When streaming ends, scroll to true bottom with smooth animation
      if (wasStreaming && !streaming && shouldAutoScrollRef.current) {
        setTimeout(() => {
          const scrollableElement = getScrollElement();
          if (scrollableElement) {
            smoothScrollToBottom(scrollableElement);
          }
        }, 100); // Small delay to let final content render
      }
    },
    [getScrollElement, smoothScrollToBottom],
  );

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
    setStreaming, // New method to control streaming state
    shouldAutoScrollRef, // Expose this if ChatInterface still needs to control it
    isAtBottom, // Expose this if ChatInterface still needs to check it
  };
}
