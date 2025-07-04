import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { mockMessages } from "@/data/mockChat";
import { OpenRouterService, type OpenRouterMessage } from "@/lib/openrouter";
import type { Message } from "@/types/chat";

// Debug: Simple render counter
let renderCount = 0;

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
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

      // Check if API key is available
      if (!OpenRouterService.hasApiKey()) {
        setError(
          "OpenRouter API key not found. Please add your API key in settings."
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
      };

      setMessages((prev) => [...prev, aiResponse]);
      setStreamingMessageId(aiResponseId);

      // Convert messages to OpenRouter format
      const openRouterMessages: OpenRouterMessage[] = [
        ...messages,
        newMessage,
      ].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Stream response from OpenRouter
      OpenRouterService.streamChatCompletion(
        openRouterMessages,
        // onChunk: Update the streaming message content
        (chunk: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiResponseId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        // onComplete: Finish streaming
        () => {
          setIsTyping(false);
          setStreamingMessageId(null);
        },
        // onError: Handle errors
        (error: Error) => {
          setIsTyping(false);
          setStreamingMessageId(null);
          setError(error.message);

          // Remove the empty AI response message on error
          setMessages((prev) => prev.filter((msg) => msg.id !== aiResponseId));
        }
      );
    },
    [generateMessageId, messages]
  );

  return (
    <div className="relative h-screen bg-background">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 max-w-4xl mx-auto z-10">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="h-full px-2 pb-20">
        <div className="max-w-4xl mx-auto py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing Indicator */}
          {isTyping && !streamingMessageId && (
            <div className="flex p-4">
              <div className="p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating Message Input */}
      <div className="absolute bottom-8 left-4 right-4 max-w-4xl mx-auto">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder="Ask me anything..."
          disabled={isTyping}
        />
      </div>
    </div>
  );
}
