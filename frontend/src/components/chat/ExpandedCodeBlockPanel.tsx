import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExpandedCodeBlock } from "@/types/chat";

interface ExpandedCodeBlockPanelProps {
  expandedCodeBlock: ExpandedCodeBlock | null;
  onGlobalCodeBlockToggle: (
    messageId: string,
    blockIndex: number,
    payload: { code: string; language: string; filename?: string }
  ) => void;
}

export function ExpandedCodeBlockPanel({
  expandedCodeBlock,
  // onGlobalCodeBlockToggle,
}: ExpandedCodeBlockPanelProps) {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  const handleCopyExpanded = useCallback(
    async (code: string, blockId: string) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedBlockId(blockId);
        setTimeout(() => setCopiedBlockId(null), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    },
    []
  );

  if (!expandedCodeBlock) {
    return null;
  }

  return (
    <motion.div
      key={`${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="border-t border-r border-b border-border/50 rounded-r-lg flex-1 flex flex-col"
    >
      <div className="flex items-center justify-between bg-surface/50 px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            {expandedCodeBlock.filename || expandedCodeBlock.language}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            handleCopyExpanded(
              expandedCodeBlock.code,
              `${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}`
            )
          }
          className="h-6 w-6 p-0"
        >
          {copiedBlockId ===
          `${expandedCodeBlock.messageId}-${expandedCodeBlock.blockIndex}` ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <ScrollArea className="h-full">
        <div className="flex-1 overflow-y-auto h-screen">
          <SyntaxHighlighter
            style={oneDark as React.ComponentProps<typeof SyntaxHighlighter>['style']}
            language={expandedCodeBlock.language}
            PreTag="div"
            className="!m-0 !text-xs !font-mono !bg-surface min-h-screen"
            customStyle={{
              margin: 0,
              padding: "12px",
              overflow: "visible",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              borderRadius: "0px",
            }}
          >
            {expandedCodeBlock.code}
          </SyntaxHighlighter>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
