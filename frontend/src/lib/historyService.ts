import Dexie, { type Table } from "dexie";
import type { Message } from "@/types/chat";

// Define the Conversation type for our DB
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// Extend the Message type from chat.ts to include conversationId
export interface HistoryMessage extends Omit<Message, 'timestamp'> {
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
      title: title || `Chat from ${new Date().toLocaleString()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.conversations.add(conversation);
    return conversation.id;
  },

  getRecentConversations: async (limit = 20): Promise<Conversation[]> => {
    return await db.conversations
      .orderBy("updatedAt")
      .reverse()
      .limit(limit)
      .toArray();
  },

  updateConversationTimestamp: async (id: string): Promise<void> => {
    await db.conversations.update(id, { updatedAt: Date.now() });
  },

  updateConversationTitle: async (id: string, title: string): Promise<void> => {
    await db.conversations.update(id, { title });
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
    return await db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
  },

  // Search functionality (for Phase 2)
  searchMessages: async (query: string): Promise<{ conversation: Conversation; message: HistoryMessage }[]> => {
    const messages = await db.messages
      .filter(message => 
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
  convertFromMessage: (message: Message, conversationId: string): Omit<HistoryMessage, 'id'> => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.getTime(),
    model: message.model,
    conversationId,
    isStreaming: message.isStreaming,
  }),
};