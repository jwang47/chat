import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex p-4", isUser && "justify-end")}>
      <div
        className={cn(
          "p-3 rounded-lg max-w-[80%]",
          isUser && "bg-accent text-background"
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
