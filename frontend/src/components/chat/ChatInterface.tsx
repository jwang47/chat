import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/openrouter";
import { GeminiService, type GeminiMessage } from "@/lib/gemini";
import type { Message } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const messageIdCounter = useRef(0);

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

  // Optimized scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (scrollContainer) {
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [getScrollContainer]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      scrollToBottom();
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
            className="absolute top-4 left-4 right-4 max-w-4xl mx-auto z-10"
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

      {/* Floating Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-8 left-4 right-4 max-w-4xl mx-auto"
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
