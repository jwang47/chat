import { createContext, useContext, useState, useCallback } from "react";
import type { Message } from "@/types/chat";

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isThinking: boolean;
  setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
  streamingMessageId: string | null;
  setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  newChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  const newChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setIsThinking(false);
    setStreamingMessageId(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        isTyping,
        setIsTyping,
        isThinking,
        setIsThinking,
        streamingMessageId,
        setStreamingMessageId,
        newChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
