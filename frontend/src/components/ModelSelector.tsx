import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getModelsByProvider,
  getDefaultModel,
  type ModelInfo,
} from "@/lib/models";
import { motion, AnimatePresence } from "motion/react";

interface ModelSelectorProps {
  selectedProvider: "openrouter" | "gemini";
  selectedModel: string;
  onModelSelect: (model: ModelInfo) => void;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableModels = getModelsByProvider(selectedProvider);
  const currentModel =
    availableModels.find((m) => m.id === selectedModel) ||
    getDefaultModel(selectedProvider);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs font-mono bg-card border-muted-foreground/20 hover:bg-muted/20"
      >
        {currentModel.displayName}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1"
        >
          ▼
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 left-0 z-30 min-w-[280px]"
          >
            <Card className="p-2 bg-card border-muted-foreground/20 shadow-lg">
              <div className="space-y-1">
                {availableModels.map((model) => (
                  <Button
                    key={model.id}
                    variant={model.id === selectedModel ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onModelSelect(model);
                      setIsOpen(false);
                    }}
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">
                        {model.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {model.id}
                      </span>
                      {model.description && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {model.description}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
