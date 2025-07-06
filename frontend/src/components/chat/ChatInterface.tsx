import { useState, useRef, useCallback } from "react";
import { MessageInput } from "./MessageInput";
import { Messages, type MessagesRef } from "./Messages";
import { ChatMinimap } from "./ChatMinimap";
import { motion, AnimatePresence } from "motion/react";
import { LlmService, type LlmMessage } from "@/lib/llmService";
import type { Message } from "@/types/chat";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel, getModelById, type ModelInfo } from "@/lib/models";
import { mockMessages } from "@/data/mockChat";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
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
  const messageIdCounter = useRef(0);

  // Handle model selection
  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Scroll to specific position (for minimap)
  const scrollTo = useCallback((position: number) => {
    messagesRef.current?.scrollTo(position);
  }, []);

  // Simplified scroll handling for minimap only
  const handleScrollChange = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      // Calculate scroll progress (0 to 1)
      const progress =
        scrollHeight > clientHeight
          ? scrollTop / (scrollHeight - clientHeight)
          : 0;

      // Get content height for minimap calculations
      const totalContentHeight =
        messagesRef.current?.getContentHeight() || scrollHeight;

      // Update states for minimap
      setScrollProgress(progress);
      setViewportHeight(clientHeight);
      setContentHeight(totalContentHeight);

      // Show minimap if content is scrollable and user has scrolled
      const shouldShowMinimap =
        totalContentHeight > clientHeight * 1.5 && scrollTop > 100;
      setShowMinimap(shouldShowMinimap);
    },
    []
  );

  // ScrollableFeed handles all auto-scroll behavior automatically

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

      // Set up streaming state immediately
      setIsTyping(true);
      setStreamingMessageId(assistantMessage.id);

      // ScrollableFeed will handle auto-scroll automatically

      // Add both messages to state and get fresh context in a single update
      setMessages((prevMessages) => {
        const updatedMessages = [
          ...prevMessages,
          userMessage,
          assistantMessage,
        ];
        const llmMessages: LlmMessage[] = [...prevMessages, userMessage].map(
          (msg) => ({
            role: msg.role,
            content: msg.content,
          })
        );

        // Defer the heavy work, but use the fresh state
        setTimeout(() => {
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
        }, 0);

        return updatedMessages;
      });
    },
    [generateMessageId, selectedModel]
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
        className={`${
          messages.length === 0
            ? "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[960px] px-4"
            : "fixed bottom-8 left-0 right-0 max-w-[960px] mx-auto px-4 z-30"
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
