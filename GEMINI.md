# GEMINI.md

Guidelines and best practices for maintaining performance and code quality in this bun + React + Vite + TypeScript project.

## Performance Principles

### 1. Avoid Unnecessary Re-Renders

- Be Mindful of Context Consumers: Our `ChatContext` provides a single object value. This means any component using `useChat()` will re-render whenever _any_ value in the context changes (e.g., when `isTyping` changes, `AppSidebar` re-renders).

  - Recommendation: For better performance, consider splitting the context (`ChatStateContext` and `ChatDispatchContext`) or using a state manager like Zustand that provides selector-based subscriptions to prevent unnecessary re-renders.

- Keep Components Pure: Components that are pure functions of their props are easier to reason about and optimize.

  - Good Examples: `MessageInput`, `CodeBlock`, and most `ui/` components are excellent examples of this.

- Lift State Only When Necessary: While `ChatInterface.tsx` correctly lifts shared chat state to `ChatContext`, it also manages a lot of local UI state (e.g., `expandedCodeBlock`, `leftPanelWidth`).
  - Recommendation: Consider co-locating state with the components that use it. For instance, the logic and state for the resizable panels could be more self-contained.

### 2. Memoization

- Memoize Expensive Computations with `useMemo`: This is crucial for preventing costly calculations on every render.

  - Excellent Use: The `useMemo` in `MarkedRenderer.tsx` to cache the `marked.lexer` tokens is a perfect, high-impact use of this hook. The memoization of the `items` array in `Messages.tsx` is also a great optimization.

- Memoize Callbacks with `useCallback`: Memoize event handlers and functions passed as props to memoized children (`React.memo`) to prevent them from re-rendering.

  - Good Practice: `ChatInterface.tsx` correctly uses `useCallback` for many handlers like `handleSendMessage` and `handleGlobalCodeBlockToggle`.

- Memoize Components with `React.memo`: Wrap components in `React.memo` if they render often with the same props. This is vital for list items.
  - Excellent Use: `ChatMessage.tsx` and `MessageInput.tsx` are correctly wrapped in `React.memo`, which is essential for our chat's performance.
  - Recommendation: Consider wrapping `CodeBlock.tsx` in `React.memo` as well, since it can be part of a re-rendering message.

### 3. Component Design & Refactoring

- Split Large Components: Large components become hard to maintain and optimize.

  - Action Item: `ChatInterface.tsx` is a prime candidate for refactoring. The logic for scroll management, expanded code view, and message sending can be extracted into smaller, focused components or custom hooks.

- Leverage Custom Hooks for Reusable Logic: Extract complex or repeated logic into custom hooks to keep components clean and the logic reusable.
  - Good Example: `useSmoothScroll` and `useCodeBlockManager` are great examples of this pattern.
  - Recommendation: The complex scroll management and state logic in `ChatInterface.tsx` (e.g., `shouldAutoScrollRef`, `handleScroll`) could be extracted into a `useChatScroll()` hook.

### 4. List Rendering

- Optimize List Items: For our chat history, efficient re-renders are key. Using `React.memo` on the `ChatMessage` component is the most important optimization.
- Virtualization: If chat history is expected to grow to thousands of messages, consider using a virtualization library like `react-virtualized` to only render visible items.

## Vite Notes

- Configure module resolution in `vite.config.ts` via `resolve.alias` (we already do this for `@/*`).
- Use `optimizeDeps` and `ssr.noExternal` if needed for 3rd-party dependencies.
- Leverage Vite’s fast HMR and build pipeline.

## TypeScript Practices

- Enable `strict` Mode: The `enableStrictMode` flag in `main.tsx` is currently `false`. It should be `true` during development to catch potential bugs and enforce better type safety.
- Prefer Explicit Types: The codebase does a great job of using explicit types for props and state, as seen in `ChatInterface.tsx` and our shared `types/` directory.
- Avoid `React.FC`: The project correctly avoids `React.FC`, preferring to type props directly. This is the modern, recommended approach.

## Code Hygiene

- Use `const` by default; `let` only for reassignment.
- Enforce style with `eslint` and `prettier`.
- Follow the Rules of Hooks (only call hooks at the top level of React functions).

## Testing

- Use React Testing Library for behavior-focused testing.
- Prefer integration tests that test a feature over isolated unit tests.
- Good Example: The tests for `MarkedRenderer.tsx` correctly focus on the final rendered output (the "what") rather than the internal implementation details of token parsing (the "how").

## Project Structure

Our project follows a clean, feature-oriented structure.

```
src/
├── components/ # Reusable UI components (chat/, ui/, ModelSelector.tsx)
├── pages/      # Top-level views (ChatInterface.tsx, Settings.tsx)
├── contexts/   # React Context providers (ChatContext.tsx)
├── hooks/      # Custom hooks (useSmoothScroll.ts, useCodeBlockManager.ts)
├── lib/        # Core logic, services, and utils (llmService.ts, models.ts)
└── types/      # Shared TypeScript types (chat.ts)
```

Keep components focused.
Keep re-renders intentional.
Keep logic portable.

## Minimal Flat UI Style Guide

### 0. Look & Feel

- Visual style: Minimal, elegant, and aesthetic
- Tone: Quiet UI with clear structure
- Avoid clutter: Prioritize whitespace and consistent spacing
- Separation: Use color contrast and spacing instead of borders
- Interaction: Subtle motion and transitions, no visual noise

---

### 1. Layout & Spacing

- Max width: `960px`
- Grid: 12-column using `grid` or `flex`
- Vertical spacing: `1.25rem` between elements
- Section spacing: `2rem–3rem`
- Component padding: max `1rem`
- Borders: Avoid — use spacing and background contrast

---

### 2. Components

#### Buttons

- Background: `rgb(29, 29, 28)`
- Text: `rgb(255, 255, 227)`
- Hover: `rgb(119, 119, 119)`
- Radius: `6px`
- Padding: `0.5rem 1rem`
- Shadow: None or subtle (`0px 1px 2px rgba(0,0,0,0.1)`)
- Transition: `150ms ease-in-out`

#### Inputs

- Background: `rgb(25, 24, 21)`
- Text: `rgb(247, 247, 247)`
- Placeholder: `rgb(138, 138, 138)`
- Focus: `outline: 1px solid rgb(211, 211, 211)`
- Radius: match buttons (`6px`)
- Padding: `0.5rem`

#### Cards / Panels

- Background: `rgb(33, 33, 33)`
- Padding: `1rem`
- Shadow: Optional subtle (`0px 2px 4px rgba(0,0,0,0.1)`)

---

### 3. Navigation

- Layout: Vertical preferred
- Active item: bold text or left accent bar
- Group labels: `uppercase`, muted color, small text
- Spacing: consistent vertical spacing (`1rem`) between items

---

### 4. Motion

- Duration: `100ms–250ms`
- Easing: `ease-in-out`
- Animate:

  - Button hover/focus
  - Input focus
  - Expand/collapse panels

---

### 5. Accessibility

- Text contrast: Minimum 4.5:1
- ARIA: Use proper `aria-*` labels for interactive elements
- Keyboard: Full navigation support with focus indicators
