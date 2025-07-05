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
  const [messagePositions, setMessagePositions] = useState<
    Array<{
      id: string;
      top: number;
      height: number;
      role: "user" | "assistant";
    }>
  >([]);

  useEffect(() => {
    if (minimapRef.current) {
      const height = minimapRef.current.clientHeight;
      setMinimapHeight(height);
    }
  }, [messages]);

  // Query actual message positions from DOM
  useEffect(() => {
    const updateMessagePositions = () => {
      const positions: Array<{
        id: string;
        top: number;
        height: number;
        role: "user" | "assistant";
      }> = [];

      messages.forEach((message) => {
        // Find the message element in the DOM
        const messageElement = document.querySelector(
          `[data-message-id="${message.id}"]`
        );
        if (messageElement) {
          const rect = messageElement.getBoundingClientRect();
          const scrollContainer = document.querySelector(
            "[data-radix-scroll-area-viewport]"
          );

          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const relativeTop =
              rect.top - containerRect.top + scrollContainer.scrollTop;

            positions.push({
              id: message.id,
              top: relativeTop,
              height: rect.height,
              role: message.role,
            });
          }
        }
      });

      setMessagePositions(positions);
    };

    // Update positions after a short delay to ensure DOM is ready
    const timer = setTimeout(updateMessagePositions, 100);
    return () => clearTimeout(timer);
  }, [messages]);

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

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

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
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`fixed right-8 top-1/2 -translate-y-1/2 w-12 h-80 bg-card/60 backdrop-blur-sm border border-accent/15 rounded-md overflow-hidden cursor-grab active:cursor-grabbing z-20 hover:bg-card/70 hover:border-accent/25 transition-all duration-50 ${className}`}
      onMouseDown={handleMouseDown}
      ref={minimapRef}
    >
      {/* Message bars based on actual DOM positions */}
      <div className="relative h-full p-1">
        {messagePositions.map((position) => {
          // Convert actual position to minimap position
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
          className={`absolute left-0 right-0 bg-accent/30 border border-accent/70 rounded-sm transition-all duration-100 ${
            isDragging ? "bg-accent/50 border-accent/90" : ""
          }`}
          style={{
            top: `${viewportIndicatorTop}px`,
            height: `${viewportIndicatorHeight}px`,
          }}
        />
      </div>
    </motion.div>
  );
}
