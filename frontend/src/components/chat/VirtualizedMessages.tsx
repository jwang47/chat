import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { ChatMessage } from "./ChatMessage";
import { motion, AnimatePresence } from "motion/react";
import { useVirtualizer, elementScroll } from "@tanstack/react-virtual";
import type { VirtualizerOptions } from "@tanstack/react-virtual";
import type { Message } from "@/types/chat";

interface VirtualizedMessagesProps {
  messages: Message[];
  isTyping: boolean;
  streamingMessageId: string | null;
  onScrollChange?: (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => void;
}

export interface VirtualizedMessagesRef {
  scrollToBottom: () => void;
  scrollToBottomSmooth: () => void;
  scrollToBottomInstant: () => void;
  scrollToBottomSticky: () => void;
  startContinuousScroll: () => void;
  stopContinuousScroll: () => void;
  scrollTo: (position: number) => void;
  getScrollContainer: () => HTMLElement | null;
}

// Smooth scroll easing function
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

export const VirtualizedMessages = forwardRef<
  VirtualizedMessagesRef,
  VirtualizedMessagesProps
>(({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<number>(0);

  // Custom smooth scroll to bottom that tracks content changes
  const smoothScrollToBottom = useCallback(() => {
    if (!parentRef.current) return;

    const scrollContainer = parentRef.current;
    const duration = 300;
    const start = scrollContainer.scrollTop;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function
      const eased = easeInOutQuint(progress);

      // Always scroll to the very bottom (current scrollHeight)
      const target =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const current = start + (target - start) * eased;

      scrollContainer.scrollTop = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure we're at the very bottom
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    };

    requestAnimationFrame(animate);
  }, []);

  // Instant scroll to bottom that sticks during streaming
  const stickToBottom = useCallback(() => {
    if (!parentRef.current) return;
    const scrollContainer = parentRef.current;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, []);

  // Continuous scroll tracking for streaming
  const continuousScrollRef = useRef<number | null>(null);
  const startContinuousScroll = useCallback(() => {
    if (continuousScrollRef.current) return; // Already running

    const scroll = () => {
      if (!parentRef.current) {
        continuousScrollRef.current = null;
        return;
      }

      const scrollContainer = parentRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      continuousScrollRef.current = requestAnimationFrame(scroll);
    };

    continuousScrollRef.current = requestAnimationFrame(scroll);
  }, []);

  const stopContinuousScroll = useCallback(() => {
    if (continuousScrollRef.current) {
      cancelAnimationFrame(continuousScrollRef.current);
      continuousScrollRef.current = null;
    }
  }, []);

  // TanStack Virtual setup
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 5, // Render 5 extra items above/below visible area
  });

  const items = virtualizer.getVirtualItems();

  // Expose scroll methods to parent
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () => {
        if (parentRef.current) {
          const scrollContainer = parentRef.current;
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      },
      scrollToBottomSmooth: () => {
        smoothScrollToBottom();
      },
      scrollToBottomInstant: () => {
        if (parentRef.current) {
          const scrollContainer = parentRef.current;
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      },
      scrollToBottomSticky: () => {
        stickToBottom();
      },
      startContinuousScroll: () => {
        startContinuousScroll();
      },
      stopContinuousScroll: () => {
        stopContinuousScroll();
      },
      scrollTo: (position: number) => {
        if (parentRef.current) {
          const clampedPosition = Math.max(
            0,
            Math.min(
              position,
              parentRef.current.scrollHeight - parentRef.current.clientHeight
            )
          );
          parentRef.current.scrollTo({
            top: clampedPosition,
            behavior: "smooth",
          });
        }
      },
      getScrollContainer: () => parentRef.current,
    }),
    [virtualizer, messages.length]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      if (onScrollChange) {
        onScrollChange(scrollTop, scrollHeight, clientHeight);
      }
    },
    [onScrollChange]
  );

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Cleanup continuous scroll on unmount
  useEffect(() => {
    return () => {
      stopContinuousScroll();
    };
  }, [stopContinuousScroll]);

  return (
    <div className="h-full">
      <div
        ref={parentRef}
        className="h-full overflow-auto px-2"
        style={{
          contain: "strict",
          paddingBottom: "100px", // Reserve 100px for message input
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${items[0]?.start ?? 0}px)`,
            }}
          >
            {items.map((virtualRow) => {
              const message = messages[virtualRow.index];
              const isLastMessage = virtualRow.index === messages.length - 1;
              const isStreaming =
                message.isStreaming || streamingMessageId === message.id;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="w-full"
                >
                  <div
                    className={`max-w-4xl mx-auto py-4 ${
                      isLastMessage ? "mb-[100px]" : ""
                    }`}
                  >
                    <ChatMessage message={message} disableAnimations={true} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Typing Indicator - Always rendered at the bottom */}
        <AnimatePresence>
          {isTyping && !streamingMessageId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: `${virtualizer.getTotalSize() + 24}px`,
                left: 0,
                width: "100%",
                marginBottom: "100px", // Ensure it doesn't overlap with input
              }}
            >
              <div className="max-w-4xl mx-auto py-4 mb-[100px]">
                <div className="flex p-4">
                  <div className="p-3 rounded-lg">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

VirtualizedMessages.displayName = "VirtualizedMessages";
