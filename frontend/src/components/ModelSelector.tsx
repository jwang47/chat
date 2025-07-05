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
          className="text-xs font-mono bg-card border-muted-foreground/20 hover:bg-muted/20 justify-between min-w-[180px] h-8 px-2"
        >
          <span className="truncate">{currentModel.displayName}</span>
          <ChevronsUpDownIcon className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." className="h-8" />
          <CommandList className="max-h-[400px]">
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
                  className="flex items-center gap-2 py-1.5 px-2"
                >
                  <CheckIcon
                    className={cn(
                      "h-3 w-3 shrink-0",
                      selectedModel === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-medium text-sm truncate w-full">
                      {model.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono truncate w-full">
                      {model.id}
                    </span>
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
                  className="flex items-center gap-2 py-1.5 px-2"
                >
                  <CheckIcon
                    className={cn(
                      "h-3 w-3 shrink-0",
                      selectedModel === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-medium text-sm truncate w-full">
                      {model.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono truncate w-full">
                      {model.id}
                    </span>
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
