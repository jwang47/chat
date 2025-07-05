import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getAllModels,
  getModelsByProvider,
  getModelById,
  type ModelInfo,
} from "@/lib/models";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: ModelInfo) => void;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const allModels = getAllModels();
  const currentModel = getModelById(selectedModel) || allModels[0];

  // Group models by provider
  const openRouterModels = getModelsByProvider("openrouter");
  const geminiModels = getModelsByProvider("gemini");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="text-xs font-mono bg-card border-muted-foreground/20 hover:bg-muted/20 justify-between min-w-[200px]"
        >
          {currentModel.id}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>

            <CommandGroup heading="OpenRouter">
              {openRouterModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onModelSelect(model);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center w-full">
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedModel === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col items-start flex-1">
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
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Gemini">
              {geminiModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onModelSelect(model);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex items-center w-full">
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedModel === model.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col items-start flex-1">
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
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
