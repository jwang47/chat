import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { MarkedRenderer } from "./MarkedRenderer";
import { IncrementalRenderer } from "./IncrementalRenderer";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// Threshold for when to show collapsed view for user messages (number of lines)
const COLLAPSE_THRESHOLD_LINES = 8;

interface CodeBlockPayload {
  code: string;
  language: string;
  filename?: string;
}

interface ChatMessageProps {
  message: Message;
  disableAnimations?: boolean;
  showThinking?: boolean;
  onCollapseToggle?: (
    isCollapsed: boolean,
    element: HTMLElement | null
  ) => void;
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalCodeBlockToggle?: (
    messageId: string,
    blockIndex: number,
    payload: CodeBlockPayload
  ) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  showThinking,
  globalExpandedState,
  onGlobalCodeBlockToggle,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isUserMessageCollapsed, setIsUserMessageCollapsed] = useState(true);

  // Check if user message should be collapsible
  const userMessageLineCount = isUser ? message.content.split("\n").length : 0;
  const shouldBeCollapsible =
    isUser && userMessageLineCount > COLLAPSE_THRESHOLD_LINES;

  const handleUserMessageToggle = () => {
    setIsUserMessageCollapsed(!isUserMessageCollapsed);
  };

  const messageContent = (
    <div className="text-sm leading-relaxed">
      {isUser ? (
        shouldBeCollapsible ? (
          <div className="space-y-2">
            {/* Collapsible header */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUserMessageToggle}
                className="h-5 w-5 p-0"
              >
                <ChevronRight
                  className={`h-3 w-3 transition-transform ${
                    !isUserMessageCollapsed ? "rotate-90" : ""
                  }`}
                />
              </Button>
              <span>
                {userMessageLineCount} lines • {message.content.length} chars
              </span>
              <span className="text-muted-foreground/60">
                {isUserMessageCollapsed
                  ? "Click to expand"
                  : "Click to collapse"}
              </span>
            </div>

            {/* Message content */}
            <div
              className={cn(
                "whitespace-pre-wrap transition-all duration-200",
                isUserMessageCollapsed && "max-h-24 overflow-hidden relative"
              )}
            >
              {message.content}
              {isUserMessageCollapsed && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-highlight-soft to-transparent flex items-end justify-center pb-1">
                  <span className="text-xs text-muted-foreground">...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )
      ) : (
        // Show thinking indicator if model is thinking
        showThinking ? (
          <ThinkingIndicator />
        ) : (
          // Use IncrementalRenderer for streaming, MarkedRenderer for static content
          message.isStreaming ? (
            <IncrementalRenderer
              content={message.content}
              messageId={message.id}
              isStreaming={true}
              globalExpandedState={globalExpandedState}
              onGlobalCodeBlockToggle={onGlobalCodeBlockToggle}
              wordsPerSecond={12}
            />
          ) : (
            <MarkedRenderer
              content={message.content}
              messageId={message.id}
              isStreaming={false}
              globalExpandedState={globalExpandedState}
              onGlobalCodeBlockToggle={onGlobalCodeBlockToggle}
            />
          )
        )
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
