import type { Message, ExpandedCodeBlock } from "@/types/chat";
import { cn } from "@/lib/utils";
import { MarkedRenderer } from "./MarkedRenderer";
import { memo } from "react";

interface ChatMessageProps {
  message: Message;
  disableAnimations?: boolean;
  onCollapseToggle?: (
    isCollapsed: boolean,
    element: HTMLElement | null
  ) => void;
  onCodeBlockExpansionChange?: (hasExpanded: boolean) => void;
  onExpandedCodeBlocksChange?: (expandedBlocks: ExpandedCodeBlock[]) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onCodeBlockExpansionChange,
  onExpandedCodeBlocksChange,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  const messageContent = (
    <div className="text-sm leading-relaxed">
      {isUser ? (
        <div className="whitespace-pre-wrap">{message.content}</div>
      ) : (
        // Use our new React-based Marked renderer
        <MarkedRenderer
          content={message.content}
          messageId={message.id}
          onCodeBlockExpansionChange={onCodeBlockExpansionChange}
          onExpandedCodeBlocksChange={onExpandedCodeBlocksChange}
        />
      )}
    </div>
  );

  return (
    <div
      className={cn("flex p-2", isUser && "justify-end")}
      data-message-id={message.id}
    >
      <div
        className={cn(
          "pb-3 pt-3 rounded-lg max-w-full relative",
          isUser && "pl-3 pr-3 bg-highlight-soft text-highlight-soft-foreground"
        )}
      >
        {messageContent}
      </div>
    </div>
  );
});
