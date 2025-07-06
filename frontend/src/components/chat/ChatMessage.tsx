import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
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

// Collapsible message wrapper component
function CollapsibleMessage({
  children,
  content,
  isUser,
}: {
  children: React.ReactNode;
  content: string;
  isUser: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine if message is long enough to warrant collapsing
  const isLongMessage = content.length > 500 || content.split("\n").length > 10;

  if (!isLongMessage) {
    return <>{children}</>;
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative group">
      {/* Fixed collapse button on the left - always visible for long messages */}
      <button
        onClick={toggleCollapsed}
        className={cn(
          "absolute top-2 -left-8 w-6 h-6 rounded-full bg-surface border border-accent/30 flex items-center justify-center transition-all duration-200 hover:bg-accent/10 z-10 shadow-sm",
          "opacity-60 hover:opacity-100",
          isCollapsed && "opacity-100"
        )}
        title={isCollapsed ? "Expand message" : "Collapse message"}
      >
        <svg
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isCollapsed ? "rotate-90" : "rotate-0"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Clickable message area */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden cursor-pointer",
          isCollapsed ? "max-h-16" : "max-h-none"
        )}
        onClick={toggleCollapsed}
        title={
          isCollapsed ? "Click to expand message" : "Click to collapse message"
        }
      >
        {children}
      </div>

      {/* Collapsed State Indicator */}
      {isCollapsed && (
        <div
          className="mt-2 text-xs text-muted-foreground italic flex items-center gap-2 cursor-pointer"
          onClick={toggleCollapsed}
        >
          <span>Message collapsed • Click anywhere to expand</span>
          <svg
            className="w-3 h-3 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}

      {/* Floating collapse button for very long messages */}
      {!isCollapsed && (
        <div className="sticky bottom-2 right-2 float-right mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            className="w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm border border-accent/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent/10 shadow-md"
            title="Collapse message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        </div>
      )}
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

  const messageContent = (
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
  );

  if (disableAnimations) {
    return (
      <div
        className={cn("flex p-4", isUser && "justify-end")}
        data-message-id={message.id}
      >
        <div
          className={cn(
            "p-3 rounded-lg max-w-[90%] relative",
            isUser && "bg-accent/20 text-foreground border border-accent/30"
          )}
        >
          <CollapsibleMessage content={message.content} isUser={isUser}>
            {messageContent}
          </CollapsibleMessage>
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
          "p-3 rounded-lg max-w-[90%] relative",
          isUser && "bg-accent/20 text-foreground border border-accent/30"
        )}
      >
        <CollapsibleMessage content={message.content} isUser={isUser}>
          {messageContent}
        </CollapsibleMessage>
      </motion.div>
    </motion.div>
  );
});
