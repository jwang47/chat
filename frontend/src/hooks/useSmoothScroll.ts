import { useRef, useCallback } from "react";

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
  lerp?: boolean;
  lerpFactor?: number;
  maxScrollPerSecond?: number;
}

export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const {
    duration = 800,
    easing = (t: number) => t * t * (3 - 2 * t), // smoothstep
    lerp = false,
    lerpFactor = 0.1,
    maxScrollPerSecond = 2000, // pixels per second
  } = options;

  const animationRef = useRef<number | null>(null);
  const targetScrollTop = useRef<number>(0);
  const currentScrollTop = useRef<number>(0);
  const isAnimating = useRef<boolean>(false);
  const lastUserScrollTime = useRef<number>(0);
  const lastProgrammaticScrollTop = useRef<number>(-1);
  const lastFrameTime = useRef<number>(0);
  const isInstantScrolling = useRef<boolean>(false);

  const smoothScrollTo = useCallback(
    (element: HTMLElement, target: number) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Check if user scrolled recently (within 100ms) - if so, don't start animation
      const now = performance.now();
      if (now - lastUserScrollTime.current < 100) {
        return;
      }

      if (lerp) {
        // Lerp-based smooth scrolling
        targetScrollTop.current = target;
        currentScrollTop.current = element.scrollTop;
        isAnimating.current = true;


        const lerpAnimate = (timestamp: number) => {
          // Check if user scrolled during animation
          if (
            now - lastUserScrollTime.current < 50 &&
            performance.now() - now > 50
          ) {
            isAnimating.current = false;
            lastProgrammaticScrollTop.current = -1;
            return;
          }

          // Calculate delta time
          const deltaTime = lastFrameTime.current
            ? timestamp - lastFrameTime.current
            : 16;
          lastFrameTime.current = timestamp;

          const diff = targetScrollTop.current - currentScrollTop.current;

          if (Math.abs(diff) < 1) {
            lastProgrammaticScrollTop.current = targetScrollTop.current;
            element.scrollTop = targetScrollTop.current;
            isAnimating.current = false;
            // Clear the programmatic scroll tracking after a longer delay to prevent false positives
            setTimeout(() => {
              lastProgrammaticScrollTop.current = -1;
            }, 150);
            return;
          }

          // Calculate max scroll distance for this frame based on time
          const maxScrollThisFrame = (maxScrollPerSecond * deltaTime) / 1000;

          // Calculate desired scroll distance
          let scrollDistance = diff * lerpFactor;

          // Removed excessive logging for performance

          // Limit the scroll distance to maxScrollThisFrame
          if (Math.abs(scrollDistance) > maxScrollThisFrame) {
            scrollDistance = Math.sign(scrollDistance) * maxScrollThisFrame;
            // Speed limited to maxScrollThisFrame
          }

          currentScrollTop.current += scrollDistance;
          lastProgrammaticScrollTop.current = currentScrollTop.current;
          element.scrollTop = currentScrollTop.current;

          if (isAnimating.current) {
            animationRef.current = requestAnimationFrame(lerpAnimate);
          }
        };

        lerpAnimate(performance.now());
      } else {
        // Easing-based smooth scrolling
        const startScrollTop = element.scrollTop;
        const distance = target - startScrollTop;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easing(progress);

          element.scrollTop = startScrollTop + distance * easedProgress;

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }
    },
    [duration, easing, lerp, lerpFactor, maxScrollPerSecond]
  );

  const smoothScrollToBottom = useCallback(
    (element: HTMLElement) => {
      smoothScrollTo(element, element.scrollHeight);
    },
    [smoothScrollTo]
  );

  const cancelScroll = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isAnimating.current = false;
  }, []);

  const onUserScroll = useCallback(
    (currentScrollTop: number) => {
      // Ignore scroll events during instant scrolling
      if (isInstantScrolling.current) {
        return;
      }

      // Check if this scroll position matches our programmatic scroll with higher tolerance
      // Use 3 pixels to account for sub-pixel rendering and floating point precision
      if (Math.abs(currentScrollTop - lastProgrammaticScrollTop.current) < 3) {
        return;
      }

      // Additional check: if we're animating and the scroll is in the same direction,
      // it's likely programmatic
      if (isAnimating.current) {
        const scrollDirection = currentScrollTop - lastProgrammaticScrollTop.current;
        const animationDirection = targetScrollTop.current - lastProgrammaticScrollTop.current;
        
        // If scroll is in the same direction as animation and within reasonable range
        if (Math.sign(scrollDirection) === Math.sign(animationDirection) && 
            Math.abs(scrollDirection) < 10) {
          return;
        }
      }

      lastUserScrollTime.current = performance.now();
      if (isAnimating.current) {
        cancelScroll();
      }
    },
    [cancelScroll]
  );

  return {
    smoothScrollTo,
    smoothScrollToBottom,
    cancelScroll,
    onUserScroll,
    isAnimating: () => isAnimating.current,
  };
}
