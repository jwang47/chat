import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import { CodeBlock } from "../components/chat/CodeBlock";
import { StreamingText } from "../components/chat/StreamingText";
import { ThinkingIndicator } from "../components/chat/ThinkingIndicator";
import { ModelSelector } from "../components/ModelSelector";
import { Blockquote, Text, Heading, Code, Strong, Em, Link } from "@radix-ui/themes";

export default function ComponentShowcase() {
  const [inputValue, setInputValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [selectValue, setSelectValue] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [streamingDemo, setStreamingDemo] = useState(false);

  const sampleCode = `function hello() {
  console.log("Hello, world!");
  return "Component showcase";
}`;

  const ComponentSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Component Showcase</h1>
          <p className="text-muted-foreground">
            A comprehensive display of all UI components in the chat application
          </p>
        </div>

        <ComponentSection title="Form & Input Components">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-input">Input Example</Label>
              <Input
                id="demo-input"
                placeholder="Type something..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Select Example</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="demo-checkbox"
              checked={checkboxChecked}
              onCheckedChange={(checked) => setCheckboxChecked(checked === true)}
            />
            <Label htmlFor="demo-checkbox">Example checkbox</Label>
          </div>
        </ComponentSection>

        <ComponentSection title="Button Variants">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </ComponentSection>

        <ComponentSection title="Display Components">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Avatar</p>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Skeleton Loading</p>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Blockquote</p>
              <Blockquote>
                This is an example blockquote using Radix UI Themes.
              </Blockquote>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection title="Dialog & Overlay Components">
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example Dialog</DialogTitle>
                  <DialogDescription>
                    This is a demonstration dialog component.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Example Sheet</SheetTitle>
                  <SheetDescription>
                    This is a demonstration sheet component.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <p>This is a popover example with some content.</p>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover for Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip example</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </ComponentSection>

        <ComponentSection title="Command Interface">
          <div className="space-y-2">
            <Button onClick={() => setCommandOpen(true)}>
              Open Command Dialog
            </Button>
            <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>New Chat</CommandItem>
                  <CommandItem>Settings</CommandItem>
                  <CommandItem>Component Showcase</CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>
          </div>
        </ComponentSection>

        <ComponentSection title="Chat Components">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Model Selector</p>
              <ModelSelector
                selectedModel="gpt-4"
                onModelSelect={(model) => console.log("Selected:", model)}
              />
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Code Block</p>
              <CodeBlock
                blockIndex={0}
                isExpanded={false}
                onToggleExpand={() => {}}
                language="javascript"
                code={sampleCode}
                filename="example.js"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Thinking Indicator</p>
              <ThinkingIndicator />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Streaming Text</p>
              <Button
                onClick={() => setStreamingDemo(!streamingDemo)}
                className="mb-2"
              >
                {streamingDemo ? "Stop" : "Start"} Streaming Demo
              </Button>
              <StreamingText
                content="This is a demonstration of the streaming text component that reveals words progressively."
                isStreaming={streamingDemo}
                wordsPerSecond={3}
              />
            </div>
          </div>
        </ComponentSection>

        <ComponentSection title="Layout Components">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Separator</p>
              <div className="space-y-2">
                <p>Content above separator</p>
                <Separator />
                <p>Content below separator</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Scroll Area</p>
              <ScrollArea className="h-32 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {Array.from({ length: 20 }, (_, i) => (
                    <p key={i} className="text-sm">
                      Scrollable content item {i + 1}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </ComponentSection>

        <ComponentSection title="Radix UI Themes Components">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Typography</p>
              <div className="space-y-3">
                <div>
                  <Heading size="6">Large Heading (size 6)</Heading>
                  <Heading size="4">Medium Heading (size 4)</Heading>
                  <Heading size="2">Small Heading (size 2)</Heading>
                </div>
                <div>
                  <Text size="4">Large text with <Strong>strong emphasis</Strong></Text>
                </div>
                <div>
                  <Text size="3">
                    Regular text with <Em>italic emphasis</Em> and <Code>inline code</Code>
                  </Text>
                </div>
                <div>
                  <Text size="2" color="gray">
                    Small muted text with a <Link href="#" target="_blank">sample link</Link>
                  </Text>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Text Variants</p>
              <div className="space-y-2">
                <Text weight="light">Light weight text</Text>
                <Text weight="regular">Regular weight text</Text>
                <Text weight="medium">Medium weight text</Text>
                <Text weight="bold">Bold weight text</Text>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Colors & Contrast</p>
              <div className="space-y-2">
                <Text color="blue">Blue colored text</Text>
                <Text color="green">Green colored text</Text>
                <Text color="red">Red colored text</Text>
                <Text color="gray" highContrast>High contrast gray text</Text>
              </div>
            </div>
          </div>
        </ComponentSection>
      </div>
    </TooltipProvider>
  );
}