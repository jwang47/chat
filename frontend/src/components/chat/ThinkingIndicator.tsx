import React from 'react';

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
      <span className="text-sm">Thinking...</span>
    </div>
  );
}