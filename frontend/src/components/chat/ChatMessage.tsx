import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { StreamingText } from "./StreamingText";
import { renderMarkdown } from "@/lib/markdown.tsx";

interface ChatMessageProps {
  message: Message;
  disableAnimations?: boolean;
  onCollapseToggle?: (
    isCollapsed: boolean,
    element: HTMLElement | null
  ) => void;
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
  onCollapseToggle,
}: {
  children: React.ReactNode;
  content: string;
  isUser: boolean;
  onCollapseToggle?: (
    isCollapsed: boolean,
    element: HTMLElement | null
  ) => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Determine if message is long enough to warrant collapsing
  const isLongMessage = content.length > 500 || content.split("\n").length > 10;

  if (!isLongMessage) {
    return <>{children}</>;
  }

  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // Notify parent about the collapse state change
    if (onCollapseToggle) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        onCollapseToggle(newCollapsedState, messageRef.current);
      }, 0);
    }
  };

  return (
    <div className="relative">
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
  onCollapseToggle,
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
          "p-3 rounded-lg max-w-full relative",
          isUser && "bg-accent/20 text-foreground border border-accent/30"
        )}
      >
        <CollapsibleMessage
          content={message.content}
          isUser={isUser}
          onCollapseToggle={onCollapseToggle}
        >
          {messageContent}
        </CollapsibleMessage>
      </div>
    </div>
  );
});
