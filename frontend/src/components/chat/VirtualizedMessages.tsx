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
  scrollToBottomSticky: () => void;
  startContinuousScroll: () => void;
  stopContinuousScroll: () => void;
  scrollTo: (position: number) => void;
  getScrollContainer: () => HTMLElement | null;
  getVirtualTotalSize: () => number;
}

// Smooth scroll easing function
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

// Typing indicator message type
interface TypingIndicatorMessage extends Message {
  type: "typing";
}

export const VirtualizedMessages = forwardRef<
  VirtualizedMessagesRef,
  VirtualizedMessagesProps
>(({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Create virtualized items including typing indicator
  const virtualizedItems = useMemo(() => {
    const items = [...messages];

    // Add typing indicator as a virtual message if needed
    if (isTyping && !streamingMessageId) {
      items.push({
        id: "typing-indicator",
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: "typing",
        type: "typing",
      } as TypingIndicatorMessage);
    }

    return items;
  }, [messages, isTyping, streamingMessageId]);

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
    count: virtualizedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated message height
    overscan: 10, // Render 10 extra items above/below visible area for smoother scrolling
    scrollMargin: parentRef.current?.clientHeight ?? 0, // Add scroll margin for better preloading
    initialRect: { width: 0, height: parentRef.current?.clientHeight ?? 800 }, // Better initial sizing
  });

  const items = virtualizer.getVirtualItems();

  // Track DOM elements for remeasurement
  const messageElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Consolidated debounced remeasurement logic
  const remeasureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingContentLengthRef = useRef(0);

  useEffect(() => {
    if (!streamingMessageId) {
      // Reset when streaming ends
      streamingContentLengthRef.current = 0;
      if (remeasureTimeoutRef.current) {
        clearTimeout(remeasureTimeoutRef.current);
        remeasureTimeoutRef.current = null;
      }
      return;
    }

    const streamingMessage = messages.find(
      (msg) => msg.id === streamingMessageId
    );

    if (!streamingMessage?.content) return;

    const contentLength = streamingMessage.content.length;
    const shouldRemeasure =
      contentLength > streamingContentLengthRef.current + 50;

    if (shouldRemeasure) {
      streamingContentLengthRef.current = contentLength;

      const messageIndex = messages.findIndex(
        (msg) => msg.id === streamingMessageId
      );

      if (messageIndex === -1) return;

      // Clear any existing timeout to debounce
      if (remeasureTimeoutRef.current) {
        clearTimeout(remeasureTimeoutRef.current);
      }

      // Debounced remeasurement
      remeasureTimeoutRef.current = setTimeout(() => {
        const element = messageElementsRef.current.get(messageIndex);
        if (element?.isConnected) {
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            // Temporarily pause continuous scroll during measurement
            const wasContinuousScrolling = continuousScrollRef.current !== null;
            if (wasContinuousScrolling) {
              stopContinuousScroll();
            }

            virtualizer.measureElement(element);

            // Resume continuous scroll if it was active
            if (wasContinuousScrolling && streamingMessageId) {
              setTimeout(() => {
                startContinuousScroll();
              }, 50);
            }
          });
        }
        remeasureTimeoutRef.current = null;
      }, 100);
    }
  }, [
    streamingMessageId,
    messages,
    virtualizer,
    stopContinuousScroll,
    startContinuousScroll,
  ]);

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
        // Force remeasurement of the virtualizer
        virtualizer.measure();

        // Calculate new scroll position to keep the collapsed/expanded message in view
        const newElementRect = element.getBoundingClientRect();
        const newContainerRect = scrollContainer.getBoundingClientRect();

        // If the element is above the viewport, adjust scroll to keep it visible
        if (elementTopRelativeToContainer < scrollTopBefore) {
          const adjustment = elementTopRelativeToContainer - scrollTopBefore;
          scrollContainer.scrollTop = Math.max(0, scrollTopBefore + adjustment);
        }
        // If collapsing made the element much smaller and it's now far from view,
        // scroll to keep it reasonably positioned
        else if (
          isCollapsed &&
          elementTopRelativeToContainer > scrollTopBefore + containerRect.height
        ) {
          // Scroll to position the collapsed message near the top of the viewport
          scrollContainer.scrollTop = Math.max(
            0,
            elementTopRelativeToContainer - 100
          );
        }
      });
    },
    [virtualizer]
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
      getVirtualTotalSize: () => virtualizer.getTotalSize(),
    }),
    [virtualizer, virtualizedItems.length]
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

  // Set up scroll listener and ensure proper initialization
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });

      // Force initial measurement to prevent delays
      requestAnimationFrame(() => {
        virtualizer.measure();
      });

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll, virtualizer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousScroll();
      messageElementsRef.current.clear();
      if (remeasureTimeoutRef.current) {
        clearTimeout(remeasureTimeoutRef.current);
        remeasureTimeoutRef.current = null;
      }
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
          contain: "strict",
          paddingBottom: "100px", // Reserve 100px for message input
          scrollBehavior: "auto", // Ensure smooth scrolling doesn't interfere with virtualization
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
              const item = virtualizedItems[virtualRow.index];
              const isLastMessage =
                virtualRow.index === virtualizedItems.length - 1;
              const isTypingIndicator =
                "type" in item && item.type === "typing";

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={(el) => {
                    // Track the element for remeasurement
                    if (el) {
                      messageElementsRef.current.set(virtualRow.index, el);
                    } else {
                      messageElementsRef.current.delete(virtualRow.index);
                    }
                    // Also measure the element
                    virtualizer.measureElement(el);
                  }}
                  className="w-full"
                >
                  <div
                    className={`max-w-4xl mx-auto py-4 ${
                      isLastMessage ? "mb-[100px]" : ""
                    }`}
                  >
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedMessages.displayName = "VirtualizedMessages";
