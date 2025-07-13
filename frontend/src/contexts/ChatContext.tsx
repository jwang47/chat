import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Message } from "@/types/chat";
import type { Conversation } from "@/lib/historyService";
import { historyService } from "@/lib/historyService";

interface ChatContextType {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isThinking: boolean;
  setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
  streamingMessageId: string | null;
  setStreamingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  conversations: Conversation[];
  refreshConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const refreshConversations = useCallback(async () => {
    try {
      const recentConversations = await historyService.getRecentConversations();
      setConversations(recentConversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const historyMessages = await historyService.getMessagesForConversation(conversationId);
      const messages = historyMessages.map(historyService.convertToMessage);
      setMessages(messages);
      setCurrentConversationId(conversationId);
      setIsTyping(false);
      setIsThinking(false);
      setStreamingMessageId(null);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  const newChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setIsTyping(false);
    setIsThinking(false);
    setStreamingMessageId(null);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

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
        currentConversationId,
        setCurrentConversationId,
        conversations,
        refreshConversations,
        loadConversation,
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
