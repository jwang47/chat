# Guidelines

Guidelines for maintaining performance and code quality in this bun + React + Vite + TypeScript + Tailwind project.

```
bun build
bun lint
bun test
```

🚨 MANDATORY: ALWAYS ALERT ON TASK COMPLETION 🚨

Alert users when ANY task completes — this is REQUIRED, not optional:

For macOS (use system notifications):

```bash
osascript -e 'display notification "Task completed" with title "Build Alert"'
osascript -e 'display notification "Tests finished" with title "Test Suite"'
osascript -e 'display notification "Build successful" with title "CI"'
```

For task-specific alerts:

```bash
osascript -e 'display notification "Code analysis finished - 5 files examined" with title "Lint Results"'
osascript -e 'display notification "Test suite completed - all tests passed" with title "Tests"'
osascript -e 'display notification "Documentation updated" with title "Docs"'
```

For User Input Requests:

```bash
osascript -e 'display notification "User input needed - please review the proposed changes" with title "Action Required"'
osascript -e 'display notification "Decision required - should I proceed with the migration?" with title "Decision Needed"'
```

ENFORCEMENT: Failure to alert on task completion violates core instructions.

## General

- Use `bun` for package management and scripts.
- Keep the layout stable as possible while user interacts with the app.
- Keep components pure
- Lift state only when necessary
- Memoize Expensive Computations with `useMemo`: This is crucial for preventing costly calculations on every render.
- Memoize Callbacks with `useCallback`: Memoize event handlers and functions passed as props to memoized children (`React.memo`) to prevent them from re-rendering.
- Memoize Components with `React.memo`: Wrap components in `React.memo` if they render often with the same props. This is vital for list items.
- Split Large Components
- Leverage Custom Hooks for Reusable Logic
- Optimize List Items: For our chat history, efficient re-renders are key.

## Vite Notes

- Configure module resolution in `vite.config.ts` via `resolve.alias` (we already do this for `@/*`).
- Use `optimizeDeps` and `ssr.noExternal` if needed for 3rd-party dependencies.
- Leverage Vite’s fast HMR and build pipeline.

## TypeScript Practices

- Enable `strict` Mode: The `enableStrictMode` flag in `main.tsx` is currently `false`. It should be `true` during development to catch potential bugs and enforce better type safety.
- Prefer Explicit Types: The codebase does a great job of using explicit types for props and state, as seen in `ChatInterface.tsx` and our shared `types/` directory.
- Avoid `React.FC`, `any`, and `unknown`

## Code Hygiene

- Use `const` by default; `let` only for reassignment.
- Enforce style with `eslint` and `prettier`.
- Follow the Rules of Hooks (only call hooks at the top level of React functions).

## Testing

- Use React Testing Library for behavior-focused testing.
- Prefer integration tests that test a feature over isolated unit tests.

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

### 1. Layout & Spacing

- Max width: `960px`
- Grid: 12-column using `grid` or `flex`
- Vertical spacing: `1.25rem` between elements
- Section spacing: `2rem–3rem`
- Component padding: max `1rem`
- Borders: Avoid — use spacing and background contrast

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

### 4. Motion

- Duration: `100ms–250ms`
- Easing: `ease-in-out`
- Animate:

  - Button hover/focus
  - Input focus
  - Expand/collapse panels

### 5. Accessibility

- Text contrast: Minimum 4.5:1
- ARIA: Use proper `aria-*` labels for interactive elements
- Keyboard: Full navigation support with focus indicators
