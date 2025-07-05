import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { ChatMessage } from "./ChatMessage";
import { motion, AnimatePresence } from "motion/react";
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
  scrollTo: (position: number) => void;
  getScrollContainer: () => HTMLElement | null;
}

export const VirtualizedMessages = forwardRef<
  VirtualizedMessagesRef,
  VirtualizedMessagesProps
>(({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estimate item size based on typical message height
  const estimateSize = useCallback((index: number) => {
    // Temporarily use fixed height to test if dynamic sizing is the issue
    return 150; // Fixed height for all messages

    // const message = messages[index];
    // if (!message) return 120;

    // // Better estimation based on content length and type
    // const contentLength = message.content.length;
    // const isUser = message.role === "user";

    // // Base height includes padding and typical content
    // let estimatedHeight = 80; // Base height for container padding

    // // Estimate based on content length (rough calculation)
    // const charsPerLine = 80; // Approximate characters per line
    // const lineHeight = 20; // Approximate line height
    // const estimatedLines = Math.max(1, Math.ceil(contentLength / charsPerLine));
    // estimatedHeight += estimatedLines * lineHeight;

    // // Add extra height for code blocks (rough heuristic)
    // const codeBlockMatches = message.content.match(/```/g);
    // if (codeBlockMatches && codeBlockMatches.length >= 2) {
    //   estimatedHeight += 100; // Extra height for code blocks
    // }

    // // Cap the estimation to prevent extreme values
    // return Math.min(Math.max(estimatedHeight, 100), 800);
  }, []);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    // Increase overscan to reduce abrupt transitions
    overscan: 5,
    // Enable dynamic sizing with proper key generation
    getItemKey: (index) => messages[index]?.id || index,
    // Temporarily disable custom measurement
    // measureElement: (element) => {
    //   if (!element) return 0;
    //   return element.getBoundingClientRect().height;
    // },
  });

  const items = virtualizer.getVirtualItems();

  // Expose scroll methods to parent
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () => {
        // Default to smooth scrolling
        if (parentRef.current) {
          parentRef.current.scrollTo({
            top: parentRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      },
      scrollToBottomSmooth: () => {
        if (parentRef.current) {
          parentRef.current.scrollTo({
            top: parentRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      },
      scrollToBottomInstant: () => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
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
    []
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (e: Event) => {
      const target = e.target as HTMLElement;

      // Track scrolling state
      isScrollingRef.current = true;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set timeout to detect end of scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);

      // Debug logging
      const { scrollTop, scrollHeight, clientHeight } = target;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      const totalSize = virtualizer.getTotalSize();

      // Log when there's a significant difference between virtualizer size and actual scroll height
      if (Math.abs(totalSize - scrollHeight) > 50) {
        console.log("Height mismatch:", {
          virtualizerSize: totalSize,
          actualScrollHeight: scrollHeight,
          difference: Math.abs(totalSize - scrollHeight),
          scrollTop,
          isAtBottom,
        });
      }

      if (onScrollChange) {
        onScrollChange(
          target.scrollTop,
          target.scrollHeight,
          target.clientHeight
        );
      }
    },
    [onScrollChange, virtualizer]
  );

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
        // Clean up scroll timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // Remeasure when messages change
  // useEffect(() => {
  //   // Only remeasure if the message count changed (new messages added)
  //   // Don't remeasure for content updates to existing messages
  //   const timer = setTimeout(() => {
  //     // Don't remeasure during active scrolling
  //     if (!isScrollingRef.current) {
  //       virtualizer.measure();
  //     }
  //   }, 50); // Increased delay to reduce frequency
  //   return () => clearTimeout(timer);
  // }, [messages.length, virtualizer]); // Only depend on message count, not content

  // Throttled remeasurement for streaming messages
  // useEffect(() => {
  //   if (streamingMessageId) {
  //     const interval = setInterval(() => {
  //       // Only remeasure if we're not scrolling and near the bottom
  //       if (!isScrollingRef.current) {
  //         const scrollContainer = parentRef.current;
  //         if (scrollContainer) {
  //           const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
  //           const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;
  //           if (isNearBottom) {
  //             virtualizer.measure();
  //           }
  //         }
  //       }
  //     }, 1000); // Further reduced frequency from 500ms to 1000ms
  //     return () => clearInterval(interval);
  //   }
  // }, [streamingMessageId, virtualizer]);

  return (
    <div className="h-full">
      <div
        ref={parentRef}
        className="h-full overflow-auto px-2 pb-24"
        style={{
          contain: "layout",
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            minHeight: "100%",
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
            {items.map((virtualItem) => {
              const message = messages[virtualItem.index];
              const isLastMessage = virtualItem.index === messages.length - 1;
              return (
                <div
                  key={message.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="w-full"
                >
                  <div
                    className={`max-w-4xl mx-auto py-4 ${
                      isLastMessage ? "mb-24" : ""
                    }`}
                  >
                    <ChatMessage message={message} disableAnimations={true} />
                  </div>
                </div>
              );
            })}
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
                  top: `${virtualizer.getTotalSize() + 24}px`, // Position with some spacing
                  left: 0,
                  width: "100%",
                }}
              >
                <div className="max-w-4xl mx-auto py-4">
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
    </div>
  );
});

VirtualizedMessages.displayName = "VirtualizedMessages";
