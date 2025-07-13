import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DevControlsProps {
  // State getters
  isTyping: boolean;
  isThinking: boolean;
  streamingMessageId: string | null;
  messages: any[];
  
  // State setters
  setIsTyping: (value: boolean) => void;
  setIsThinking: (value: boolean) => void;
  setStreamingMessageId: (value: string | null) => void;
  setMessages: (value: any[] | ((prev: any[]) => any[])) => void;
  
  // Actions
  onAddMessage?: (role: 'user' | 'assistant', content: string) => void;
  onStartStreaming?: (content: string) => void;
  onClearMessages?: () => void;
}

export function DevControls({
  isTyping,
  isThinking,
  streamingMessageId,
  messages,
  setIsTyping,
  setIsThinking,
  setStreamingMessageId,
  setMessages: _setMessages,
  onAddMessage,
  onStartStreaming: _onStartStreaming,
  onClearMessages
}: DevControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessageRole, setNewMessageRole] = useState<'user' | 'assistant'>('assistant');
  const [newMessageContent, setNewMessageContent] = useState('');

  // Sample messages for quick testing
  const sampleMessages = [
    'Here is a simple Python function:\n\n```python\ndef greet(name):\n    return f"Hello, {name}!"\n\nresult = greet("World")\nprint(result)\n```\n\nThis function takes a name parameter.',
    'Let me explain React hooks:\n\n```javascript\nimport { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```',
    'This is a short message to test spacing.',
    'Here\'s a **long message** with *markdown*.\n\n- Point one\n- Point two\n- Point three\n\nAnd some `inline code`.',
  ];

  const generateMessageId = () => `dev-msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const addMessage = () => {
    if (!newMessageContent.trim() || !onAddMessage) return;
    onAddMessage(newMessageRole, newMessageContent);
    setNewMessageContent('');
  };

  const handleStreamingToggle = () => {
    if (streamingMessageId) {
      // Stop streaming
      setStreamingMessageId(null);
      setIsTyping(false);
      setIsThinking(false);
    } else {
      // Start fake streaming
      const newId = generateMessageId();
      setStreamingMessageId(newId);
      setIsThinking(true);
      
      // Simulate thinking -> typing transition
      setTimeout(() => {
        setIsThinking(false);
        setIsTyping(true);
      }, 2000);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="bg-background border-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Settings className="w-4 h-4 mr-2" />
          Dev Controls
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-background border-2 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="font-semibold text-sm">Dev Controls</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
          {/* State Controls */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">States</h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <Label htmlFor="dev-typing">isTyping</Label>
                <Checkbox 
                  id="dev-typing"
                  checked={isTyping} 
                  onCheckedChange={(checked) => setIsTyping(checked === true)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="dev-thinking">isThinking</Label>
                <Checkbox 
                  id="dev-thinking"
                  checked={isThinking} 
                  onCheckedChange={(checked) => setIsThinking(checked === true)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dev-streaming-id" className="text-xs">streamingMessageId</Label>
                <Input 
                  id="dev-streaming-id"
                  value={streamingMessageId || ''} 
                  onChange={(e) => setStreamingMessageId(e.target.value || null)}
                  placeholder="null"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleStreamingToggle}
                variant="outline"
                size="sm"
                className="text-xs h-7"
              >
                {streamingMessageId ? 'Stop Stream' : 'Start Stream'}
              </Button>
              <Button
                onClick={onClearMessages}
                variant="outline"
                size="sm"
                className="text-xs h-7"
              >
                Clear Messages
              </Button>
            </div>
          </div>

          {/* Add Message */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Add Message</h3>
            <div className="space-y-2">
              <Select value={newMessageRole} onValueChange={(value: 'user' | 'assistant') => setNewMessageRole(value)}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
              
              <textarea 
                className="w-full p-2 border rounded text-xs min-h-[60px] bg-background resize-none"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Message content..."
              />
              
              <Button onClick={addMessage} size="sm" className="w-full text-xs h-7">
                Add Message
              </Button>

              {/* Quick samples */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quick Samples:</Label>
                <div className="grid grid-cols-1 gap-1">
                  {sampleMessages.map((sample, index) => (
                    <Button 
                      key={index}
                      variant="ghost" 
                      size="sm"
                      onClick={() => setNewMessageContent(sample)}
                      className="text-left justify-start text-xs h-6 px-2 truncate"
                    >
                      Sample {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="space-y-1 p-2 bg-muted/50 rounded text-xs">
            <div className="font-medium">Debug Info:</div>
            <div>Messages: {messages.length}</div>
            <div>isTyping: {isTyping.toString()}</div>
            <div>isThinking: {isThinking.toString()}</div>
            <div>streamingId: {streamingMessageId || 'null'}</div>
          </div>
        </div>
      )}
    </div>
  );
}