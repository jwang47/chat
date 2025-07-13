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
  const savedAssistantMessages = useRef(new Set<string>());

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
      console.log("👤 Adding user message, current conversation ID:", conversationId);
      
      // If no current conversation, create a new one
      if (!conversationId) {
        try {
          console.log("🆕 Creating new conversation...");
          conversationId = await historyService.createConversation();
          console.log("✅ New conversation created with ID:", conversationId);
          setCurrentConversationId(conversationId);
          await refreshConversations();
        } catch (error) {
          console.error("❌ Failed to create conversation:", error);
          return { userMessage, conversationId: null };
        }
      }

      // Save the user message to the database
      try {
        console.log("💾 Saving user message to conversation:", conversationId);
        const historyMessage = historyService.convertFromMessage(userMessage, conversationId);
        await historyService.addMessage(historyMessage);
        await refreshConversations(); // Refresh to update timestamps
        console.log("✅ User message saved successfully");
        
        // Generate title based on first user message (async, non-blocking)
        historyService.generateConversationTitle(conversationId).then(() => {
          // Refresh conversations after title is generated to update UI
          refreshConversations();
        }).catch(error => {
          console.error("Title generation failed:", error);
        });
      } catch (error) {
        console.error("❌ Failed to save user message:", error);
      }

      // Instant scroll to show user message
      setTimeout(() => {
        console.log("⚡ Instant scroll for user message");
        scrollToBottom(true);
      }, 50);

      return { userMessage, conversationId };
    },
    [generateMessageId, selectedModel, setMessages, scrollToBottom, currentConversationId, setCurrentConversationId, refreshConversations]
  );

  // Phase 2: Add assistant message and start streaming
  const startAssistantResponse = useCallback(
    (userMessage: Message, conversationId: string) => {
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

      return { assistantMessage, llmMessages, conversationId };
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
      const { userMessage, conversationId } = await addUserMessage(content);

      // Ensure we have a valid conversation ID before proceeding
      if (!conversationId) {
        console.error("❌ No conversation ID available, cannot start assistant response");
        return;
      }

      // Phase 2: Add assistant message and start streaming (after delay)
      setTimeout(() => {
        const { assistantMessage, llmMessages } =
          startAssistantResponse(userMessage, conversationId);

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
            
            console.log("🎯 onComplete triggered, using conversation ID:", conversationId);
            
            // Update the assistant message to not be streaming and save to DB
            setMessages((current) => {
              const updatedMessages = current.map((msg) => {
                if (msg.id === assistantMessage.id) {
                  const finalMessage = { ...msg, isStreaming: false };
                  
                  // Only save if we haven't saved this message before
                  if (!savedAssistantMessages.current.has(finalMessage.id)) {
                    savedAssistantMessages.current.add(finalMessage.id);
                    
                    // Save immediately after state update
                    setTimeout(async () => {
                      try {
                        console.log("🤖 Saving assistant message:", {
                          messageId: finalMessage.id,
                          conversationId: conversationId,
                          contentLength: finalMessage.content.length
                        });
                        const historyMessage = historyService.convertFromMessage(finalMessage, conversationId);
                        await historyService.addMessage(historyMessage);
                        await refreshConversations();
                      } catch (error) {
                        console.error("❌ Failed to save assistant message:", error);
                      }
                    }, 0);
                  } else {
                    console.log("⏭️ Skipping duplicate save for assistant message:", finalMessage.id);
                  }
                  
                  return finalMessage;
                }
                return msg;
              });
              
              return updatedMessages;
            });
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
