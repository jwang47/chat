import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo,
  memo, // Import memo
} from "react";
import { ChatMessage } from "./ChatMessage";
import { motion } from "motion/react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

import type { Message } from "@/types/chat";

interface MessagesProps {
  messages: Message[];
  isTyping: boolean;
  isThinking?: boolean;
  streamingMessageId: string | null;
  className?: string;
  onScrollChange?: (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
  ) => void;
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalCodeBlockToggle?: (
    messageId: string,
    blockIndex: number,
    payload: { code: string; language: string; filename?: string },
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

export const Messages = memo(
  forwardRef<MessagesRef, MessagesProps>(
    (
      {
        messages,
        isTyping,
        isThinking,
        streamingMessageId,
        onScrollChange,
        globalExpandedState,
        onGlobalCodeBlockToggle,
        className,
      },
      ref,
    ) => {
      const containerRef = useRef<HTMLDivElement>(null);

      // Auto-scroll is now handled by ChatInterface to work with Radix ScrollArea
      const wrapperRef = useRef<HTMLDivElement>(null);

      // Initialize smooth scroll for fallback methods
      const { smoothScrollToBottom, smoothScrollTo } = useSmoothScroll();

      // Create items including typing indicator (thinking is handled per-message)
      const items = useMemo(() => {
        const allItems = [...messages];

        // Add typing indicator as a virtual message if needed (only for non-streaming typing)
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
          smoothScrollToBottom(wrapperRef.current);
        }
      }, [smoothScrollToBottom]);

      const scrollTo = useCallback(
        (position: number) => {
          if (wrapperRef.current) {
            smoothScrollTo(wrapperRef.current, position);
          }
        },
        [smoothScrollTo],
      );

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


          if (onScrollChange) {
            onScrollChange(scrollTop, scrollHeight, clientHeight);
          }
        },
        [onScrollChange],
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
        ],
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
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden ${className}`}
        >
          <div ref={wrapperRef} className="" onScroll={handleScrollEvent}>
            <div className="flex flex-col w-full max-w-[960px] mx-auto">
              <div className="flex flex-col gap-4 min-w-0">
                {items.map((message) => {
                  if ((message as TypingIndicatorMessage).type === "typing") {
                    return <TypingIndicator key={message.id} />;
                  }

                  // Check if this message should show thinking indicator
                  const showThinking =
                    isThinking &&
                    streamingMessageId === message.id &&
                    !message.content;

                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      globalExpandedState={globalExpandedState}
                      onGlobalCodeBlockToggle={onGlobalCodeBlockToggle}
                      showThinking={showThinking}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    },
  ),
);

Messages.displayName = "Messages";
