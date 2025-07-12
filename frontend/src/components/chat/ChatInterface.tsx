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
import { Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [expandedCodeBlock, setExpandedCodeBlock] =
    useState<ExpandedCodeBlock | null>(null);
  const [globalExpandedState, setGlobalExpandedState] = useState<{
    messageId: string | null;
    blockIndex: number | null;
  }>({
    messageId: null,
    blockIndex: null,
  });
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const messagesComponentRef = useRef<MessagesRef>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);

  // Define a type for the code block payload for clarity
  interface CodeBlockPayload {
    code: string;
    language: string;
    filename?: string;
  }

  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model.id);
  }, []);

  const handleGlobalCodeBlockToggle = useCallback(
    (messageId: string, blockIndex: number, payload: CodeBlockPayload) => {
      setGlobalExpandedState((prev) => {
        // If clicking the same block, collapse it
        if (prev.messageId === messageId && prev.blockIndex === blockIndex) {
          setHasExpandedCodeBlock(false);
          setExpandedCodeBlock(null);
          return { messageId: null, blockIndex: null };
        }
        // Otherwise, expand the new block (replacing any currently expanded one)
        const newExpandedBlock: ExpandedCodeBlock = {
          messageId,
          blockIndex,
          ...payload,
        };
        setHasExpandedCodeBlock(true);
        setExpandedCodeBlock(newExpandedBlock);
        return { messageId, blockIndex };
      });
    },
    []
  );

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

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight >= scrollHeight - 50;
  }, []);

  const handleScroll = useCallback(() => {
    if (!isUserScrollingRef.current) return;
    shouldAutoScrollRef.current = isAtBottom();
    isUserScrollingRef.current = false;
  }, [isAtBottom]);

  const handleScrollStart = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      // Multiple scroll attempts with different timing
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, 0);
      setTimeout(scrollToBottom, 10);
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, hasExpandedCodeBlock, scrollToBottom]);

  // Initial scroll
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  const handleSendMessage = useCallback(
    (content: string) => {
      setError(null);

      // Always scroll to bottom when user sends message
      shouldAutoScrollRef.current = true;

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

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      setIsTyping(true);
      setStreamingMessageId(assistantMessage.id);

      // Prepare LLM messages
      const llmMessages: LlmMessage[] = [...messages, userMessage].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      LlmService.streamChatCompletion(selectedModel, llmMessages, {
        onChunk: (chunk: string) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        onComplete: () => {
          setIsTyping(false);
          setStreamingMessageId(null);
          setMessages((current) =>
            current.map((msg) =>
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
        },
      });
    },
    [generateMessageId, selectedModel, messages, scrollToBottom]
  );

  return (
    <div className="relative flex flex-col bg-background overflow-hidden">
      {/* <header className="relative z-20 flex items-center justify-between p-4">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </header> */}
      <div className="relative flex-1 flex">
        <motion.div
          layout
          animate={{
            width: hasExpandedCodeBlock ? "50%" : "100%",
            marginRight: hasExpandedCodeBlock ? "0px" : "0px",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            duration: 0.4,
          }}
          className="flex flex-col min-w-0"
        >
          <div className="flex-1 mx-auto w-full">
            <ScrollArea
              className="h-screen overflow-y-auto p-4"
              onTouchStart={handleScrollStart}
              onMouseDown={handleScrollStart}
            >
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="max-w-3xl mx-auto"
              >
                <Messages
                  ref={messagesComponentRef}
                  messages={messages}
                  isTyping={isTyping}
                  streamingMessageId={streamingMessageId}
                  onScrollChange={() => {}} // No longer needed
                  globalExpandedState={globalExpandedState}
                  onGlobalCodeBlockToggle={handleGlobalCodeBlockToggle}
                />
              </div>
            </ScrollArea>
          </div>

          {/* <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              layout: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              },
            }}
            className="relative z-10 p-4"
          >
            <div className="max-w-3xl mx-auto">
              <MessageInput
                onSendMessage={handleSendMessage}
                placeholder={`Ask ${
                  getModelById(selectedModel)?.displayName || "AI"
                } anything...`}
                disabled={isTyping}
              />
            </div>
          </motion.div> */}
        </motion.div>

        <AnimatePresence mode="wait">
          {hasExpandedCodeBlock && expandedCodeBlock && (
            <motion.div
              key="code-block-pane"
              initial={{
                x: "100%",
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                x: "0%",
                opacity: 1,
                scale: 1,
              }}
              exit={{
                x: "100%",
                opacity: 0,
                scale: 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
                opacity: { duration: 0.2 },
              }}
              className="flex-1 flex flex-col mx-auto min-w-0"
            >
              <motion.div
                key={`${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="border border-border/50 rounded-lg flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {expandedCodeBlock.filename || expandedCodeBlock.language}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleCopyExpanded(
                        expandedCodeBlock.code,
                        `${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}`
                      )
                    }
                    className="h-6 w-6 p-0"
                  >
                    {copiedBlockId ===
                    `${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}` ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-full">
                  <div className="flex-1 overflow-y-auto h-screen">
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={expandedCodeBlock.language}
                      PreTag="div"
                      className="!m-0 !text-xs !font-mono !bg-surface"
                      customStyle={{
                        margin: 0,
                        padding: "12px",
                        overflow: "visible",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {expandedCodeBlock.code}
                    </SyntaxHighlighter>
                  </div>
                </ScrollArea>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
