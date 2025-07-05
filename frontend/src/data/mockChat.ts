import type { Message, ChatSession } from "@/types/chat";

export const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'm working on a React project and I'm having trouble with state management. Can you help me understand when to use useState vs useReducer?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "2",
    content:
      "Let's dive into both!\n\n***\n\n## useState vs useReducer\n\nGreat question! Let me explain the key differences and when to use each.\n\n**useState:**\n- Simple state updates\n- Single values or simple objects\n- Direct state mutations\n- Perfect for local component state\n\n**useReducer:**\n- Complex state logic\n- Multiple related state updates\n- Predictable state transitions\n- Better for complex state management\n\n**When to use useState:**\n- Simple form inputs\n- Toggle states (show/hide)\n- Counter values\n- Single value updates\n\n**When to use useReducer:**\n- Complex forms with multiple fields\n- Shopping cart state\n- Todo lists\n- Any state with multiple actions\n\n**Key difference:** useState is simpler but useReducer gives you more control over state transitions and makes complex state logic more predictable.\n\nWould you like to see some practical examples of each?",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 14), // 14 minutes ago
  },
  {
    id: "3",
    content:
      "Yes, that would be really helpful! Could you show me a useReducer example for a todo app?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 13), // 13 minutes ago
  },
  {
    id: "4",
    content:
      "Absolutely! Here's a complete example of using `useReducer` for a todo app:\n\n```typescript\nimport { useReducer } from 'react';\n\ninterface Todo {\n  id: string;\n  text: string;\n  completed: boolean;\n}\n\ntype Action = \n  | { type: 'ADD_TODO'; payload: string }\n  | { type: 'TOGGLE_TODO'; payload: string }\n  | { type: 'DELETE_TODO'; payload: string };\n\nfunction todoReducer(state: Todo[], action: Action): Todo[] {\n  switch (action.type) {\n    case 'ADD_TODO':\n      return [...state, {\n        id: Date.now().toString(),\n        text: action.payload,\n        completed: false\n      }];\n    case 'TOGGLE_TODO':\n      return state.map(todo => \n        todo.id === action.payload \n          ? { ...todo, completed: !todo.completed }\n          : todo\n      );\n    case 'DELETE_TODO':\n      return state.filter(todo => todo.id !== action.payload);\n    default:\n      return state;\n  }\n}\n\nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  \n  const addTodo = (text: string) => {\n    dispatch({ type: 'ADD_TODO', payload: text });\n  };\n  \n  // ... rest of component\n}\n```\n\nThis approach centralizes all state logic in the reducer, making it easier to test and reason about!",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 minutes ago
  },
  {
    id: "5",
    content:
      "This is perfect! I can see how the reducer pattern makes the state updates much more predictable. One more question - when should I consider using a state management library like Redux or Zustand instead of built-in React hooks?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: "6",
    content:
      "Excellent follow-up question! Here's when you might want to reach for external state management:\n\n**Consider external libraries when:**\n\n1. **Global state needs** - Multiple components across different parts of your app need the same state\n2. **Complex state sharing** - Prop drilling becomes painful (passing props through 3+ levels)\n3. **State persistence** - You need to persist state across page refreshes\n4. **Time-travel debugging** - Redux DevTools for debugging complex state changes\n5. **Team collaboration** - Standardized patterns help larger teams\n\n**Library recommendations:**\n\n- **Zustand** - Lightweight, simple API, great for most apps\n- **Redux Toolkit** - Powerful, lots of tooling, good for complex apps\n- **Jotai** - Atomic approach, good for granular state management\n- **Valtio** - Proxy-based, very intuitive API\n\n**Start simple:** Begin with React's built-in hooks and only add external libraries when you feel the pain points. Many apps never need external state management!\n\nWhat kind of app are you building? That might help determine the best approach.",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
  },
  {
    id: "7",
    content:
      "I'm building a dashboard with multiple widgets that need to share user preferences and real-time data. Sounds like Zustand might be a good fit?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },
  {
    id: "8",
    content:
      "Yes, Zustand would be perfect for your dashboard! Here's why it's ideal for your use case:\n\n**Perfect for dashboards because:**\n- Lightweight and fast\n- Easy to share state between widgets\n- Great TypeScript support\n- Simple subscription model for real-time updates\n- No boilerplate like Redux\n\n**Quick Zustand example for your dashboard:**\n\n```typescript\nimport { create } from 'zustand'\n\ninterface DashboardState {\n  userPreferences: {\n    theme: 'light' | 'dark'\n    layout: 'grid' | 'list'\n  }\n  realTimeData: any[]\n  updatePreferences: (prefs: Partial<DashboardState['userPreferences']>) => void\n  setRealTimeData: (data: any[]) => void\n}\n\nconst useDashboardStore = create<DashboardState>((set) => ({\n  userPreferences: {\n    theme: 'light',\n    layout: 'grid'\n  },\n  realTimeData: [],\n  updatePreferences: (prefs) => set((state) => ({\n    userPreferences: { ...state.userPreferences, ...prefs }\n  })),\n  setRealTimeData: (data) => set({ realTimeData: data })\n}))\n```\n\nYour widgets can then easily access and update shared state without prop drilling!",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
  },
];

export const mockChatSession: ChatSession = {
  id: "session-1",
  title: "React State Management Discussion",
  messages: mockMessages,
  createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
};
