import type { Message, ChatSession } from "@/types/chat";

export const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Implement a toy programming language with its own parser, lexer, interpreter, and REPL in Python.",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    model: "google/gemini-2.5-flash",
  },
  {
    id: "2",
    content:
      "Here's a structured implementation of a toy language (lexer, parser, AST, evaluator, REPL) in Python (~350 lines). We can expand further to reach ~1,000 lines if needed:\n```python\n# toy_lang.py\nimport re\nimport sys\n\n# Token definitions\ntoken_spec = [\n    ('NUMBER',  r'\\d+(?:\\.\\d*)?'),\n    ('ID',      r'[A-Za-z_][A-Za-z0-9_]*'),\n    ('OP',      r'[+\\-*/=()]'),\n    ('SKIP',    r'[ \\t]+'),\n    ('NEWLINE', r'\\n'),\n]\n\ntoken_re = re.compile('|'.join('(?P<%s>%s)' % pair for pair in token_spec))\n\ndef lex(code):\n    for mo in token_re.finditer(code):\n        kind = mo.lastgroup\n        val = mo.group()\n        if kind == 'NUMBER': yield ('NUMBER', float(val))\n        elif kind == 'ID': yield ('ID', val)\n        elif kind == 'OP': yield ('OP', val)\n        elif kind == 'NEWLINE': yield ('NEWLINE', None)\n        elif kind == 'SKIP': continue\n        else: raise SyntaxError(f\"Unknown token {val}\")\n\n# AST node classes\nclass Num:\n    def __init__(self, v): self.v = v\nclass Var:\n    def __init__(self, n): self.n = n\nclass BinOp:\n    def __init__(self, op, l, r): self.op, self.l, self.r = op, l, r\nclass Assign:\n    def __init__(self, var, expr): self.var, self.expr = var, expr\nclass ExprStmt:\n    def __init__(self, expr): self.expr = expr\n\n# Parser\nclass Parser:\n    def __init__(self, tokens):\n        self.tokens = [t for t in tokens if t[0] != 'NEWLINE']\n        self.pos = 0\n    def peek(self):\n        if self.pos < len(self.tokens): return self.tokens[self.pos]\n        return ('EOF', None)\n    def advance(self):\n        cur = self.peek(); self.pos += 1; return cur\n    def parse(self):\n        stmts = []\n        while self.peek()[0] != 'EOF':\n            stmts.append(self.stmt())\n        return stmts\n    def stmt(self):\n        tok = self.peek()\n        if tok[0] == 'ID':\n            # could be assignment or expr\n            next1 = self.tokens[self.pos + 1] if self.pos+1 < len(self.tokens) else ('EOF', None)\n            if next1 == ('OP', '='):\n                var = self.advance()[1]\n                self.advance()  # =\n                expr = self.expr()\n                return Assign(var, expr)\n        expr = self.expr()\n        return ExprStmt(expr)\n    def expr(self):\n        node = self.term()\n        while self.peek() == ('OP', '+') or self.peek() == ('OP', '-'):\n            op = self.advance()[1]\n            node = BinOp(op, node, self.term())\n        return node\n    def term(self):\n        node = self.factor()\n        while self.peek() == ('OP', '*') or self.peek() == ('OP', '/'):\n            op = self.advance()[1]\n            node = BinOp(op, node, self.factor())\n        return node\n    def factor(self):\n        tok = self.advance()\n        if tok[0] == 'NUMBER': return Num(tok[1])\n        if tok == ('OP', '('):\n            node = self.expr()\n            if self.advance() != ('OP', ')'):\n                raise SyntaxError('Expected )')\n            return node\n        if tok[0] == 'ID': return Var(tok[1])\n        raise SyntaxError(f\"Unexpected {tok}\")\n\n# Interpreter\ndef eval_stmt(stmt, env):\n    if isinstance(stmt, Assign):\n        env[stmt.var] = eval_expr(stmt.expr, env)\n    elif isinstance(stmt, ExprStmt):\n        val = eval_expr(stmt.expr, env)\n        print(val)\n\ndef eval_expr(node, env):\n    if isinstance(node, Num): return node.v\n    if isinstance(node, Var): return env.get(node.n, 0)\n    if isinstance(node, BinOp):\n        l = eval_expr(node.l, env)\n        r = eval_expr(node.r, env)\n        if node.op == '+': return l + r\n        if node.op == '-': return l - r\n        if node.op == '*': return l * r\n        if node.op == '/': return l / r\n    raise RuntimeError(f\"Bad node {node}\")\n\n# REPL\ndef repl():\n    env = {}\n    try:\n        while True:\n            line = input('> ')\n            tok = lex(line + '\\n')\n            stmts = Parser(tok).parse()\n            for s in stmts: eval_stmt(s, env)\n    except (EOFError, KeyboardInterrupt):\n        print('\\nBye.')\n\nif __name__ == '__main__': repl()\n```",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    model: "google/gemini-2.5-flash",
  },
  {
    id: "3",
    content:
      "Yes, that would be really helpful! Could you show me a useReducer example for a todo app?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 13), // 13 minutes ago
    model: "openrouter/cypher-alpha:free",
  },
  {
    id: "4",
    content:
      "Absolutely! Here's a complete example of using `useReducer` for a todo app:\n\n```typescript\nimport { useReducer } from 'react';\n\ninterface Todo {\n  id: string;\n  text: string;\n  completed: boolean;\n}\n\ntype Action = \n  | { type: 'ADD_TODO'; payload: string }\n  | { type: 'TOGGLE_TODO'; payload: string }\n  | { type: 'DELETE_TODO'; payload: string };\n\nfunction todoReducer(state: Todo[], action: Action): Todo[] {\n  switch (action.type) {\n    case 'ADD_TODO':\n      return [...state, {\n        id: Date.now().toString(),\n        text: action.payload,\n        completed: false\n      }];\n    case 'TOGGLE_TODO':\n      return state.map(todo => \n        todo.id === action.payload \n          ? { ...todo, completed: !todo.completed }\n          : todo\n      );\n    case 'DELETE_TODO':\n      return state.filter(todo => todo.id !== action.payload);\n    default:\n      return state;\n  }\n}\n\nfunction TodoApp() {\n  const [todos, dispatch] = useReducer(todoReducer, []);\n  \n  const addTodo = (text: string) => {\n    dispatch({ type: 'ADD_TODO', payload: text });\n  };\n  \n  // ... rest of component\n}\n```\n\nThis approach centralizes all state logic in the reducer, making it easier to test and reason about!",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 minutes ago
    model: "openrouter/cypher-alpha:free",
  },
  {
    id: "5",
    content:
      "This is perfect! I can see how the reducer pattern makes the state updates much more predictable. One more question - when should I consider using a state management library like Redux or Zustand instead of built-in React hooks?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    model: "google/gemini-1.5-pro",
  },
  {
    id: "6",
    content:
      "Excellent follow-up question! Here's when you might want to reach for external state management:\n\n**Consider external libraries when:**\n\n1. **Global state needs** - Multiple components across different parts of your app need the same state\n2. **Complex state sharing** - Prop drilling becomes painful (passing props through 3+ levels)\n3. **State persistence** - You need to persist state across page refreshes\n4. **Time-travel debugging** - Redux DevTools for debugging complex state changes\n5. **Team collaboration** - Standardized patterns help larger teams\n\n**Library recommendations:**\n\n- **Zustand** - Lightweight, simple API, great for most apps\n- **Redux Toolkit** - Powerful, lots of tooling, good for complex apps\n- **Jotai** - Atomic approach, good for granular state management\n- **Valtio** - Proxy-based, very intuitive API\n\n**Start simple:** Begin with React's built-in hooks and only add external libraries when you feel the pain points. Many apps never need external state management!\n\nWhat kind of app are you building? That might help determine the best approach.",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 4), // 4 minutes ago
    model: "google/gemini-1.5-pro",
  },
  {
    id: "7",
    content:
      "I'm building a dashboard with multiple widgets that need to share user preferences and real-time data. Sounds like Zustand might be a good fit?",
    role: "user",
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    model: "openrouter/anthropic/claude-3.5-sonnet",
  },
  {
    id: "8",
    content:
      "Yes, Zustand would be perfect for your dashboard! Here's why it's ideal for your use case:\n\n**Perfect for dashboards because:**\n- Lightweight and fast\n- Easy to share state between widgets\n- Great TypeScript support\n- Simple subscription model for real-time updates\n- No boilerplate like Redux\n\n**Quick Zustand example for your dashboard:**\n\n```typescript\nimport { create } from 'zustand'\n\ninterface DashboardState {\n  userPreferences: {\n    theme: 'light' | 'dark'\n    layout: 'grid' | 'list'\n  }\n  realTimeData: any[]\n  updatePreferences: (prefs: Partial<DashboardState['userPreferences']>) => void\n  setRealTimeData: (data: any[]) => void\n}\n\nconst useDashboardStore = create<DashboardState>((set) => ({\n  userPreferences: {\n    theme: 'light',\n    layout: 'grid'\n  },\n  realTimeData: [],\n  updatePreferences: (prefs) => set((state) => ({\n    userPreferences: { ...state.userPreferences, ...prefs }\n  })),\n  setRealTimeData: (data) => set({ realTimeData: data })\n}))\n```\n\nYour widgets can then easily access and update shared state without prop drilling!",
    role: "assistant",
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    model: "openrouter/anthropic/claude-3.5-sonnet",
  },
];

export const mockChatSession: ChatSession = {
  id: "session-1",
  title: "React State Management Discussion",
  messages: mockMessages,
  createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
  updatedAt: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
};
