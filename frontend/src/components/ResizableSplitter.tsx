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
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = leftWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [leftWidth]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      const newLeftWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, startWidthRef.current + deltaPercent)
      );

      setLeftWidth(newLeftWidth);
      onWidthChange?.(newLeftWidth);
    },
    [isDragging, minLeftWidth, maxLeftWidth, onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

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

  if (!showRightPanel) {
    return <div className="flex-1 flex flex-col min-w-0">{leftPanel}</div>;
  }

  return (
    <div ref={containerRef} className="flex-1 flex relative">
      {/* Left Panel */}
      <motion.div
        style={{ width: `${leftWidth}%` }}
        className="flex flex-col min-w-0"
        transition={{
          width: isDragging
            ? { duration: 0 }
            : { duration: 0.2, ease: "easeOut" },
        }}
      >
        {leftPanel}
      </motion.div>

      {/* Resizable Splitter */}
      <div
        className={`
          relative w-1 bg-border/30 cursor-col-resize select-none
          hover:bg-border/50 transition-colors duration-150
          ${isDragging ? "bg-border/70" : ""}
        `}
        onMouseDown={handleMouseDown}
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
      </div>

      {/* Right Panel */}
      <motion.div
        style={{ width: `${100 - leftWidth}%` }}
        className="flex flex-col min-w-0"
        transition={{
          width: isDragging
            ? { duration: 0 }
            : { duration: 0.2, ease: "easeOut" },
        }}
      >
        {rightPanel}
      </motion.div>
    </div>
  );
}
