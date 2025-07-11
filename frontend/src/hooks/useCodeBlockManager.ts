import { useState, useMemo, useCallback } from "react";

// Regular expression to find all code block fences (```)
const CODE_BLOCK_REGEX = /```/g;

export interface CodeBlockManagerOptions {
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalToggle?: (
    messageId: string,
    blockIndex: number,
    payload?: any
  ) => void;
  messageId?: string;
}

export function useCodeBlockManager(
  content: string,
  options?: CodeBlockManagerOptions
) {
  // Use a Map to store the expansion state of each code block by its index.
  const [expandedState, setExpandedState] = useState<Map<number, boolean>>(
    new Map()
  );

  // Memoize the number of code blocks to avoid re-calculating on every render.
  // This is a cheap way to know if we need to update our state map.
  const codeBlockCount = useMemo(() => {
    const matches = content.match(CODE_BLOCK_REGEX);
    // Each pair of ``` defines one block.
    return matches ? Math.floor(matches.length / 2) : 0;
  }, [content]);

  // Callback to toggle the expanded state of a specific code block.
  const toggle = useCallback(
    (index: number, payload?: any) => {
      if (options?.onGlobalToggle && options?.messageId) {
        // Use global state management
        options.onGlobalToggle(options.messageId, index, payload);
      } else {
        // Use local state management (fallback)
        setExpandedState((prev) => {
          const newState = new Map(prev);
          // If a user interacts, we set the state explicitly.
          // A new code block will be collapsed by default (undefined -> false).
          newState.set(index, !prev.get(index));
          return newState;
        });
      }
    },
    [options]
  );

  // Function to check if a block is expanded. Defaults to false.
  const isExpanded = useCallback(
    (index: number) => {
      if (options?.globalExpandedState && options?.messageId) {
        // Use global state
        return (
          options.globalExpandedState.messageId === options.messageId &&
          options.globalExpandedState.blockIndex === index
        );
      } else {
        // Use local state (fallback)
        return expandedState.get(index) ?? false;
      }
    },
    [expandedState, options]
  );

  // Function to check if any code block is expanded
  const hasAnyExpanded = useCallback(() => {
    if (options?.globalExpandedState) {
      // Use global state
      return options.globalExpandedState.messageId === options.messageId;
    } else {
      // Use local state (fallback)
      return Array.from(expandedState.values()).some(Boolean);
    }
  }, [expandedState, options]);

  return {
    codeBlockCount,
    isExpanded,
    toggle,
    hasAnyExpanded,
  };
}
