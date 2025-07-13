import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";

interface ResizableSplitterProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  showRightPanel: boolean;
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  onWidthChange?: (leftWidth: number) => void;
}

export function ResizableSplitter({
  leftPanel,
  rightPanel,
  showRightPanel,
  initialLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
  onWidthChange,
}: ResizableSplitterProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const currentWidthRef = useRef(initialLeftWidth);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidthRef.current;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const updatePanelWidths = useCallback((newLeftWidth: number) => {
    // Update state for immediate visual feedback during dragging
    setLeftWidth(newLeftWidth);
    currentWidthRef.current = newLeftWidth;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - startXRef.current;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        const newLeftWidth = Math.max(
          minLeftWidth,
          Math.min(maxLeftWidth, startWidthRef.current + deltaPercent)
        );

        updatePanelWidths(newLeftWidth);
      });
    },
    [minLeftWidth, maxLeftWidth, updatePanelWidths]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Notify parent of final width
    onWidthChange?.(currentWidthRef.current);
  }, [onWidthChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: true,
      });
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Sync currentWidthRef with leftWidth when not dragging
  useEffect(() => {
    if (!isDragging) {
      currentWidthRef.current = leftWidth;
    }
  }, [leftWidth, isDragging]);

  // Calculate effective widths based on showRightPanel
  const effectiveLeftWidth = showRightPanel ? leftWidth : 100;
  const effectiveRightWidth = showRightPanel ? 100 - leftWidth : 0;

  return (
    <motion.div 
      ref={containerRef} 
      className="flex-1 flex relative h-full"
      initial={false}
    >
      {/* Left Panel */}
      <motion.div
        ref={leftPanelRef}
        className="flex flex-col min-w-0 h-full"
        initial={false}
        animate={{ width: `${effectiveLeftWidth}%` }}
        transition={{
          width: isDragging ? { duration: 0 } : { duration: 0.2, ease: "easeOut" },
        }}
      >
        {leftPanel}
      </motion.div>

      {/* Resizable Splitter */}
      <motion.div
        className={`
          relative w-1 bg-surface cursor-col-resize select-none
          hover:bg-surface/80 transition-colors duration-150
          ${isDragging ? "bg-surface/60" : ""}
        `}
        onMouseDown={handleMouseDown}
        initial={false}
        animate={{ 
          opacity: showRightPanel ? 1 : 0,
          width: showRightPanel ? 4 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ pointerEvents: showRightPanel ? 'auto' : 'none' }}
      >
        {/* Hover area for easier grabbing */}
        <div className="absolute inset-y-0 -left-1 -right-1 w-3" />

        {/* Visual indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col gap-1">
            <div className="w-0.5 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="w-0.5 h-1 bg-muted-foreground/40 rounded-full" />
            <div className="w-0.5 h-1 bg-muted-foreground/40 rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* Right Panel */}
      <motion.div
        ref={rightPanelRef}
        className="flex flex-col min-w-0 overflow-hidden h-full"
        initial={false}
        animate={{ width: `${effectiveRightWidth}%` }}
        transition={{
          width: isDragging ? { duration: 0 } : { duration: 0.2, ease: "easeOut" },
        }}
      >
        {showRightPanel && rightPanel}
      </motion.div>
    </motion.div>
  );
}
