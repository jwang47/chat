import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
} from "react";
import { ChatMessage } from "./ChatMessage";
import { motion } from "motion/react";

import type { Message } from "@/types/chat";

interface MessagesProps {
  messages: Message[];
  isTyping: boolean;
  streamingMessageId: string | null;
  onScrollChange?: (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number
  ) => void;
}

export interface MessagesRef {
  scrollToBottom: () => void;
  scrollToBottomSmooth: () => void;
  scrollToBottomInstant: () => void;
  scrollToBottomSticky: () => void;
  startContinuousScroll: () => void;
  stopContinuousScroll: () => void;
  scrollTo: (position: number) => void;
  getScrollContainer: () => HTMLElement | null;
  getContentHeight: () => number;
}

// Smooth scroll easing function
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

// Typing indicator message type
interface TypingIndicatorMessage extends Message {
  type: "typing";
}

export const Messages = forwardRef<MessagesRef, MessagesProps>(
  ({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
    const parentRef = useRef<HTMLDivElement>(null);

    // Create items including typing indicator
    const items = useMemo(() => {
      const allItems = [...messages];

      // Add typing indicator as a virtual message if needed
      if (isTyping && !streamingMessageId) {
        allItems.push({
          id: "typing-indicator",
          role: "assistant",
          content: "",
          timestamp: new Date(),
          model: "typing",
          type: "typing",
        } as TypingIndicatorMessage);
      }

      return allItems;
    }, [messages, isTyping, streamingMessageId]);

    // Custom smooth scroll to bottom
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

    // Instant scroll to bottom
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

    // Handle message collapse/expand with scroll position preservation
    const handleCollapseToggle = useCallback(
      (isCollapsed: boolean, element: HTMLElement | null) => {
        if (!element || !parentRef.current) return;

        const scrollContainer = parentRef.current;
        const scrollTopBefore = scrollContainer.scrollTop;
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        // Calculate the element's position relative to the container
        const elementTopRelativeToContainer =
          elementRect.top - containerRect.top + scrollTopBefore;

        // Use requestAnimationFrame to ensure DOM has updated after collapse/expand
        requestAnimationFrame(() => {
          // Calculate new scroll position to keep the collapsed/expanded message in view
          const newElementRect = element.getBoundingClientRect();
          const newContainerRect = scrollContainer.getBoundingClientRect();

          // If the element is above the viewport, adjust scroll to keep it visible
          if (elementTopRelativeToContainer < scrollTopBefore) {
            const adjustment = elementTopRelativeToContainer - scrollTopBefore;
            scrollContainer.scrollTop = Math.max(
              0,
              scrollTopBefore + adjustment
            );
          }
          // If collapsing made the element much smaller and it's now far from view,
          // scroll to keep it reasonably positioned
          else if (
            isCollapsed &&
            elementTopRelativeToContainer >
              scrollTopBefore + containerRect.height
          ) {
            // Scroll to position the collapsed message near the top of the viewport
            scrollContainer.scrollTop = Math.max(
              0,
              elementTopRelativeToContainer - 100
            );
          }
        });
      },
      []
    );

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
            parentRef.current.scrollTop = clampedPosition;
          }
        },
        getScrollContainer: () => parentRef.current,
        getContentHeight: () => parentRef.current?.scrollHeight || 0,
      }),
      [
        smoothScrollToBottom,
        stickToBottom,
        startContinuousScroll,
        stopContinuousScroll,
      ]
    );

    // Handle scroll events with throttling for better performance
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
        scrollElement.addEventListener("scroll", handleScroll, {
          passive: true,
        });

        return () => {
          scrollElement.removeEventListener("scroll", handleScroll);
        };
      }
    }, [handleScroll]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        stopContinuousScroll();
      };
    }, [stopContinuousScroll]);

    // Typing indicator component
    const TypingIndicator = () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex p-4"
      >
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
      </motion.div>
    );

    return (
      <div className="h-full">
        <div
          ref={parentRef}
          className="h-full overflow-auto px-2"
          style={{
            paddingBottom: "80px", // Reserve space for message input
          }}
        >
          {items.map((item, index) => {
            const isLastMessage = index === items.length - 1;
            const isTypingIndicator = "type" in item && item.type === "typing";

            return (
              <div key={item.id} className="max-w-4xl mx-auto py-4">
                {isTypingIndicator ? (
                  <TypingIndicator />
                ) : (
                  <ChatMessage
                    message={item as Message}
                    disableAnimations={true}
                    onCollapseToggle={handleCollapseToggle}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Messages.displayName = "Messages";
