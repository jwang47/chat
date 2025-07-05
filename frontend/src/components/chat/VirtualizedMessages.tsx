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
  scrollTo: (position: number) => void;
  getScrollContainer: () => HTMLElement | null;
}

export const VirtualizedMessages = forwardRef<
  VirtualizedMessagesRef,
  VirtualizedMessagesProps
>(({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Estimate item size based on typical message height
  const estimateSize = useCallback(() => {
    // Base height for a message including padding and typical content
    // This is just an estimate - dynamic sizing will adjust automatically
    return 100;
  }, []);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    // Add overscan for better scrolling experience
    overscan: 3,
    // Enable dynamic sizing with proper key generation
    getItemKey: (index) => messages[index]?.id || index,
  });

  const items = virtualizer.getVirtualItems();

  // Expose scroll methods to parent
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      },
      scrollTo: (position: number) => {
        if (parentRef.current) {
          parentRef.current.scrollTop = Math.max(
            0,
            Math.min(
              position,
              parentRef.current.scrollHeight - parentRef.current.clientHeight
            )
          );
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
      if (onScrollChange) {
        onScrollChange(
          target.scrollTop,
          target.scrollHeight,
          target.clientHeight
        );
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

  // Remeasure when messages change
  useEffect(() => {
    virtualizer.measure();
  }, [messages, virtualizer]);

  // More frequent remeasurement for streaming messages
  useEffect(() => {
    if (streamingMessageId) {
      const interval = setInterval(() => {
        virtualizer.measure();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [streamingMessageId, virtualizer]);

  return (
    <div className="h-full">
      <div
        ref={parentRef}
        className="h-full overflow-auto px-2 pb-24"
        style={{
          contain: "strict",
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
            <AnimatePresence mode="popLayout">
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
                      <ChatMessage message={message} />
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>
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
