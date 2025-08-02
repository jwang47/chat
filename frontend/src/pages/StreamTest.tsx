import { useState, useEffect, useRef, useCallback } from "react";
import { Messages, type MessagesRef } from "@/components/chat/Messages";
import { MessageInput } from "@/components/chat/MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatScroll } from "@/hooks/useChatScroll";
import type { Message } from "@/types/chat";

// Sample text corpus for streaming
const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. This pangram sentence contains every letter of the alphabet at least once. ",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ",
  "In the realm of artificial intelligence, machine learning algorithms process vast amounts of data to identify patterns and make predictions. ",
  "React is a powerful JavaScript library for building user interfaces. It uses a component-based architecture and virtual DOM for efficient updates. ",
  "The history of computing dates back to ancient times with devices like the abacus. Modern computers evolved from mechanical calculators to electronic machines. ",
  "TypeScript adds static typing to JavaScript, enabling better tooling and catching errors at compile time rather than runtime. ",
  "Web development has evolved significantly over the years, from simple HTML pages to complex single-page applications with rich interactivity. ",
  "The concept of responsive design ensures that websites work well on devices of all sizes, from mobile phones to desktop computers. ",
  "Version control systems like Git enable developers to track changes, collaborate effectively, and maintain a history of their codebase. ",
  "Cloud computing has revolutionized how we deploy and scale applications, providing on-demand resources and global accessibility. ",
];

export function StreamTest() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [autoStream, setAutoStream] = useState(false);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIdCounter = useRef(0);
  const messagesComponentRef = useRef<MessagesRef>(null);

  const {
    scrollAreaRef,
    scrollToBottom,
    handleScrollStart,
    shouldAutoScrollRef,
  } = useChatScroll({
    lerp: false,
    maxScrollPerSecond: 1500,
    duration: 200, // Fast 100ms scroll duration
  });

  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `msg-${messageIdCounter.current}`;
  };

  const getRandomText = () => {
    return SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
  };

  const startNewStream = useCallback(() => {
    if (isStreaming) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content: "Test message " + new Date().toLocaleTimeString(),
      timestamp: new Date(),
      model: "test",
    };

    const assistantMessage: Message = {
      id: generateMessageId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      model: "test",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setStreamingMessageId(assistantMessage.id);
    shouldAutoScrollRef.current = true;

    // Simulate streaming
    const fullText = Array(50)
      .fill(null)
      .map(() => getRandomText())
      .join(" ");
    const words = fullText.split(" ");
    let wordIndex = 0;

    const streamInterval = setInterval(() => {
      if (wordIndex < words.length) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: words.slice(0, wordIndex + 1).join(" ") + " ",
                }
              : msg,
          ),
        );
        wordIndex++;
      } else {
        // Stream complete
        clearInterval(streamInterval);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, isStreaming: false }
              : msg,
          ),
        );
        setIsStreaming(false);
        setStreamingMessageId(null);

        // If auto-stream is enabled, start a new stream after a delay
        if (autoStream) {
          setTimeout(startNewStream, 1000);
        }
      }
    }, 5); // Stream a word every 50ms (20 words per second)

    streamIntervalRef.current = streamInterval;
  }, [isStreaming, autoStream, scrollToBottom, shouldAutoScrollRef]);

  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    setAutoStream(false);
  };

  const toggleAutoStream = () => {
    if (autoStream) {
      setAutoStream(false);
      stopStreaming();
    } else {
      setAutoStream(true);
      if (!isStreaming) {
        startNewStream();
      }
    }
  };

  const clearMessages = () => {
    stopStreaming();
    setMessages([]);
  };

  // Auto-scroll when messages change during streaming
  useEffect(() => {
    if (isStreaming && shouldAutoScrollRef.current) {
      scrollToBottom(); // Use smooth scroll with fast duration
    }
  }, [messages, isStreaming, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b p-4">
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Stream Test</h1>
          <div className="flex gap-2">
            <Button
              onClick={startNewStream}
              disabled={isStreaming}
              variant="default"
              size="sm"
            >
              Start Stream
            </Button>
            <Button
              onClick={toggleAutoStream}
              variant={autoStream ? "destructive" : "outline"}
              size="sm"
            >
              {autoStream ? "Stop Auto" : "Auto Stream"}
            </Button>
            <Button onClick={clearMessages} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <Messages
          ref={messagesComponentRef}
          messages={messages}
          isTyping={false}
          isThinking={false}
          streamingMessageId={streamingMessageId}
          className="px-4 py-8"
        />
      </ScrollArea>

      <div className="border-t bg-background">
        <div className="max-w-[960px] mx-auto p-4">
          <MessageInput
            onSendMessage={startNewStream}
            onFocus={handleScrollStart}
            disabled={isStreaming}
            placeholder="Press enter to start a new stream..."
          />
        </div>
      </div>
    </div>
  );
}
