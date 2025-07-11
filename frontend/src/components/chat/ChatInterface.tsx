import { useState, useEffect, useRef, useCallback } from "react";
import { Messages, type MessagesRef } from "./Messages";
import { MessageInput } from "./MessageInput";
import { LlmService, type LlmMessage } from "@/lib/llmService";
import type { Message, ExpandedCodeBlock } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";
import { mockMessages } from "@/data/mockChat";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel, getModelById, type ModelInfo } from "@/lib/models";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check, X } from "lucide-react";

export function ChatInterface() {
  // const [messages, setMessages] = useState<Message[]>([]);
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
  const [hasExpandedCodeBlock, setHasExpandedCodeBlock] = useState(false);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<
    ExpandedCodeBlock[]
  >([]);
  const [isCopied, setIsCopied] = useState(false);

  // Handle model selection
  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  // Handle code block expansion state changes
  const handleCodeBlockExpansionChange = useCallback((hasExpanded: boolean) => {
    setHasExpandedCodeBlock(hasExpanded);
  }, []);

  // Handle expanded code blocks data
  const handleExpandedCodeBlocksChange = useCallback(
    (expandedBlocks: ExpandedCodeBlock[]) => {
      setExpandedCodeBlocks(expandedBlocks);
    },
    []
  );

  // Handle copy for expanded code
  const handleCopyExpanded = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, []);

  const [contentHeight, setContentHeight] = useState(0);
  const messagesComponentRef = useRef<MessagesRef>(null);
  const messageIdCounter = useRef(0);
  const isUserScrolledUpRef = useRef(false);
  const scrollUpdatePendingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const messagesStateRef = useRef<Message[]>(messages);

  // Keep messagesStateRef in sync with messages state
  useEffect(() => {
    messagesStateRef.current = messages;
  }, [messages]);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Get the scroll container from messages component
  const getScrollContainer = useCallback(() => {
    return messagesComponentRef.current?.getScrollContainer() || null;
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
  const scrollToBottom = useCallback((smooth: boolean = false) => {
    isProgrammaticScrollRef.current = true;
    if (smooth) {
      messagesComponentRef.current?.scrollToBottomSmooth();
    } else {
      messagesComponentRef.current?.scrollToBottomInstant();
    }
    isUserScrolledUpRef.current = false;
    // Reset the flag after a moderate delay to balance responsiveness and accuracy
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 150);
  }, []);

  // Scroll to specific position (for minimap)
  const scrollTo = useCallback((position: number) => {
    isProgrammaticScrollRef.current = true;
    messagesComponentRef.current?.scrollTo(position);
    // Reset the flag after a moderate delay to balance responsiveness and accuracy
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 150);
  }, []);

  // Handle scroll events from virtualized messages
  const handleScrollChange = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (scrollUpdatePendingRef.current) return;

      scrollUpdatePendingRef.current = true;
      requestAnimationFrame(() => {
        // Update the scroll position tracking
        const threshold = 50;
        const isAtBottomWithThreshold =
          scrollTop + clientHeight >= scrollHeight - threshold;

        // Only update scroll tracking if this isn't a programmatic scroll
        // This prevents auto-scroll from interfering with user scroll detection
        if (!isProgrammaticScrollRef.current) {
          // Detect if user is actively scrolling up (more sensitive threshold)
          const isScrollingUp = scrollTop < lastScrollTopRef.current - 5; // 5px threshold for better responsiveness
          if (isScrollingUp) {
            isUserScrolledUpRef.current = true;
          } else if (isAtBottomWithThreshold) {
            // Only reset to false if we're actually at the bottom
            isUserScrolledUpRef.current = false;
          }
          // If we're not scrolling up and not at bottom, maintain current state
        }

        lastScrollTopRef.current = scrollTop;

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
    },
    [streamingMessageId]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll when message count changes (new messages added)
    if (messages.length > 0 && !isUserScrolledUpRef.current) {
      // Use a small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        scrollToBottom(true); // Use smooth scroll for new messages
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]); // Only depend on message count, not content

  // Handle streaming content updates
  useEffect(() => {
    // Only auto-scroll during streaming if user is at bottom and content is actually changing
    if (streamingMessageId && !isUserScrolledUpRef.current) {
      const streamingMessage = messages.find(
        (msg) => msg.id === streamingMessageId
      );
      // Only scroll if there's actual content and we're still streaming
      if (
        streamingMessage &&
        streamingMessage.content &&
        streamingMessage.isStreaming
      ) {
        const timer = setTimeout(() => {
          // Double-check user hasn't scrolled up while we were waiting
          if (!isUserScrolledUpRef.current) {
            scrollToBottom(true); // Use smooth scroll during streaming too
          }
        }, 10);
        return () => clearTimeout(timer);
      }
    }
  }, [streamingMessageId, messages, scrollToBottom]);

  // Handle end of streaming - ensure we're at the very bottom
  useEffect(() => {
    // When streaming ends, if user was at bottom, ensure we're at the very bottom with smooth scroll
    if (!streamingMessageId && !isUserScrolledUpRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom(true); // Use smooth scroll when streaming ends
      }, 50); // Slightly longer delay to ensure DOM is fully updated
      return () => clearTimeout(timer);
    }
  }, [streamingMessageId, scrollToBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      scrollToBottom(true); // Use smooth scroll for initial load
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

      // Ensure we're considered at bottom for streaming
      isUserScrolledUpRef.current = false;

      // Get current messages for context using ref to avoid stale closure
      const allMessages = [...messagesStateRef.current, userMessage];
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
    <div className="relative flex flex-col h-screen bg-background">
      {/* Header Area */}
      <header className="relative z-20 flex items-center justify-between p-4">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </header>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-16 left-4 right-4 mx-auto z-10"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            hasExpandedCodeBlock ? "lg:w-1/2" : "w-full"
          }`}
        >
          <Messages
            ref={messagesComponentRef}
            messages={messages}
            isTyping={isTyping}
            streamingMessageId={streamingMessageId}
            onScrollChange={handleScrollChange}
            onCodeBlockExpansionChange={handleCodeBlockExpansionChange}
            onExpandedCodeBlocksChange={handleExpandedCodeBlocksChange}
          />
        </div>

        {/* Code Block Expanded View */}
        {hasExpandedCodeBlock && (
          <div className="hidden lg:block w-1/2 border-l border-border/50 bg-surface/20">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="text-sm font-medium text-foreground">
                  Expanded Code View
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Close all expanded code blocks
                    setHasExpandedCodeBlock(false);
                    setExpandedCodeBlocks([]);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Code Blocks */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {expandedCodeBlocks.map((block, index) => (
                  <div
                    key={`${block.messageId}-${block.blockIndex}`}
                    className="border border-border/50 rounded-lg overflow-hidden"
                  >
                    {/* Code Block Header */}
                    <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {block.filename || block.language}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {block.code.split("\n").length} lines •{" "}
                          {block.code.length} chars
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyExpanded(block.code)}
                        className="h-6 w-6 p-0"
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {/* Code Content */}
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={block.language}
                      PreTag="div"
                      className="!m-0 !text-xs !font-mono !bg-surface"
                      customStyle={{
                        margin: 0,
                        padding: "12px",
                        maxHeight: "600px",
                        overflow: "auto",
                      }}
                    >
                      {block.code}
                    </SyntaxHighlighter>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative z-10 p-4"
      >
        <div className="max-w-4xl mx-auto">
          <MessageInput
            onSendMessage={handleSendMessage}
            placeholder={`Ask ${
              getModelById(selectedModel)?.displayName || "AI"
            } anything...`}
            disabled={isTyping}
          />
        </div>
      </motion.div>
    </div>
  );
}
