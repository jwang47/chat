import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Message } from "@/types/chat";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldClip, setShouldClip] = useState(false);
  const [hiddenLines, setHiddenLines] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if message content would exceed 50vh and calculate hidden lines
  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const viewportHeight = window.innerHeight;
      const shouldClipMessage = contentHeight > viewportHeight * 0.5;
      setShouldClip(shouldClipMessage);

      if (shouldClipMessage) {
        // Estimate lines based on line height (assuming ~1.5rem per line)
        const lineHeight = 24; // approximate line height in pixels
        const visibleHeight = viewportHeight * 0.5;
        const totalLines = Math.ceil(contentHeight / lineHeight);
        const visibleLines = Math.ceil(visibleHeight / lineHeight);
        const hiddenLinesCount = Math.max(0, totalLines - visibleLines);
        setHiddenLines(hiddenLinesCount);
      }
    }
  }, [message.content]);

  return (
    <div className={cn("flex gap-3 p-4", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs border-0",
            isUser && "bg-accent text-background",
            isAssistant && "bg-card text-foreground"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn("flex flex-col gap-1 max-w-[80%]", isUser && "items-end")}
      >
        <div className="text-xs text-muted-foreground font-medium">
          {isUser ? "You" : "Assistant"}
        </div>

        <div
          className={cn(
            "p-3 rounded-lg relative",
            isUser && "bg-accent text-background",
            isAssistant && "bg-card text-foreground border-0"
          )}
        >
          <div
            ref={contentRef}
            className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              shouldClip && !isExpanded && "max-h-[50vh] overflow-hidden"
            )}
          >
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
            )}
          </div>

          {/* Hidden lines indicator */}
          {shouldClip && !isExpanded && hiddenLines > 0 && (
            <div className="mt-2 text-[10px] text-muted-foreground text-center">
              {hiddenLines} lines hidden
            </div>
          )}

          {/* Clickable overlay for expansion - only when collapsed */}
          {shouldClip && !isExpanded && (
            <div
              onClick={() => setIsExpanded(true)}
              className="absolute inset-0 cursor-pointer hover:bg-white/5 transition-all duration-150"
              title="Click to expand"
            />
          )}

          {/* Clickable overlay for compacting - when expanded */}
          {shouldClip && isExpanded && (
            <div
              onClick={() => setIsExpanded(false)}
              className="absolute inset-0 cursor-pointer hover:bg-white/5 transition-all duration-150"
              title="Click to compact"
            />
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
