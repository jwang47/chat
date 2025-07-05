import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import type { Message } from "@/types/chat";

interface ChatMinimapProps {
  messages: Message[];
  scrollProgress: number;
  viewportHeight: number;
  contentHeight: number;
  onScrollTo: (position: number) => void;
  className?: string;
}

export function ChatMinimap({
  messages,
  scrollProgress,
  viewportHeight,
  contentHeight,
  onScrollTo,
  className = "",
}: ChatMinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [minimapHeight, setMinimapHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScrollProgress, setDragStartScrollProgress] = useState(0);

  useEffect(() => {
    if (minimapRef.current) {
      const height = minimapRef.current.clientHeight;
      setMinimapHeight(height);
    }
  }, [messages]);

  // Calculate virtual message positions based on estimated heights
  const getVirtualMessagePositions = useCallback(() => {
    const positions: Array<{
      id: string;
      top: number;
      height: number;
      role: "user" | "assistant";
    }> = [];

    let currentTop = 0;
    const baseMessageHeight = 150; // Base estimated height from virtualizer
    const paddingBetweenMessages = 32; // py-4 * 2 = 32px

    messages.forEach((message, index) => {
      // Estimate height based on content length for better accuracy
      let estimatedHeight = baseMessageHeight;

      if (message.content) {
        // Rough estimation: ~80 characters per line, ~24px per line
        const estimatedLines = Math.max(
          1,
          Math.ceil(message.content.length / 80)
        );
        const contentHeight = estimatedLines * 24;
        // Add padding and margins (from ChatMessage component)
        estimatedHeight = Math.max(baseMessageHeight, contentHeight + 96); // 96px for padding/margins
      }

      // For streaming messages, add extra height as they grow
      if (message.isStreaming && message.content) {
        estimatedHeight = Math.max(estimatedHeight, estimatedHeight * 1.2);
      }

      positions.push({
        id: message.id,
        top: currentTop,
        height: estimatedHeight,
        role: message.role,
      });

      currentTop += estimatedHeight + paddingBetweenMessages;
    });

    return positions;
  }, [messages]);

  const messagePositions = getVirtualMessagePositions();

  const handleMinimapInteraction = useCallback(
    (clientY: number) => {
      if (!minimapRef.current) return;

      const rect = minimapRef.current.getBoundingClientRect();
      const clickY = clientY - rect.top;
      const clickProgress = Math.max(0, Math.min(1, clickY / rect.height));

      // Convert to scroll position
      const scrollPosition = clickProgress * (contentHeight - viewportHeight);
      onScrollTo(scrollPosition);
    },
    [contentHeight, viewportHeight, onScrollTo]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      handleMinimapInteraction(e.clientY);
    },
    [handleMinimapInteraction]
  );

  // Handle drag-to-scroll on viewport indicator
  const handleViewportMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingViewport(true);
      setDragStartY(e.clientY);
      setDragStartScrollProgress(scrollProgress);
    },
    [scrollProgress]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isDraggingViewport) {
        handleMinimapInteraction(e.clientY);
      } else if (isDraggingViewport && minimapRef.current) {
        // Calculate drag distance
        const deltaY = e.clientY - dragStartY;
        const rect = minimapRef.current.getBoundingClientRect();

        // Convert drag distance to scroll progress change
        const dragProgress = deltaY / rect.height;
        const newScrollProgress = Math.max(
          0,
          Math.min(1, dragStartScrollProgress + dragProgress)
        );

        // Convert to scroll position
        const scrollPosition =
          newScrollProgress * (contentHeight - viewportHeight);
        onScrollTo(scrollPosition);
      }
    },
    [
      isDragging,
      isDraggingViewport,
      handleMinimapInteraction,
      dragStartY,
      dragStartScrollProgress,
      contentHeight,
      viewportHeight,
      onScrollTo,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingViewport(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging || isDraggingViewport) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, isDraggingViewport, handleMouseMove, handleMouseUp]);

  // Calculate viewport indicator dimensions and position
  const actualMinimapHeight = minimapHeight || 320;
  const padding = 4;
  const availableHeight = actualMinimapHeight - padding * 2;

  // Calculate viewport indicator dimensions
  const viewportRatio =
    contentHeight > 0 ? Math.min(viewportHeight / contentHeight, 1) : 0.1;
  const viewportIndicatorHeight = Math.max(availableHeight * viewportRatio, 8);

  // Calculate the position - ensure it stays within bounds
  const maxScrollTop = availableHeight - viewportIndicatorHeight;
  const viewportIndicatorTop =
    padding + Math.min(scrollProgress * maxScrollTop, maxScrollTop);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 1.0, ease: "easeOut" }}
      className={`fixed right-8 top-1/2 -translate-y-1/2 w-12 h-80 bg-card/60 backdrop-blur-sm border border-accent/15 rounded-md overflow-hidden z-20 hover:bg-card/70 hover:border-accent/25 transition-all duration-500 ${
        isDragging || isDraggingViewport ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      onMouseDown={handleMouseDown}
      ref={minimapRef}
    >
      {/* Message bars based on virtual positions */}
      <div className="relative h-full p-1">
        {messagePositions.map((position) => {
          // Convert virtual position to minimap position
          const minimapTop =
            contentHeight > 0
              ? (position.top / contentHeight) * availableHeight + padding
              : 0;

          const minimapHeight =
            contentHeight > 0
              ? Math.max((position.height / contentHeight) * availableHeight, 2)
              : 2;

          return (
            <div
              key={position.id}
              className={`absolute left-0.5 right-0.5 rounded-sm ${
                isDragging || isDraggingViewport
                  ? "transition-none"
                  : "transition-all duration-300 ease-out"
              } ${
                position.role === "user"
                  ? "bg-accent/60"
                  : "bg-muted-foreground/40"
              }`}
              style={{
                top: `${Math.max(0, minimapTop)}px`,
                height: `${minimapHeight}px`,
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className={`absolute left-0 right-0 bg-accent/30 border border-accent/70 rounded-sm cursor-grab active:cursor-grabbing hover:bg-accent/40 hover:border-accent/80 transition-none ${
            isDragging || isDraggingViewport
              ? "bg-accent/50 border-accent/90"
              : ""
          }`}
          style={{
            top: `${viewportIndicatorTop}px`,
            height: `${viewportIndicatorHeight}px`,
          }}
          onMouseDown={handleViewportMouseDown}
        />
      </div>
    </motion.div>
  );
}
