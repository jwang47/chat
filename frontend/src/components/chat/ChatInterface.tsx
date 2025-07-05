import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatMinimap } from "./ChatMinimap";
import { MessageInput } from "./MessageInput";
import { LlmService, type LlmMessage } from "@/lib/llmService";
import type { Message } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";
import { mockMessages } from "@/data/mockChat";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel, getModelById, type ModelInfo } from "@/lib/models";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(
    () => getDefaultModel().id
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Handle model selection
  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  const [contentHeight, setContentHeight] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const messageIdCounter = useRef(0);
  const isUserScrolledUpRef = useRef(false);
  const scrollUpdatePendingRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Cache the scroll container reference
  const getScrollContainer = useCallback(() => {
    if (!scrollContainerRef.current && scrollAreaRef.current) {
      scrollContainerRef.current = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
    }
    return scrollContainerRef.current;
  }, []);

  // Check if user is at or near the bottom of the chat
  const isAtBottom = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const threshold = 50; // pixels from bottom
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, [getScrollContainer]);

  // Optimized scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        // Update state to reflect that we're now at the bottom
        isUserScrolledUpRef.current = false;
      });
    }
  }, [getScrollContainer]);

  // Scroll to specific position (for minimap)
  const scrollTo = useCallback(
    (position: number) => {
      const scrollContainer = getScrollContainer();
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = Math.max(
            0,
            Math.min(
              position,
              scrollContainer.scrollHeight - scrollContainer.clientHeight
            )
          );
        });
      }
    },
    [getScrollContainer]
  );

  // Handle scroll events to track user scroll position
  const handleScroll = useCallback(() => {
    if (scrollUpdatePendingRef.current) return;

    scrollUpdatePendingRef.current = true;
    requestAnimationFrame(() => {
      const scrollContainer = getScrollContainer();
      if (!scrollContainer) {
        scrollUpdatePendingRef.current = false;
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

      // Update the scroll position tracking
      const isAtBottomNow = scrollTop + clientHeight >= scrollHeight - 50;
      isUserScrolledUpRef.current = !isAtBottomNow;

      // Calculate scroll progress (0 to 1)
      const progress =
        scrollHeight > clientHeight
          ? scrollTop / (scrollHeight - clientHeight)
          : 0;

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
        if (prev === scrollHeight) return prev;
        return scrollHeight;
      });

      scrollUpdatePendingRef.current = false;
    });
  }, [getScrollContainer]);

  // Set up scroll event listener with more responsive options
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      // Use passive: false to allow immediate updates
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: false,
      });
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [getScrollContainer, handleScroll]);

  // Auto-scroll to bottom when new messages arrive, but only if user is at bottom
  useEffect(() => {
    // Always scroll to bottom for the first message or if user is already at bottom
    if (messages.length > 0 && !isUserScrolledUpRef.current) {
      // Use a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]); // Only depend on messages.length, not the entire messages array

  // Scroll to bottom on initial load
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      scrollToBottom();
      // Initialize scroll tracking
      isUserScrolledUpRef.current = false;
      setScrollProgress(0);
    }, 100);

    return () => clearTimeout(timer);
  }, [scrollToBottom]);

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

      // Add both messages to state in a single update
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Set up streaming
      setIsTyping(true);
      setStreamingMessageId(assistantMessage.id);

      // Get current messages for context using ref to avoid stale closure
      const allMessages = [...messagesRef.current, userMessage];
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
          // Remove the failed assistant message
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== assistantMessage.id)
          );
        },
      });
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
      <ScrollArea ref={scrollAreaRef} className="h-full px-2 pb-20">
        <div className="max-w-4xl mx-auto py-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && !streamingMessageId && (
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
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Chat Minimap */}
      <ChatMinimap
        messages={messages}
        scrollProgress={scrollProgress}
        viewportHeight={viewportHeight}
        contentHeight={contentHeight}
        onScrollTo={scrollTo}
      />

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
