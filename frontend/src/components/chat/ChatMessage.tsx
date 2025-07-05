import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { motion } from "motion/react";
import { StreamingText } from "./StreamingText";

interface ChatMessageProps {
  message: Message;
}

// Debug: Message render counter
let messageRenderCount = 0;

export const ChatMessage = memo(function ChatMessage({
  message,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // Debug: Log message renders
  messageRenderCount++;
  console.log(
    `ChatMessage render #${messageRenderCount} for message ${message.id}`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={cn("flex p-4", isUser && "justify-end")}
      data-message-id={message.id}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut", delay: 0.1 }}
        className={cn(
          "p-3 rounded-lg max-w-[90%]",
          isUser && "bg-accent/20 text-foreground border border-accent/30"
        )}
      >
        <div className="text-sm leading-relaxed">
          {/* Use StreamingText for all messages now */}
          <StreamingText
            content={message.content}
            isStreaming={message.isStreaming || false}
          />
        </div>
      </motion.div>
    </motion.div>
  );
});
