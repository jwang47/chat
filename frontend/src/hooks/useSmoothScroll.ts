import { useRef, useCallback } from 'react';

interface SmoothScrollOptions {
  duration?: number;
  easing?: (t: number) => number;
  lerp?: boolean;
  lerpFactor?: number;
}

export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const {
    duration = 800,
    easing = (t: number) => t * t * (3 - 2 * t), // smoothstep
    lerp = false,
    lerpFactor = 0.1
  } = options;

  const animationRef = useRef<number | null>(null);
  const targetScrollTop = useRef<number>(0);
  const currentScrollTop = useRef<number>(0);
  const isAnimating = useRef<boolean>(false);

  const smoothScrollTo = useCallback((element: HTMLElement, target: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (lerp) {
      // Lerp-based smooth scrolling
      targetScrollTop.current = target;
      currentScrollTop.current = element.scrollTop;
      isAnimating.current = true;

      const lerpAnimate = () => {
        const diff = targetScrollTop.current - currentScrollTop.current;
        
        if (Math.abs(diff) < 0.5) {
          element.scrollTop = targetScrollTop.current;
          isAnimating.current = false;
          return;
        }

        currentScrollTop.current += diff * lerpFactor;
        element.scrollTop = currentScrollTop.current;
        
        if (isAnimating.current) {
          animationRef.current = requestAnimationFrame(lerpAnimate);
        }
      };

      lerpAnimate();
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
  }, [duration, easing, lerp, lerpFactor]);

  const smoothScrollToBottom = useCallback((element: HTMLElement) => {
    smoothScrollTo(element, element.scrollHeight);
  }, [smoothScrollTo]);

  const cancelScroll = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    isAnimating.current = false;
  }, []);

  return {
    smoothScrollTo,
    smoothScrollToBottom,
    cancelScroll,
    isAnimating: () => isAnimating.current
  };
}