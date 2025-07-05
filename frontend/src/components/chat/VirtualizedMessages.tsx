import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { ChatMessage } from "./ChatMessage";
import { motion, AnimatePresence } from "motion/react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
        if (parentRef.current) {
          const scrollContainer = parentRef.current;
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      },
      scrollToBottomInstant: () => {
        if (parentRef.current) {
          const scrollContainer = parentRef.current;
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
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

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
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
  );
});

VirtualizedMessages.displayName = "VirtualizedMessages";
