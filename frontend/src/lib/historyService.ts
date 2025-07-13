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
    const defaultTitle = title || new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: defaultTitle,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log("📝 Creating new conversation:", conversation);
    await db.conversations.add(conversation);
    console.log("✅ Conversation created successfully");
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
    console.log("🕒 Updating conversation timestamp for:", id);
    await db.conversations.update(id, { updatedAt: Date.now() });
    console.log("✅ Conversation timestamp updated");
  },

  updateConversationTitle: async (id: string, title: string): Promise<void> => {
    await db.conversations.update(id, { title });
  },

  deleteConversation: async (id: string): Promise<void> => {
    console.log("🗑️ Deleting conversation:", id);
    // Delete all messages for this conversation first
    await db.messages.where("conversationId").equals(id).delete();
    // Then delete the conversation
    await db.conversations.delete(id);
    console.log("✅ Conversation deleted successfully");
  },

  // CRUD for Messages
  addMessage: async (message: Omit<HistoryMessage, "id">): Promise<string> => {
    const messageWithId: HistoryMessage = {
      ...message,
      id: crypto.randomUUID(),
    };
    
    console.log("💬 Adding message to conversation:", message.conversationId, {
      role: message.role,
      contentLength: message.content.length,
      model: message.model
    });
    
    await db.messages.add(messageWithId);
    console.log("✅ Message added successfully:", messageWithId.id);
    
    // Update the conversation's timestamp
    await historyService.updateConversationTimestamp(message.conversationId);
    
    return messageWithId.id;
  },

  getMessagesForConversation: async (
    conversationId: string
  ): Promise<HistoryMessage[]> => {
    console.log("📖 Loading messages for conversation:", conversationId);
    const messages = await db.messages
      .where("conversationId")
      .equals(conversationId)
      .sortBy("timestamp");
    console.log("✅ Loaded", messages.length, "messages");
    return messages;
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