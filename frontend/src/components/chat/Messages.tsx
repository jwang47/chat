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
import { useAutoScroll } from "@/hooks/useAutoScroll";

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
    const containerRef = useRef<HTMLDivElement>(null);

    // Use auto-scroll hook that depends on messages length and streaming state
    // We'll use the ScrollableFeed container as the scroll target
    const { wrapperRef, handleScroll: handleAutoScroll } = useAutoScroll([
      messages.length,
      streamingMessageId,
      isTyping,
    ]);

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
      if (wrapperRef.current) {
        wrapperRef.current.scrollTop = wrapperRef.current.scrollHeight;
      }
    }, []);

    const scrollToBottomSmooth = useCallback(() => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollTo({
          top: wrapperRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, []);

    const scrollTo = useCallback((position: number) => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollTop = position;
      }
    }, []);

    const getScrollContainer = useCallback(() => {
      return wrapperRef.current;
    }, []);

    const getContentHeight = useCallback(() => {
      return wrapperRef.current?.scrollHeight || 0;
    }, []);

    // Handle scroll events
    const handleScrollEvent = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const { scrollTop, scrollHeight, clientHeight } = target;

        // Call auto-scroll handler to check if we should freeze auto-scrolling
        handleAutoScroll();

        if (onScrollChange) {
          onScrollChange(scrollTop, scrollHeight, clientHeight);
        }
      },
      [onScrollChange, handleAutoScroll]
    );

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
        <div
          ref={wrapperRef}
          className="h-full overflow-auto"
          onScroll={handleScrollEvent}
        >
          <div className="flex flex-col gap-4 p-4 pb-32">
            {items.map((message) => {
              if ((message as TypingIndicatorMessage).type === "typing") {
                return <TypingIndicator key={message.id} />;
              }

              return <ChatMessage key={message.id} message={message} />;
            })}
          </div>
        </div>
      </div>
    );
  }
);

Messages.displayName = "Messages";
