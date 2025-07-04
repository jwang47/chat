import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { MessageInput } from "./MessageInput";
import { mockMessages } from "@/data/mockChat";
import type { Message } from "@/types/chat";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

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
    <div className="flex flex-col h-screen bg-background">
      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full px-2">
          <div className="max-w-4xl mx-auto py-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 p-4">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-muted-foreground">Assistant</div>
                  <div className="bg-card p-3 rounded-lg shadow-sm">
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
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-surface">
        <div className="max-w-4xl mx-auto">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            placeholder="Ask me anything..."
          />
        </div>
      </div>
    </div>
  );
}
