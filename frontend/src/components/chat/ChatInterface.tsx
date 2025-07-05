import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatMinimap } from "./ChatMinimap";
import { MessageInput } from "./MessageInput";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/openrouter";
import { GeminiService, type GeminiMessage } from "@/lib/gemini";
import type { Message } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { mockMessages } from "@/data/mockChat";

// Debug: Simple render counter
let renderCount = 0;

type AIProvider = "openrouter" | "gemini";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("gemini");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const messageIdCounter = useRef(0);
  const isUserScrolledUpRef = useRef(false);
  const scrollUpdatePendingRef = useRef(false);

  // Debug: Log renders
  renderCount++;
  console.log(`ChatInterface render #${renderCount}`);

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
      const isAtBottomNow = isAtBottom();
      isUserScrolledUpRef.current = !isAtBottomNow;

      // Calculate scroll progress (0 to 1) - immediate update
      const progress =
        scrollHeight > clientHeight
          ? scrollTop / (scrollHeight - clientHeight)
          : 0;

      // Update state for minimap dimensions
      setScrollProgress(progress);
      setViewportHeight(clientHeight);
      setContentHeight(scrollHeight);

      scrollUpdatePendingRef.current = false;
    });
  }, [getScrollContainer, isAtBottom]);

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
    if (messages.length === 0 || !isUserScrolledUpRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

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

      // Check if API key is available for selected provider
      const hasApiKey =
        selectedProvider === "openrouter"
          ? OpenRouterService.hasApiKey()
          : GeminiService.hasApiKey();

      if (!hasApiKey) {
        setError(
          `${
            selectedProvider === "openrouter" ? "OpenRouter" : "Gemini"
          } API key not found. Please add your API key in settings.`
        );
        return;
      }

      const newMessage: Message = {
        id: generateMessageId(),
        content,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);

      // Create AI response message with empty content for streaming
      const aiResponseId = generateMessageId();
      const aiResponse: Message = {
        id: aiResponseId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        isStreaming: true, // Mark as streaming
      };

      setMessages((prev) => [...prev, aiResponse]);
      setStreamingMessageId(aiResponseId);

      // Convert messages to appropriate format
      const allMessages = [...messages, newMessage];

      // Shared callback functions
      const onChunk = (chunk: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiResponseId
              ? { ...msg, content: msg.content + chunk, isStreaming: true }
              : msg
          )
        );
      };

      const onComplete = () => {
        setIsTyping(false);
        setStreamingMessageId(null);

        // Mark message as no longer streaming
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiResponseId ? { ...msg, isStreaming: false } : msg
          )
        );
      };

      const onError = (error: Error) => {
        setIsTyping(false);
        setStreamingMessageId(null);
        setError(error.message);

        // Remove the empty AI response message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== aiResponseId));
      };

      // Stream response from selected provider
      if (selectedProvider === "openrouter") {
        const openRouterMessages: OpenRouterMessage[] = allMessages.map(
          (msg) => ({
            role: msg.role,
            content: msg.content,
          })
        );

        OpenRouterService.streamChatCompletion(
          openRouterMessages,
          onChunk,
          onComplete,
          onError
        );
      } else {
        const geminiMessages: GeminiMessage[] = allMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        GeminiService.streamChatCompletion(
          geminiMessages,
          onChunk,
          onComplete,
          onError
        );
      }
    },
    [generateMessageId, messages, selectedProvider]
  );

  return (
    <div className="relative h-screen bg-background">
      {/* Provider Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute top-4 left-4 z-20"
      >
        <div className="flex gap-2">
          <Button
            variant={selectedProvider === "gemini" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("gemini")}
            className="text-xs"
          >
            Gemini
          </Button>
          <Button
            variant={selectedProvider === "openrouter" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("openrouter")}
            className="text-xs"
          >
            OpenRouter
          </Button>
        </div>
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
            selectedProvider === "gemini" ? "Gemini" : "OpenRouter"
          } anything...`}
          disabled={isTyping}
        />
      </motion.div>
    </div>
  );
}
