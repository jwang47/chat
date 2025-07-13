import { useState, useCallback, useRef } from "react";
import { LlmService, type LlmMessage } from "@/lib/llmService";
import type { Message } from "@/types/chat";
import { getModelById } from "@/lib/models";
import { useChat } from "@/contexts/ChatContext";
import { historyService } from "@/lib/historyService";

interface UseChatLogicProps {
  selectedModel: string;
  scrollToBottom: (immediate?: boolean) => void;
  shouldAutoScrollRef: React.MutableRefObject<boolean>;
}

export function useChatLogic({
  selectedModel,
  scrollToBottom,
  shouldAutoScrollRef,
}: UseChatLogicProps) {
  const {
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
    refreshConversations,
  } = useChat();
  const [error, setError] = useState<string | null>(null);
  const messageIdCounter = useRef(0);

  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  // Phase 1: Add user message and scroll instantly
  const addUserMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: generateMessageId(),
        role: "user",
        content,
        timestamp: new Date(),
        model: selectedModel,
      };

      console.log("📝 Phase 1: Adding user message");
      setMessages((prev) => [...prev, userMessage]);

      // Handle conversation creation and persistence
      let conversationId = currentConversationId;
      
      // If no current conversation, create a new one
      if (!conversationId) {
        try {
          conversationId = await historyService.createConversation();
          setCurrentConversationId(conversationId);
          await refreshConversations();
        } catch (error) {
          console.error("Failed to create conversation:", error);
          return userMessage;
        }
      }

      // Save the user message to the database
      try {
        const historyMessage = historyService.convertFromMessage(userMessage, conversationId);
        await historyService.addMessage(historyMessage);
        await refreshConversations(); // Refresh to update timestamps
      } catch (error) {
        console.error("Failed to save user message:", error);
      }

      // Instant scroll to show user message
      setTimeout(() => {
        console.log("⚡ Instant scroll for user message");
        scrollToBottom(true);
      }, 50);

      return userMessage;
    },
    [generateMessageId, selectedModel, setMessages, scrollToBottom, currentConversationId, setCurrentConversationId, refreshConversations]
  );

  // Phase 2: Add assistant message and start streaming
  const startAssistantResponse = useCallback(
    (userMessage: Message) => {
      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel,
        isStreaming: true,
      };

      console.log("📝 Phase 2: Adding assistant message");
      setMessages((prev) => [...prev, assistantMessage]);

      const currentModel = getModelById(selectedModel);
      if (currentModel?.supportsThinking) {
        setIsThinking(true);
      } else {
        setIsTyping(true);
      }
      setStreamingMessageId(assistantMessage.id);

      // Prepare LLM messages
      const llmMessages: LlmMessage[] = [...messages, userMessage].map(
        (msg) => ({
          role: msg.role,
          content: msg.content,
        })
      );

      return { assistantMessage, llmMessages };
    },
    [
      generateMessageId,
      selectedModel,
      messages,
      setMessages,
      setIsThinking,
      setIsTyping,
      setStreamingMessageId,
    ]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Prevent sending if already streaming
      if (isTyping || isThinking || streamingMessageId) {
        return;
      }

      setError(null);
      shouldAutoScrollRef.current = true;

      // Phase 1: Add user message with instant scroll
      const userMessage = await addUserMessage(content);

      // Phase 2: Add assistant message and start streaming (after delay)
      setTimeout(() => {
        const { assistantMessage, llmMessages } =
          startAssistantResponse(userMessage);

        LlmService.streamChatCompletion(selectedModel, llmMessages, {
          onChunk: (chunk: string) => {
            // Transition from thinking to typing on first chunk
            setIsThinking((current) => {
              if (current) {
                setIsTyping(true);
                return false;
              }
              return current;
            });

            setMessages((current) =>
              current.map((msg) =>
                msg.id === assistantMessage.id && msg.isStreaming
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
          onComplete: async () => {
            setIsTyping(false);
            setIsThinking(false);
            setStreamingMessageId(null);
            
            // Update the assistant message to not be streaming
            let finalAssistantMessage: Message | null = null;
            setMessages((current) =>
              current.map((msg) => {
                if (msg.id === assistantMessage.id) {
                  finalAssistantMessage = { ...msg, isStreaming: false };
                  return finalAssistantMessage;
                }
                return msg;
              })
            );

            // Save the completed assistant message to the database
            if (finalAssistantMessage && currentConversationId) {
              try {
                const historyMessage = historyService.convertFromMessage(finalAssistantMessage, currentConversationId);
                await historyService.addMessage(historyMessage);
                await refreshConversations(); // Refresh to update timestamps
              } catch (error) {
                console.error("Failed to save assistant message:", error);
              }
            }
          },
          onError: (err: Error) => {
            setError(err.message);
            setIsTyping(false);
            setIsThinking(false);
            setStreamingMessageId(null);
          },
        });
      }, 150); // Delay to let user message render and scroll
    },
    [
      addUserMessage,
      startAssistantResponse,
      selectedModel,
      isTyping,
      isThinking,
      streamingMessageId,
      shouldAutoScrollRef,
      setIsThinking,
      setIsTyping,
      setMessages,
      setStreamingMessageId,
      currentConversationId,
      refreshConversations,
    ]
  );

  // Dev controls helpers
  const handleDevAddMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      const newMessage: Message = {
        id: generateMessageId(),
        role,
        content,
        timestamp: new Date(),
        model: role === "user" ? "user" : "dev-assistant",
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [generateMessageId, setMessages]
  );

  const handleDevClearMessages = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setIsThinking(false);
    setStreamingMessageId(null);
  }, [setMessages, setIsTyping, setIsThinking, setStreamingMessageId]);

  return {
    handleSendMessage,
    handleDevAddMessage,
    handleDevClearMessages,
    error,
  };
}
