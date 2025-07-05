import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useMemo,
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

// Custom virtualization hook
function useSimpleVirtualization(
  messages: Message[],
  containerHeight: number,
  itemHeight: number = 150
) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate which messages should be visible
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 10;
  const endIndex = Math.min(messages.length, startIndex + visibleCount);

  const visibleMessages = useMemo(() => {
    return messages.slice(startIndex, endIndex);
  }, [messages, startIndex, endIndex]);

  // Calculate spacer heights
  const topSpacerHeight = startIndex * itemHeight;
  const bottomSpacerHeight = (messages.length - endIndex) * itemHeight;

  // Throttle scroll updates to reduce flashing
  const throttledSetScrollTop = useCallback(
    (newScrollTop: number) => {
      if (Math.abs(newScrollTop - scrollTop) > 50) {
        setScrollTop(newScrollTop);
      }
    },
    [scrollTop]
  );

  return {
    visibleMessages,
    topSpacerHeight,
    bottomSpacerHeight,
    setScrollTop: throttledSetScrollTop,
  };
}

export const VirtualizedMessages = forwardRef<
  VirtualizedMessagesRef,
  VirtualizedMessagesProps
>(({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Use our custom virtualization
  const { visibleMessages, topSpacerHeight, bottomSpacerHeight, setScrollTop } =
    useSimpleVirtualization(
      messages,
      containerHeight,
      150 // Fixed item height
    );

  // Expose scroll methods to parent
  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () => {
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
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Update our virtualization
      setScrollTop(scrollTop);

      // Update container height if needed
      if (clientHeight !== containerHeight) {
        setContainerHeight(clientHeight);
      }

      if (onScrollChange) {
        onScrollChange(scrollTop, scrollHeight, clientHeight);
      }
    },
    [onScrollChange, containerHeight, setScrollTop]
  );

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });

      // Initial height measurement
      setContainerHeight(scrollElement.clientHeight);

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

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
            height: `${topSpacerHeight + bottomSpacerHeight}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {/* Top spacer for items before visible range */}
          {topSpacerHeight > 0 && (
            <div style={{ height: `${topSpacerHeight}px` }} />
          )}

          {/* Visible messages */}
          {visibleMessages.map((message, index) => {
            const messageIndex = messages.indexOf(message);
            const isLastMessage = messageIndex === messages.length - 1;
            return (
              <div key={message.id} className="w-full">
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

          {/* Bottom spacer for items after visible range */}
          {bottomSpacerHeight > 0 && (
            <div style={{ height: `${bottomSpacerHeight}px` }} />
          )}
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
                top: `${topSpacerHeight + bottomSpacerHeight + 24}px`,
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
