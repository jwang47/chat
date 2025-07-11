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
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const messagesComponentRef = useRef<MessagesRef>(null);
  const messageIdCounter = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
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

  const scrollToBottom = useCallback((smooth: boolean = false) => {
    isProgrammaticScrollRef.current = true;
    if (smooth) {
      messagesComponentRef.current?.scrollToBottomSmooth();
    } else {
      messagesComponentRef.current?.scrollToBottomInstant();
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 400);
  }, []);

  const handleScrollChange = useCallback(() => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    shouldStickToBottomRef.current = isAtBottom();
  }, [isAtBottom]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages, scrollToBottom]);

  // Initial load scroll (unchanged)
  useEffect(() => {
    shouldStickToBottomRef.current = true;
    const timer = setTimeout(() => {
      scrollToBottom(false);
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

      shouldStickToBottomRef.current = isAtBottom();

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
          if (shouldStickToBottomRef.current) {
            shouldStickToBottomRef.current = isAtBottom();
          }
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
          /* ... */
        },
      });
    },
    [generateMessageId, selectedModel, isAtBottom]
  );

  return (
    <div className="relative flex flex-col h-screen bg-background">
      <header className="relative z-20 flex items-center justify-between p-4">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </header>
      <div className="relative flex-1 flex overflow-hidden">
        <motion.div
          animate={{
            width: hasExpandedCodeBlock ? "50%" : "100%",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`overflow-y-auto`}
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
        </motion.div>
        <AnimatePresence>
          {hasExpandedCodeBlock && (
            <motion.div
              key="code-block-pane"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: "0%", opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 overflow-auto p-4 space-y-4"
            >
              {expandedCodeBlocks.map((block) => {
                const blockId = `${block.messageId}-${block.blockIndex}`;
                return (
                  <div
                    key={blockId}
                    className="border border-border/50 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {block.filename || block.language}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyExpanded(block.code, blockId)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedBlockId === blockId ? (
                          <Check className="h-3 w-3 text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
