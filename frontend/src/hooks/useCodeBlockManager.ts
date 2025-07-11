import { useState, useMemo, useCallback } from "react";

// Regular expression to find all code block fences (```)
const CODE_BLOCK_REGEX = /```/g;

export function useCodeBlockManager(content: string) {
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
  const toggle = useCallback((index: number) => {
    setExpandedState((prev) => {
      const newState = new Map(prev);
      // If a user interacts, we set the state explicitly.
      // A new code block will be collapsed by default (undefined -> false).
      newState.set(index, !prev.get(index));
      return newState;
    });
  }, []);

  // Function to check if a block is expanded. Defaults to false.
  const isExpanded = useCallback(
    (index: number) => {
      return expandedState.get(index) ?? false;
    },
    [expandedState]
  );

  // Function to check if any code block is expanded
  const hasAnyExpanded = useCallback(() => {
    return Array.from(expandedState.values()).some(Boolean);
  }, [expandedState]);

  return {
    codeBlockCount,
    isExpanded,
    toggle,
    hasAnyExpanded,
  };
}
