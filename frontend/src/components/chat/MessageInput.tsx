import { useState, useRef, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = memo(function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage("");
        // Maintain focus on the input after sending
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    [message, disabled, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);

  // Memoize the disabled state calculation
  const isButtonDisabled = useMemo(() => {
    return disabled || !message.trim();
  }, [disabled, message]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        ref={inputRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 !bg-input bg-background border-border focus:border-accent h-12 py-3"
      />
      <Button
        type="submit"
        disabled={isButtonDisabled}
        size="icon"
        className="shrink-0 bg-accent text-background hover:bg-accent/90 transition-colors duration-150 h-12 w-12"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
});
