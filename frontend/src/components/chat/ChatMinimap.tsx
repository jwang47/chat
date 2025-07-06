import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
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

  // Calculate message positions based on estimated heights
  const getMessagePositions = useCallback(() => {
    const positions: Array<{
      id: string;
      top: number;
      height: number;
      role: "user" | "assistant";
    }> = [];

    let currentTop = 0;
    const baseMessageHeight = 80; // Base estimated height for messages
    const paddingBetweenMessages = 32; // py-4 = 16px top + 16px bottom

    messages.forEach((message) => {
      // Estimate height based on content length
      let estimatedHeight = baseMessageHeight;

      if (message.content) {
        // Rough estimation: ~80 characters per line, ~24px per line
        const estimatedLines = Math.max(
          1,
          Math.ceil(message.content.length / 80)
        );
        const contentHeight = estimatedLines * 24;
        // Add padding and margins (from ChatMessage component)
        estimatedHeight = Math.max(baseMessageHeight, contentHeight + 64); // 64px for padding/margins
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

  const messagePositions = getMessagePositions();

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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleMinimapInteraction(e.clientY);
      }
    },
    [isDragging, handleMinimapInteraction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle viewport dragging
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

  const handleViewportMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingViewport || !minimapRef.current) return;

      const rect = minimapRef.current.getBoundingClientRect();
      const deltaY = e.clientY - dragStartY;
      const deltaProgress = deltaY / rect.height;
      const newProgress = Math.max(
        0,
        Math.min(1, dragStartScrollProgress + deltaProgress)
      );

      const scrollPosition = newProgress * (contentHeight - viewportHeight);
      onScrollTo(scrollPosition);
    },
    [
      isDraggingViewport,
      dragStartY,
      dragStartScrollProgress,
      contentHeight,
      viewportHeight,
      onScrollTo,
    ]
  );

  const handleViewportMouseUp = useCallback(() => {
    setIsDraggingViewport(false);
  }, []);

  // Global mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isDraggingViewport) {
      document.addEventListener("mousemove", handleViewportMouseMove);
      document.addEventListener("mouseup", handleViewportMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleViewportMouseMove);
        document.removeEventListener("mouseup", handleViewportMouseUp);
      };
    }
  }, [isDraggingViewport, handleViewportMouseMove, handleViewportMouseUp]);

  // Calculate dimensions
  const padding = 4;
  const availableHeight = minimapHeight - padding * 2;
  const viewportIndicatorHeight = Math.max(
    20,
    (viewportHeight / contentHeight) * availableHeight
  );
  const viewportIndicatorTop =
    scrollProgress * (availableHeight - viewportIndicatorHeight) + padding;

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
      {/* Message bars */}
      <div className="relative h-full p-1">
        {messagePositions.map((position) => {
          // Convert position to minimap position
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
          className={`absolute left-0 right-0 bg-accent/80 rounded-sm border border-accent/40 ${
            isDraggingViewport ? "cursor-grabbing" : "cursor-grab"
          } ${
            isDragging || isDraggingViewport
              ? "transition-none"
              : "transition-all duration-150 ease-out"
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
