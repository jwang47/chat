import Dexie, { type Table } from "dexie";
import type { Message } from "@/types/chat";

// Define the Conversation type for our DB
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

// Extend the Message type from chat.ts to include conversationId
export interface HistoryMessage extends Omit<Message, "timestamp"> {
  conversationId: string;
  timestamp: number; // Store as number for IndexedDB
}

class ChatHistoryDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<HistoryMessage>;

  constructor() {
    super("ChatHistoryDB");
    this.version(1).stores({
      conversations: "id, &updatedAt", // Primary key 'id', index 'updatedAt'
      messages: "id, conversationId, timestamp", // Primary key 'id', index 'conversationId'
    });
    this.version(2).stores({
      conversations: "id, &updatedAt, isPinned", // Add isPinned index
      messages: "id, conversationId, timestamp",
    });
  }
}

const db = new ChatHistoryDatabase();

// --- Exported API ---

export const historyService = {
  // CRUD for Conversations
  createConversation: async (title?: string): Promise<string> => {
    const now = Date.now();

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: title || "", // Empty title by default
      createdAt: now,
      updatedAt: now,
    };

    await db.conversations.add(conversation);
    return conversation.id;
  },

  getRecentConversations: async (limit = 20): Promise<Conversation[]> => {
    const conversations = await db.conversations
      .orderBy("updatedAt")
      .reverse()
      .limit(limit * 2) // Get more to account for sorting
      .toArray();

    // Sort: pinned conversations first (by updatedAt), then unpinned (by updatedAt)
    const sorted = conversations.sort((a, b) => {
      // If pin status differs, pinned comes first
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // If pin status is same, sort by updatedAt (newer first)
      return b.updatedAt - a.updatedAt;
    });

    return sorted.slice(0, limit);
  },

  updateConversationTimestamp: async (id: string): Promise<void> => {
    await db.conversations.update(id, { updatedAt: Date.now() });
  },

  updateConversationTitle: async (id: string, title: string): Promise<void> => {
    await db.conversations.update(id, { title, updatedAt: Date.now() });
  },

  updateConversationPin: async (
    id: string,
    isPinned: boolean
  ): Promise<void> => {
    await db.conversations.update(id, { isPinned, updatedAt: Date.now() });
  },

  deleteConversation: async (id: string): Promise<void> => {
    // Delete all messages for this conversation first
    await db.messages.where("conversationId").equals(id).delete();
    // Then delete the conversation
    await db.conversations.delete(id);
  },

  // CRUD for Messages
  addMessage: async (message: Omit<HistoryMessage, "id">): Promise<string> => {
    const messageWithId: HistoryMessage = {
      ...message,
      id: crypto.randomUUID(),
    };

    await db.messages.add(messageWithId);

    // Update the conversation's timestamp
    await historyService.updateConversationTimestamp(message.conversationId);

    return messageWithId.id;
  },

  getMessagesForConversation: async (
    conversationId: string
  ): Promise<HistoryMessage[]> => {
    const messages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
    return messages;
  },

  // Search functionality (for Phase 2)
  searchMessages: async (
    query: string
  ): Promise<{ conversation: Conversation; message: HistoryMessage }[]> => {
    const messages = await db.messages
      .filter((message) =>
        message.content.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();

    const results = [];
    for (const message of messages) {
      const conversation = await db.conversations.get(message.conversationId);
      if (conversation) {
        results.push({ conversation, message });
      }
    }

    return results;
  },

  // Helper to convert HistoryMessage back to Message for UI
  convertToMessage: (historyMessage: HistoryMessage): Message => ({
    id: historyMessage.id,
    role: historyMessage.role,
    content: historyMessage.content,
    timestamp: new Date(historyMessage.timestamp),
    model: historyMessage.model,
    isStreaming: historyMessage.isStreaming,
  }),

  // Helper to convert Message to HistoryMessage for storage
  convertFromMessage: (
    message: Message,
    conversationId: string
  ): Omit<HistoryMessage, "id"> => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.getTime(),
    model: message.model,
    conversationId,
    isStreaming: message.isStreaming,
  }),

  // Generate a better title for a conversation using AI
  generateConversationTitle: async (conversationId: string): Promise<void> => {
    try {
      // Check if the conversation already has a custom title
      const conversation = await db.conversations.get(conversationId);
      if (!conversation) {
        console.warn("❌ Conversation not found");
        return;
      }

      // If title is not empty, skip generation
      if (conversation.title && conversation.title.trim().length > 0) {
        console.warn(
          "⏭️ Conversation already has a custom title:",
          conversation.title
        );
        return;
      }

      // Get the first user message from the conversation
      const messages = await db.messages
        .where("conversationId")
        .equals(conversationId)
        .sortBy("timestamp");

      if (messages.length < 1) {
        console.warn("⏭️ No messages found for title generation");
        return;
      }

      // Get the first user message
      const firstUserMessage = messages.find((msg) => msg.role === "user");
      if (!firstUserMessage) {
        return;
      }

      // Use just the first user message for title generation
      const conversationText = firstUserMessage.content;

      // Call Gemini to generate a title
      const ApiKeyStorage = (await import("./apiKeyStorage")).default;
      const apiKey = await ApiKeyStorage.getApiKey("gemini");

      if (!apiKey) {
        console.error("❌ No Gemini API key found for title generation");
        return;
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent",
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a concise 2-4 word title for a conversation that starts with this user message. Just return the title, nothing else:\n\n"${conversationText}"`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 20,
              temperature: 0.3,
            },
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "❌ Failed to generate title, API response:",
          response.status
        );
        return;
      }

      const data = await response.json();
      const generatedTitle =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (generatedTitle && generatedTitle.length > 0) {
        await historyService.updateConversationTitle(
          conversationId,
          generatedTitle
        );
      } else {
        console.warn("⚠️ No valid title generated");
      }
    } catch (error) {
      console.error("❌ Failed to generate conversation title:", error);
    }
  },
};
