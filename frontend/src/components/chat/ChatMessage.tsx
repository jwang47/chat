import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { StreamingText } from "./StreamingText";
import { renderMarkdown } from "@/lib/markdown.tsx";

interface ChatMessageProps {
  message: Message;
  disableAnimations?: boolean;
  onHeightChange?: (heightDifference?: number) => void;
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
  const messageRef = useRef<HTMLDivElement>(null);

  // Determine if message is long enough to warrant collapsing
  const isLongMessage = content.length > 500 || content.split("\n").length > 10;

  if (!isLongMessage) {
    return <>{children}</>;
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="relative">
      {/* Reddit-style collapsible line - positioned based on message type */}
      <div
        className={cn(
          "absolute w-4 flex flex-col items-center group",
          isUser
            ? "-right-8 top-[-16px] bottom-[-12px]"
            : "-left-6 top-0 bottom-0"
        )}
      >
        {/* Collapse button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "w-4 h-4 rounded-sm flex items-center justify-center mb-1 shadow-sm text-accent group-hover:text-accent-foreground",
            "opacity-70 group-hover:opacity-100 cursor-pointer",
            isCollapsed && "opacity-100"
          )}
          title={isCollapsed ? "Expand message" : "Collapse message"}
        >
          <svg
            className={cn(
              "w-2.5 h-2.5",
              isCollapsed ? (isUser ? "rotate-90" : "-rotate-90") : "rotate-0"
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

        {/* Vertical line - clickable for collapse/expand */}
        <button
          onClick={toggleCollapsed}
          className="flex-1 w-3 bg-transparent min-h-4 flex items-center justify-center relative cursor-pointer"
          title={
            isCollapsed
              ? "Click to expand message"
              : "Click to collapse message"
          }
        >
          {/* Actual visible line */}
          <div
            className={cn(
              "absolute w-0.5 bg-accent/30",
              "group-hover:bg-accent-foreground",
              "inset-y-0"
            )}
          />
        </button>
      </div>

      {/* Message content */}
      <div ref={messageRef}>
        {isCollapsed ? (
          <div className="text-sm text-muted-foreground italic py-1">
            {isUser ? "User message" : "Assistant message"} • {content.length}{" "}
            characters • Click to expand
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onHeightChange,
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
      ) : isUser ? (
        // Render user messages as plain text without markdown formatting
        <div className="whitespace-pre-wrap">{message.content}</div>
      ) : (
        <StaticMarkdown content={message.content} isUserMessage={isUser} />
      )}
    </div>
  );

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
});
