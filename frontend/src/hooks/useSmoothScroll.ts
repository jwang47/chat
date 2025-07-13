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
        console.debug("🚫 Skipping smooth scroll - user recently scrolled");
        return;
      }

      if (lerp) {
        // Lerp-based smooth scrolling
        targetScrollTop.current = target;
        currentScrollTop.current = element.scrollTop;
        isAnimating.current = true;

        console.debug("🚀 Starting lerp animation", {
          from: currentScrollTop.current,
          to: target,
          factor: lerpFactor,
        });

        const lerpAnimate = (timestamp: number) => {
          // Check if user scrolled during animation
          if (
            now - lastUserScrollTime.current < 50 &&
            performance.now() - now > 50
          ) {
            console.debug(
              "🛑 Cancelling lerp - user scrolled during animation"
            );
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

          if (Math.abs(diff) < 0.5) {
            lastProgrammaticScrollTop.current = targetScrollTop.current;
            element.scrollTop = targetScrollTop.current;
            isAnimating.current = false;
            console.debug("✅ Lerp animation complete");
            // Clear the programmatic scroll tracking after a delay
            setTimeout(() => {
              lastProgrammaticScrollTop.current = -1;
            }, 50);
            return;
          }

          // Calculate max scroll distance for this frame based on time
          const maxScrollThisFrame = (maxScrollPerSecond * deltaTime) / 1000;

          // Calculate desired scroll distance
          let scrollDistance = diff * lerpFactor;

          console.debug("📊 Scroll calculation:", {
            diff,
            lerpFactor,
            desiredDistance: scrollDistance,
            maxScrollThisFrame,
            deltaTime,
          });

          // Limit the scroll distance to maxScrollThisFrame
          if (Math.abs(scrollDistance) > maxScrollThisFrame) {
            scrollDistance = Math.sign(scrollDistance) * maxScrollThisFrame;
            console.debug("🚦 Limiting scroll speed:", {
              desired: diff * lerpFactor,
              limited: scrollDistance,
              maxThisFrame: maxScrollThisFrame,
            });
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
    console.debug("🔥 Cancel scroll called");
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
        console.debug(
          "⚡ Ignoring scroll during instant scroll at",
          currentScrollTop
        );
        return;
      }

      // Check if this scroll position matches our programmatic scroll
      if (Math.abs(currentScrollTop - lastProgrammaticScrollTop.current) < 1) {
        console.debug("🤖 Ignoring programmatic scroll at", currentScrollTop);
        return;
      }

      lastUserScrollTime.current = performance.now();
      console.debug(
        "👆 User scroll detected at",
        lastUserScrollTime.current,
        "position:",
        currentScrollTop
      );
      if (isAnimating.current) {
        console.debug("🛑 Cancelling animation due to user scroll");
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
