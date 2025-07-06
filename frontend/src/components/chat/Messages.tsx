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
import ScrollableFeed from "react-scrollable-feed";

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

// Typing indicator message type
interface TypingIndicatorMessage extends Message {
  type: "typing";
}

export const Messages = forwardRef<MessagesRef, MessagesProps>(
  ({ messages, isTyping, streamingMessageId, onScrollChange }, ref) => {
    const scrollableFeedRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Scroll methods for compatibility with existing interface
    const scrollToBottom = useCallback(() => {
      if (containerRef.current) {
        const scrollContainer = containerRef.current.querySelector(
          "[data-scrollable-feed]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, []);

    const scrollToBottomSmooth = useCallback(() => {
      if (containerRef.current) {
        const scrollContainer = containerRef.current.querySelector(
          "[data-scrollable-feed]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    }, []);

    const scrollTo = useCallback((position: number) => {
      if (containerRef.current) {
        const scrollContainer = containerRef.current.querySelector(
          "[data-scrollable-feed]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = position;
        }
      }
    }, []);

    const getScrollContainer = useCallback(() => {
      if (containerRef.current) {
        return containerRef.current.querySelector(
          "[data-scrollable-feed]"
        ) as HTMLElement;
      }
      return null;
    }, []);

    const getContentHeight = useCallback(() => {
      const scrollContainer = getScrollContainer();
      return scrollContainer?.scrollHeight || 0;
    }, [getScrollContainer]);

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
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", handleScroll, {
          passive: true,
        });

        return () => {
          scrollContainer.removeEventListener("scroll", handleScroll);
        };
      }
    }, [handleScroll, getScrollContainer]);

    // Expose scroll methods to parent
    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom,
        scrollToBottomSmooth,
        scrollToBottomInstant: scrollToBottom,
        scrollToBottomSticky: scrollToBottom,
        startContinuousScroll: () => {}, // No-op - ScrollableFeed handles this
        stopContinuousScroll: () => {}, // No-op - ScrollableFeed handles this
        scrollTo,
        getScrollContainer,
        getContentHeight,
      }),
      [
        scrollToBottom,
        scrollToBottomSmooth,
        scrollTo,
        getScrollContainer,
        getContentHeight,
      ]
    );

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
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <ScrollableFeed
          ref={scrollableFeedRef}
          className="h-full"
          data-scrollable-feed
        >
          <div className="flex flex-col gap-4 p-4 pb-32">
            {items.map((message) => {
              if ((message as TypingIndicatorMessage).type === "typing") {
                return <TypingIndicator key={message.id} />;
              }

              return <ChatMessage key={message.id} message={message} />;
            })}
          </div>
        </ScrollableFeed>
      </div>
    );
  }
);

Messages.displayName = "Messages";
