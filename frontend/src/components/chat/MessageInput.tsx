import { useState, useRef, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxHeight?: number;
}

export const MessageInput = memo(function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxHeight = 240,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage("");
        // Maintain focus on the textarea after sending
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
    },
    [message, disabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (e.shiftKey) {
          // Allow Shift+Enter to add newline - don't prevent default
          return;
        } else {
          // Regular Enter submits the form
          e.preventDefault();
          handleSubmit(e);
        }
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  // Memoize the disabled state calculation
  const isButtonDisabled = useMemo(() => {
    return disabled || !message.trim();
  }, [disabled, message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-background border border-border focus:border-accent rounded-md px-3 py-3 pr-14 text-sm resize-none min-h-[48px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-accent"
        style={{
          height: "auto",
          minHeight: "52px",
          maxHeight: `${maxHeight}px`,
        }}
        autoFocus
        rows={1}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = Math.min(target.scrollHeight, maxHeight) + "px";
        }}
      />
      <Button
        type="submit"
        disabled={isButtonDisabled}
        size="icon"
        className="absolute bottom-4 right-2 bg-accent text-background hover:bg-accent/90 transition-colors duration-150 h-8 w-8"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
});
