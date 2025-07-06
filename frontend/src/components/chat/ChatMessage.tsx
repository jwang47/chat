import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { memo, useEffect } from "react";
import { motion } from "motion/react";
import { StreamingText } from "./StreamingText";
import { renderMarkdown } from "@/lib/markdown.tsx";

interface ChatMessageProps {
  message: Message;
  disableAnimations?: boolean;
}

// Static markdown renderer for completed messages with full code block support
function StaticMarkdown({
  content,
  isUserMessage = false,
}: {
  content: string;
  isUserMessage?: boolean;
}) {
  return (
    <div className="[&>*:last-child]:mb-0">
      {renderMarkdown(content, isUserMessage)}
    </div>
  );
}

export const ChatMessage = memo(function ChatMessage({
  message,
  disableAnimations = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isActivelyStreaming = message.isStreaming === true;

  // Debug print when finished streaming
  useEffect(() => {
    if (!isActivelyStreaming) {
      console.log("Streaming finished!", message.content);
    }
  }, [isActivelyStreaming]);

  if (disableAnimations) {
    return (
      <div
        className={cn("flex p-4", isUser && "justify-end")}
        data-message-id={message.id}
      >
        <div
          className={cn(
            "p-3 rounded-lg max-w-[90%]",
            isUser && "bg-accent/20 text-foreground border border-accent/30"
          )}
        >
          <div className="text-sm leading-relaxed">
            {/* Use StreamingText only for actively streaming messages */}
            {isActivelyStreaming ? (
              <StreamingText
                content={message.content}
                isStreaming={true}
                isUserMessage={isUser}
              />
            ) : (
              <StaticMarkdown
                content={message.content}
                isUserMessage={isUser}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {/* Use StreamingText only for actively streaming messages */}
          {isActivelyStreaming ? (
            <StreamingText
              content={message.content}
              isStreaming={true}
              isUserMessage={isUser}
            />
          ) : (
            <StaticMarkdown content={message.content} isUserMessage={isUser} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
