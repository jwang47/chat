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

  useEffect(() => {
    if (minimapRef.current) {
      setMinimapHeight(minimapRef.current.clientHeight);
    }
  }, []);

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
  const viewportRatio = Math.min(viewportHeight / contentHeight, 1);
  const availableHeight = minimapHeight - 8; // Account for padding (4px top + 4px bottom)
  const viewportIndicatorHeight = Math.max(availableHeight * viewportRatio, 8); // Minimum 8px
  const maxIndicatorTop = availableHeight - viewportIndicatorHeight;
  const viewportIndicatorTop = 4 + scrollProgress * maxIndicatorTop; // Add top padding

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`fixed right-4 top-1/2 -translate-y-1/2 w-12 h-80 bg-card/60 backdrop-blur-sm border border-accent/15 rounded-md overflow-hidden cursor-grab active:cursor-grabbing z-20 hover:bg-card/70 hover:border-accent/25 transition-all duration-50 ${className}`}
      onMouseDown={handleMouseDown}
      ref={minimapRef}
    >
      {/* Messages representation */}
      <div className="relative h-full p-1">
        {messages.map((message, index) => {
          const messageHeight = Math.max(
            (message.content.length / 200) * 6, // Reduced height for thinner minimap
            1.5 // Smaller minimum height
          );
          const messageTop = (index / messages.length) * (availableHeight - 2); // Use available height

          return (
            <div
              key={message.id}
              className={`absolute left-0.5 right-0.5 rounded-sm ${
                message.role === "user"
                  ? "bg-accent/60"
                  : "bg-muted-foreground/40"
              }`}
              style={{
                top: `${messageTop + 2}px`, // Add small offset for padding
                height: `${messageHeight}px`,
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className={`absolute left-0 right-0 bg-accent/25 border border-accent/60 rounded-sm transition-all duration-100 ${
            isDragging ? "bg-accent/40 border-accent/80" : ""
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
