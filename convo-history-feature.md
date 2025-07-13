## Design Doc: Conversation History

### 1. Overview & Product Goal (PM Hat)

Currently, all chat sessions are ephemeral. Users lose their entire conversation history upon refreshing the page, which is a critical usability gap.

**Goal:** To provide users with a persistent chat history, allowing them to revisit, reference, and continue past conversations. This will transform the application from a single-session tool into a persistent, personal knowledge base.

### 2. User Stories (PM Hat)

**MVP (Phase 1):**

- **US1:** As a user, when I send the first message in a new chat, the conversation is automatically saved so I don't lose my work.
- **US2:** As a user, I want to see a list of my recent conversations in the sidebar, ordered from newest to oldest, so I can quickly find and resume them.
- **US3:** As a user, I can click on a past conversation in the sidebar to load its full message history into the main chat view.
- **US4:** As a user, I can start a new, blank chat at any time, which will then appear at the top of my history list once I send a message.
- **US5:** As a user, I can delete a conversation I no longer need from the history list. _(Added as essential for MVP)_

**Fast Follow (Phase 2):**

- **US6:** As a user, I want to search my conversation history by keywords to find specific information from past chats.
- **US7:** As a user, I can manually rename a conversation from its default timestamp to something more descriptive.
- **US8 (Stretch Goal):** As a user, I would like the system to automatically suggest a concise title for my conversation based on its content (e.g., "React Component Debugging").

### 3. Technical Design (Tech Lead Hat)

#### 3.1. Technology Choice: IndexedDB with `dexie.js`

We will use **IndexedDB** for client-side storage. It is the standard browser API for a client-side database, capable of handling large, structured data efficiently and asynchronously.

To simplify the notoriously verbose IndexedDB API, we will use **`dexie.js`**. It's a lightweight, robust wrapper that provides a modern, promise-based syntax, powerful querying, and simplified schema management.

**Why not `localStorage`?** `localStorage` is a simple key-value store with a small storage limit (typically ~5MB) and a synchronous API, making it unsuitable for storing a potentially large number of messages without blocking the main thread.

#### 3.2. Data Model

We will define two tables (Object Stores) in IndexedDB.

**1. `conversations` table:** Stores metadata for each chat.

| Field       | Type   | Description                                                   | Indexed  |
| :---------- | :----- | :------------------------------------------------------------ | :------- |
| `id`        | string | **Primary Key.** A unique UUID (e.g., `crypto.randomUUID()`). | Yes (PK) |
| `title`     | string | Display name. Initially a formatted timestamp.                | No       |
| `createdAt` | number | Timestamp (ms) of creation. For reference.                    | No       |
| `updatedAt` | number | Timestamp (ms) of the last message. **For sorting.**          | Yes      |

**2. `messages` table:** Stores all messages for all conversations.

| Field            | Type   | Description                                                            | Indexed  |
| :--------------- | :----- | :--------------------------------------------------------------------- | :------- |
| `id`             | string | **Primary Key.** A unique UUID for the message.                        | Yes (PK) |
| `conversationId` | string | **Foreign Key.** Links to `conversations.id`. **Crucial for lookups.** | Yes      |
| `role`           | string | 'user' or 'assistant'.                                                 | No       |
| `content`        | string | The message content (markdown).                                        | No       |
| `timestamp`      | number | Timestamp (ms) when the message was created.                           | No       |
| `model`          | string | The AI model used for the response.                                    | No       |

#### 3.3. Architecture & Data Flow

We'll introduce a new service layer to encapsulate all database logic.

**`src/lib/historyService.ts`**
This module will initialize `dexie.js` and export an API for all database operations.

```typescript
// src/lib/historyService.ts
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
export interface HistoryMessage extends Message {
  conversationId: string;
}

class ChatHistoryDatabase extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<HistoryMessage>;

  constructor() {
    super("ChatHistoryDB");
    this.version(1).stores({
      conversations: "id, &updatedAt", // Primary key 'id', index 'updatedAt'
      messages: "id, conversationId", // Primary key 'id', index 'conversationId'
    });
  }
}

const db = new ChatHistoryDatabase();

// --- Exported API ---

export const historyService = {
  // CRUD for Conversations
  createConversation: async (title: string): Promise<string> => {
    /* ... */
  },
  getRecentConversations: async (limit = 20): Promise<Conversation[]> => {
    /* ... */
  },
  updateConversationTimestamp: async (id: string): Promise<void> => {
    /* ... */
  },
  deleteConversation: async (id: string): Promise<void> => {
    /* ... */
  },

  // CRUD for Messages
  addMessage: async (message: Omit<HistoryMessage, "id">): Promise<string> => {
    /* ... */
  },
  getMessagesForConversation: async (
    conversationId: string
  ): Promise<HistoryMessage[]> => {
    /* ... */
  },
};
```

#### 3.4. State Management & Logic Changes

**`ChatContext.tsx`** will be updated to manage the active conversation.

```typescript
// src/contexts/ChatContext.tsx
interface ChatContextType {
  // ... existing state
  currentConversationId: string | null;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  conversations: Conversation[]; // Add the list of convos
  refreshConversations: () => Promise<void>; // Function to reload the list
  // ... newChat will be modified
}
```

**`useChatLogic.tsx`** will contain the core logic trigger.

The `handleSendMessage` function will be updated:

1.  When a user sends a message, check if `currentConversationId` is `null`.
2.  **If `null` (New Chat):**
    a. Call `historyService.createConversation()` with a default title (e.g., 7/13 12:58PM).
    b. Get the new `conversationId` back.
    c. Update the `currentConversationId` in the `ChatContext`.
    d. Call `historyService.addMessage()` with the user's message and the new `conversationId`.
    e. Trigger a refresh of the conversation list in the sidebar.
3.  **If not `null` (Existing Chat):**
    a. Call `historyService.addMessage()` with the user's message and the existing `currentConversationId`.
    b. Call `historyService.updateConversationTimestamp()` to bump this chat to the top of the recent list.
    c. Trigger a refresh of the conversation list.
4.  The logic for saving the AI's response will follow the same pattern.

#### 3.5. Component-Level Changes

- **`app-sidebar.tsx`:**

  - Will use a new state to hold the list of conversations fetched from `historyService.getRecentConversations()`.
  - Will render a new `<SidebarGroup>` for "History".
  - Each conversation will be a `<SidebarMenuItem>` that, on click, calls `setCurrentConversationId()` and fetches the messages for that chat.
  - The "New Chat" button's `onClick` will now primarily call a function that sets `currentConversationId` to `null` and clears the `messages` array.
  - Will include a small "delete" icon on hover for each history item, which calls `historyService.deleteConversation()` and refreshes the list.

- **`ChatInterface.tsx`:**

  - Will use the `currentConversationId` from context to know which chat is active.
  - Will load messages when the `currentConversationId` changes via a `useEffect` hook.

- **`CommandPalette.tsx` (Phase 2):**
  - We will add a search input.
  - On input change, we will call a new `historyService.searchMessages(query)` function.
  - This function will perform a full-text search on the `messages` table (Dexie supports this).
  - Results will be grouped by conversation and displayed in the `CommandList`.

### 4. Phased Rollout Plan

- **Phase 1 (MVP):**

  1.  Implement `historyService.ts` with `dexie.js`.
  2.  Update `ChatContext` and `useChatLogic` for conversation creation/updating.
  3.  Build the history list UI in `app-sidebar.tsx`, including loading and deletion.
  4.  Hook up message loading in `ChatInterface.tsx`.

  - **Goal:** Deliver core persistence and retrieval.

- **Phase 2 (Fast Follow):**

  1.  Implement full-text search in `historyService.ts`.
  2.  Integrate search functionality into the `CommandPalette`.
  3.  Add the ability to rename a conversation title via an inline edit or a context menu on the sidebar item.

  - **Goal:** Enhance discoverability and organization.

- **Phase 3 (Future):**
  1.  Integrate an API call in `historyService.ts` that sends the first ~4-6 messages of a conversation to a cheap/fast model (like `claude-3-haiku` or `gpt-3.5-turbo`) with a prompt like "Summarize this conversation in 5 words or less."
  2.  Update conversation titles automatically.
  - **Goal:** Add "magic" and reduce user's cognitive load.
