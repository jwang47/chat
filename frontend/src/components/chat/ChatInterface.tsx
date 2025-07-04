import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { mockMessages } from "@/data/mockChat";
import type { Message } from "@/types/chat";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

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

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Thanks for your message! This is a mock response. In a real implementation, this would connect to an LLM API to generate intelligent responses based on your input.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="relative h-screen bg-background">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="h-full px-2 pb-20">
        <div className="max-w-4xl mx-auto py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
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
        />
      </div>
    </div>
  );
}
