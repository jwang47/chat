export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model: string;
  isStreaming?: boolean;
}

export interface ExpandedCodeBlock {
  messageId: string;
  blockIndex: number;
  language: string;
  code: string;
  filename?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
