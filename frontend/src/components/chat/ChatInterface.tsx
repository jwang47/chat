import { useState, useEffect, useRef, useCallback } from "react";
import { MessageInput } from "./MessageInput";
import { Messages, type MessagesRef } from "./Messages";
import { ChatMinimap } from "./ChatMinimap";
import { motion, AnimatePresence } from "motion/react";
import { LlmService, type LlmMessage } from "@/lib/llmService";
import type { Message } from "@/types/chat";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel, getModelById, type ModelInfo } from "@/lib/models";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [showMinimap, setShowMinimap] = useState(false);

  const messagesRef = useRef<MessagesRef>(null);
  const isUserScrolledUpRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollUpdatePendingRef = useRef(false);
  const messageIdCounter = useRef(0);

  const scrollThreshold = 10; // Pixels threshold for scroll detection

  // Handle model selection
  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Check if user is at the bottom of the chat
  const isAtBottom = useCallback(() => {
    if (!messagesRef.current) return true;
    const container = messagesRef.current.getScrollContainer();
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
  }, []);

  // Scroll to specific position (for minimap)
  const scrollTo = useCallback((position: number) => {
    isProgrammaticScrollRef.current = true;
    messagesRef.current?.scrollTo(position);
    // Short flag duration for responsive minimap dragging
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 100);
  }, []);

  // Handle scroll events from messages
  const handleScrollChange = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (scrollUpdatePendingRef.current) return;

      scrollUpdatePendingRef.current = true;
      requestAnimationFrame(() => {
        // Only update scroll tracking if this isn't a programmatic scroll
        if (!isProgrammaticScrollRef.current) {
          // Detect if user is actively scrolling up
          const isScrollingUp =
            scrollTop < lastScrollTopRef.current - scrollThreshold;
          const isScrollingDown =
            scrollTop > lastScrollTopRef.current + scrollThreshold;

          if (isScrollingUp) {
            // Immediately mark user as scrolled up
            isUserScrolledUpRef.current = true;
            // Stop continuous scroll tracking when user scrolls up
            messagesRef.current?.stopContinuousScroll();
            // Clear any pending timeout
            if (userScrollTimeoutRef.current) {
              clearTimeout(userScrollTimeoutRef.current);
              userScrollTimeoutRef.current = null;
            }
          } else if (isScrollingDown && isAtBottom()) {
            // Reset to auto-scroll when user scrolls down to bottom
            isUserScrolledUpRef.current = false;
            // Restart continuous scroll if we're streaming
            if (streamingMessageId) {
              messagesRef.current?.startContinuousScroll();
            }
          } else if (isAtBottom()) {
            // Also reset if user is at bottom (handles edge cases)
            isUserScrolledUpRef.current = false;
            // Restart continuous scroll if we're streaming
            if (streamingMessageId) {
              messagesRef.current?.startContinuousScroll();
            }
          }
        }

        lastScrollTopRef.current = scrollTop;

        // Calculate scroll progress (0 to 1)
        const progress =
          scrollHeight > clientHeight
            ? scrollTop / (scrollHeight - clientHeight)
            : 0;

        // Get content height for minimap calculations
        const totalContentHeight =
          messagesRef.current?.getContentHeight() || scrollHeight;

        // Batch state updates to prevent excessive re-renders
        setScrollProgress((prev) => {
          if (Math.abs(prev - progress) < 0.01) return prev; // Avoid micro-updates
          return progress;
        });

        setViewportHeight((prev) => {
          if (prev === clientHeight) return prev;
          return clientHeight;
        });

        setContentHeight((prev) => {
          if (prev === totalContentHeight) return prev;
          return totalContentHeight;
        });

        // Show minimap if content is scrollable and user has scrolled
        const shouldShowMinimap =
          totalContentHeight > clientHeight * 1.5 && scrollTop > 100;
        setShowMinimap(shouldShowMinimap);

        scrollUpdatePendingRef.current = false;
      });
    },
    [isAtBottom, streamingMessageId]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Auto-scroll when new messages are added and user hasn't scrolled up
    if (
      messages.length > 0 &&
      !isUserScrolledUpRef.current &&
      !isProgrammaticScrollRef.current
    ) {
      // Use minimal delay with instant scroll for immediate feedback
      const timer = setTimeout(() => {
        // Double-check user hasn't scrolled up while we were waiting
        if (!isUserScrolledUpRef.current) {
          messagesRef.current?.scrollToBottomInstant(); // Instant scroll for new messages
        }
      }, 500); // Reduced from 50ms to 10ms
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Handle streaming content updates - continuous scroll as content comes in
  const lastStreamingContentLengthRef = useRef(0);
  const streamingScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-scroll during streaming if user hasn't scrolled up
    if (
      streamingMessageId &&
      !isUserScrolledUpRef.current &&
      !isProgrammaticScrollRef.current
    ) {
      const streamingMessage = messages.find(
        (msg) => msg.id === streamingMessageId
      );
      // Only scroll if there's actual content and we're still streaming
      if (
        streamingMessage &&
        streamingMessage.content &&
        streamingMessage.isStreaming
      ) {
        // Trigger scroll on ANY content change during streaming
        const contentLength = streamingMessage.content.length;
        const hasAnyGrowth =
          contentLength > lastStreamingContentLengthRef.current;

        if (hasAnyGrowth) {
          lastStreamingContentLengthRef.current = contentLength;

          // Clear any existing timeout to prevent multiple scrolls
          if (streamingScrollTimeoutRef.current) {
            clearTimeout(streamingScrollTimeoutRef.current);
          }

          // Immediate scroll for continuous following
          streamingScrollTimeoutRef.current = setTimeout(() => {
            // Double-check user hasn't scrolled up while we were waiting
            // This is the key fix - we check again right before scrolling
            if (
              !isUserScrolledUpRef.current &&
              !isProgrammaticScrollRef.current
            ) {
              messagesRef.current?.scrollToBottomSticky(); // Sticky scroll during streaming
            }
            streamingScrollTimeoutRef.current = null;
          }, 5); // Even faster response for streaming

          return () => {
            if (streamingScrollTimeoutRef.current) {
              clearTimeout(streamingScrollTimeoutRef.current);
              streamingScrollTimeoutRef.current = null;
            }
          };
        }
      }
    } else if (streamingMessageId && isUserScrolledUpRef.current) {
      // If user has scrolled up during streaming, stop continuous scroll
      messagesRef.current?.stopContinuousScroll();
      // Clear any pending scroll timeout
      if (streamingScrollTimeoutRef.current) {
        clearTimeout(streamingScrollTimeoutRef.current);
        streamingScrollTimeoutRef.current = null;
      }
    }
  }, [streamingMessageId, messages]);

  // Handle end of streaming - ensure we're at the very bottom
  useEffect(() => {
    // When streaming ends, ensure we're at the bottom with instant scroll
    if (
      !streamingMessageId &&
      !isUserScrolledUpRef.current &&
      !isProgrammaticScrollRef.current
    ) {
      const timer = setTimeout(() => {
        // Check user hasn't scrolled up while we were waiting
        if (!isUserScrolledUpRef.current && !isProgrammaticScrollRef.current) {
          messagesRef.current?.scrollToBottomInstant(); // Instant scroll when streaming ends
        }
      }, 20); // Reduced from 100ms to 20ms
      return () => clearTimeout(timer);
    }
  }, [streamingMessageId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      messagesRef.current?.scrollToBottomInstant(); // Instant scroll for initial load
      // Initialize scroll tracking
      isUserScrolledUpRef.current = false;
      setScrollProgress(0);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      if (streamingScrollTimeoutRef.current) {
        clearTimeout(streamingScrollTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      // Clear any previous error
      setError(null);

      // Create user message
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content,
        timestamp: new Date(),
        model: selectedModel,
      };

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel,
        isStreaming: true,
      };

      // Add both messages to state in a single update - UI updates immediately
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Set up streaming state immediately
      setIsTyping(true);
      setStreamingMessageId(assistantMessage.id);

      // Reset streaming content tracking
      lastStreamingContentLengthRef.current = 0;

      // Ensure we're considered at bottom for streaming
      isUserScrolledUpRef.current = false;

      // Start continuous scroll tracking for streaming
      messagesRef.current?.startContinuousScroll();

      // Defer heavy work to next tick to allow UI to update first
      setTimeout(() => {
        // Get current messages for context using ref to avoid stale closure
        const allMessages = [...messages, userMessage];
        const llmMessages: LlmMessage[] = allMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Stream chat completion using the unified LlmService
        LlmService.streamChatCompletion(selectedModel, llmMessages, {
          onChunk: (chunk: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          onComplete: () => {
            setIsTyping(false);
            setStreamingMessageId(null);
            // Stop continuous scroll tracking
            messagesRef.current?.stopContinuousScroll();
            // Clear streaming flag
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
          },
          onError: (error: Error) => {
            setError(error.message);
            setIsTyping(false);
            setStreamingMessageId(null);
            // Stop continuous scroll tracking
            messagesRef.current?.stopContinuousScroll();
            // Remove the failed assistant message
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== assistantMessage.id)
            );
          },
        });
      }, 0); // Defer to next tick
    },
    [generateMessageId, selectedModel] // Removed 'messages' dependency
  );

  return (
    <div className="relative h-screen bg-background">
      {/* Model Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-4 left-4 z-20"
      >
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-4 left-4 right-4 mx-auto z-10"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <Messages
        ref={messagesRef}
        messages={messages}
        isTyping={isTyping}
        streamingMessageId={streamingMessageId}
        onScrollChange={handleScrollChange}
      />

      {/* Chat Minimap */}
      {showMinimap && (
        <ChatMinimap
          messages={messages}
          scrollProgress={scrollProgress}
          viewportHeight={viewportHeight}
          contentHeight={contentHeight}
          onScrollTo={scrollTo}
        />
      )}

      {/* Floating Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          opacity: {
            duration: 0.6,
            ease: "easeInOut",
            delay: messages.length === 0 ? 0.2 : 0,
          },
          y: {
            duration: 0.6,
            ease: "easeInOut",
            delay: messages.length === 0 ? 0.2 : 0,
          },
        }}
        layout
        layoutId="message-input"
        className={`absolute ${
          messages.length === 0
            ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-4"
            : "bottom-8 left-4 right-4 max-w-4xl mx-auto"
        }`}
      >
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Ask ${
            getModelById(selectedModel)?.displayName || "AI"
          } anything...`}
          disabled={isTyping}
        />
      </motion.div>
    </div>
  );
}
