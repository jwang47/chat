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
import { ResizableSplitter } from "@/components/ResizableSplitter";

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
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);

  const messagesComponentRef = useRef<MessagesRef>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

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
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const scrollableElement = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollableElement) {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      }
    }
  }, []);

  const isAtBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return true;
    const scrollableElement = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollableElement) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
    return scrollTop + clientHeight >= scrollHeight - 10;
  }, []);

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    
    const currentScrollTop = target.scrollTop;
    const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);
    
    // Only consider it user scrolling if there's significant movement
    if (scrollDelta > 5) {
      shouldAutoScrollRef.current = isAtBottom();
      isUserScrollingRef.current = false;
    }
    
    lastScrollTopRef.current = currentScrollTop;
  }, [isAtBottom]);

  const handleScrollStart = useCallback(() => {
    isUserScrollingRef.current = true;
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      // Use a more reliable approach for scrolling
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 16); // ~1 frame at 60fps
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, hasExpandedCodeBlock, scrollToBottom]);

  // Attach scroll listener to the correct element
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;
    
    const scrollableElement = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollableElement) return;
    
    scrollableElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

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

  const leftPanel = (
    <div className="flex-1 mx-auto w-full relative max-h-screen">
      <div className="absolute top-0 z-20 flex items-center p-4 bg-background w-[calc(100%-8px)] justify-between">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className="h-screen overflow-y-auto p-4 pt-16 pb-16"
        onTouchStart={handleScrollStart}
        onMouseDown={handleScrollStart}
      >
        <div className="max-w-3xl mx-auto">
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
      <div className="absolute bottom-0 z-20 p-4 w-full">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );

  const rightPanel = expandedCodeBlock && (
    <motion.div
      key={`${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="border-t border-r border-b border-border/50 rounded-r-lg flex-1 flex flex-col"
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
            className="!m-0 !text-xs !font-mono !bg-surface min-h-screen"
            customStyle={{
              margin: 0,
              padding: "12px",
              overflow: "visible",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              borderRadius: "0px",
            }}
          >
            {expandedCodeBlock.code}
          </SyntaxHighlighter>
        </div>
      </ScrollArea>
    </motion.div>
  );

  return (
    <div className="relative flex flex-col bg-background overflow-hidden">
      <div className="relative flex-1 flex">
        <ResizableSplitter
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          showRightPanel={hasExpandedCodeBlock}
          initialLeftWidth={leftPanelWidth}
          minLeftWidth={30}
          maxLeftWidth={70}
          onWidthChange={setLeftPanelWidth}
        />
      </div>
    </div>
  );
}
