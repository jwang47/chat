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
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(
    () => getDefaultModel().id
  );
  const [hasExpandedCodeBlock, setHasExpandedCodeBlock] = useState(false);
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<
    ExpandedCodeBlock[]
  >([]);

  // FIX 1: Changed `isCopied` to track the specific block being copied
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const messagesComponentRef = useRef<MessagesRef>(null);
  const messageIdCounter = useRef(0);
  const isUserScrolledUpRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const messagesStateRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesStateRef.current = messages;
  }, [messages]);

  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  const handleCodeBlockExpansionChange = useCallback((hasExpanded: boolean) => {
    setHasExpandedCodeBlock(hasExpanded);
  }, []);

  const handleExpandedCodeBlocksChange = useCallback(
    (expandedBlocks: ExpandedCodeBlock[]) => {
      setExpandedCodeBlocks(expandedBlocks);
    },
    []
  );

  // FIX 2: Updated copy handler to manage state per-block
  const handleCopyExpanded = useCallback(
    async (code: string, blockId: string) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedBlockId(blockId);
        setTimeout(() => setCopiedBlockId(null), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    },
    []
  );

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  const getScrollContainer = useCallback(() => {
    return messagesComponentRef.current?.getScrollContainer() || null;
  }, []);

  const isAtBottom = useCallback(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const threshold = 50;
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, [getScrollContainer]);

  // FIX 3: Robust scroll functions with better timeout handling
  const scrollToBottom = useCallback((smooth: boolean = false) => {
    isProgrammaticScrollRef.current = true;
    if (smooth) {
      messagesComponentRef.current?.scrollToBottomSmooth();
    } else {
      messagesComponentRef.current?.scrollToBottomInstant();
    }
    isUserScrolledUpRef.current = false;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 300); // Increased timeout for smooth scroll
  }, []);

  const scrollTo = useCallback((position: number) => {
    isProgrammaticScrollRef.current = true;
    messagesComponentRef.current?.scrollTo(position);
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 300);
  }, []);

  // FIX 4: Simplified and more reliable scroll handler
  const handleScrollChange = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      if (isProgrammaticScrollRef.current) return;
      isUserScrolledUpRef.current = !isAtBottom();
    },
    [isAtBottom]
  );

  // FIX 5: Unified auto-scroll logic into a single, clean effect
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(false); // Use instant scroll on load
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  const handleSendMessage = useCallback(
    (content: string) => {
      setError(null);

      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content,
        timestamp: new Date(),
        model: selectedModel,
      };
      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel,
        isStreaming: true,
      };

      // FIX 6: Proactively check scroll position BEFORE adding new messages
      const shouldStickToBottom = isAtBottom();
      isUserScrolledUpRef.current = !shouldStickToBottom;

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      setIsTyping(true);
      setStreamingMessageId(assistantMessage.id);

      const allMessages = [...messagesStateRef.current, userMessage];
      const llmMessages: LlmMessage[] = allMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

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
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== assistantMessage.id)
          );
        },
      });
    },
    [generateMessageId, selectedModel, isAtBottom] // Added isAtBottom dependency
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

      {/* Error Display ... */}
      {error && <div className="text-red-500">{error}</div>}

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
                {expandedCodeBlocks.map((block) => {
                  // FIX 7: Create a unique ID for each block to manage copy state
                  const blockId = `${block.messageId}-${block.blockIndex}`;
                  return (
                    <div
                      key={blockId}
                      className="border border-border/50 rounded-lg overflow-hidden"
                    >
                      {/* Code Block Header */}
                      <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            {block.filename || block.language}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyExpanded(block.code, blockId)
                          }
                          className="h-6 w-6 p-0"
                        >
                          {copiedBlockId === blockId ? (
                            <Check className="h-3 w-3 text-green-400" />
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
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input Area ... */}
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
