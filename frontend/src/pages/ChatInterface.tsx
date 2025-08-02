import { useState, useRef, useCallback, useEffect } from "react";
import { Messages, type MessagesRef } from "@/components/chat/Messages";
import { MessageInput } from "@/components/chat/MessageInput";
import type { ExpandedCodeBlock } from "@/types/chat";
import { ModelSelector } from "@/components/ModelSelector";
import { getDefaultModel, type ModelInfo } from "@/lib/models";
import { ResizableSplitter } from "@/components/ResizableSplitter";
import { useChat } from "@/contexts/ChatContext";
import { useChatScroll } from "@/hooks/useChatScroll";
import { ExpandedCodeBlockPanel } from "@/components/chat/ExpandedCodeBlockPanel";
import { useChatLogic } from "@/hooks/useChatLogic";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatInterface() {
  const {
    messages,
    isTyping,
    isThinking,
    streamingMessageId,
    currentConversationId,
  } = useChat();
  const [selectedModel, setSelectedModel] = useState<string>(
    () => getDefaultModel().id,
  );
  const [expandedCodeBlock, setExpandedCodeBlock] =
    useState<ExpandedCodeBlock | null>(null);
  const [globalExpandedState, setGlobalExpandedState] = useState<{
    messageId: string | null;
    blockIndex: number | null;
  }>({
    messageId: null,
    blockIndex: null,
  });
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);

  const messagesComponentRef = useRef<MessagesRef>(null);

  const {
    scrollAreaRef,
    scrollToBottom,
    handleScrollStart,
    setStreaming,
    shouldAutoScrollRef,
  } = useChatScroll();

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
      shouldAutoScrollRef.current = false;

      setGlobalExpandedState((prev) => {
        if (prev.messageId === messageId && prev.blockIndex === blockIndex) {
          setExpandedCodeBlock(null);
          return { messageId: null, blockIndex: null };
        }

        const newExpandedBlock: ExpandedCodeBlock = {
          messageId,
          blockIndex,
          ...payload,
        };
        setExpandedCodeBlock(newExpandedBlock);
        return { messageId, blockIndex };
      });
    },
    [shouldAutoScrollRef],
  );

  const { handleSendMessage } = useChatLogic({
    selectedModel,
    scrollToBottom,
    shouldAutoScrollRef,
  });

  // Update streaming state for scroll behavior
  useEffect(() => {
    setStreaming(!!streamingMessageId);
  }, [streamingMessageId, setStreaming]);

  // Auto-scroll when messages change during streaming (throttled)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (streamingMessageId && shouldAutoScrollRef.current) {
      // Clear existing timeout to debounce rapid calls
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Throttle scroll calls to avoid competing animations
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(); // Use smooth scroll with streaming buffer
      }, 50); // 50ms throttle
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages, streamingMessageId, scrollToBottom, shouldAutoScrollRef]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [currentConversationId, scrollToBottom]);

  const leftPanel = (
    <div className="flex-1 mx-auto w-full relative h-full">
      <div className="absolute top-0 z-20 flex items-center p-2 bg-background w-[calc(100%-8px)] justify-between">
        <ModelSelector
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
        />
      </div>
      <ScrollArea
        ref={scrollAreaRef}
        className={`h-full overflow-y-auto pt-16 pb-20 ${
          messages.length === 0 ? "hidden" : ""
        }`}
        onTouchStart={handleScrollStart}
        onMouseDown={handleScrollStart}
      >
        <div className="max-w-3xl mx-auto px-4">
          <Messages
            ref={messagesComponentRef}
            messages={messages}
            isTyping={isTyping}
            isThinking={isThinking}
            streamingMessageId={streamingMessageId}
            onScrollChange={() => {}} // No longer needed
            globalExpandedState={globalExpandedState}
            onGlobalCodeBlockToggle={handleGlobalCodeBlockToggle}
          />
        </div>
      </ScrollArea>
      <div
        className={
          messages.length > 0
            ? "absolute bottom-0 left-0 right-0 z-20 mb-4 flex justify-center"
            : "absolute inset-0 flex items-center justify-center"
        }
      >
        <div className="w-full max-w-3xl px-4">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );

  const rightPanel = (
    <ExpandedCodeBlockPanel
      expandedCodeBlock={expandedCodeBlock}
      onGlobalCodeBlockToggle={handleGlobalCodeBlockToggle}
    />
  );

  return (
    <div className="relative flex flex-col bg-background overflow-hidden h-screen">
      <div className="relative flex-1 flex h-full">
        <ResizableSplitter
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          showRightPanel={!!expandedCodeBlock}
          initialLeftWidth={leftPanelWidth}
          minLeftWidth={30}
          maxLeftWidth={70}
          onWidthChange={setLeftPanelWidth}
        />
      </div>
    </div>
  );
}
