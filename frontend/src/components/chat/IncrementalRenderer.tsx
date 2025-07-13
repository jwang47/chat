import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MarkedRenderer } from './MarkedRenderer';

interface IncrementalRendererProps {
  content: string;
  messageId: string;
  isStreaming: boolean;
  globalExpandedState?: {
    messageId: string | null;
    blockIndex: number | null;
  };
  onGlobalCodeBlockToggle?: (
    messageId: string,
    blockIndex: number,
    payload: any
  ) => void;
  wordsPerSecond?: number;
}

export function IncrementalRenderer({
  content,
  messageId,
  isStreaming,
  globalExpandedState,
  onGlobalCodeBlockToggle,
  wordsPerSecond = 8
}: IncrementalRendererProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [visibleWords, setVisibleWords] = useState(0);
  const lastContentRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Split content into words while preserving whitespace
  const words = useMemo(() => {
    return content.split(/(\s+)/);
  }, [content]);

  // Reset when we get a completely new message
  useEffect(() => {
    if (content.length < lastContentRef.current.length) {
      // Content got shorter, probably new message
      setVisibleWords(0);
      setDisplayedContent('');
    }
    lastContentRef.current = content;
  }, [content]);

  // Handle incremental word reveal
  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show all content immediately
      setDisplayedContent(content);
      setVisibleWords(words.length);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const revealNextWord = () => {
      setVisibleWords(prev => {
        const next = prev + 1;
        
        if (next <= words.length) {
          setDisplayedContent(words.slice(0, next).join(''));
          
          // Schedule next word if there are more
          if (next < words.length) {
            timeoutRef.current = setTimeout(revealNextWord, 1000 / wordsPerSecond);
          }
        }
        
        return next;
      });
    };

    // Only start revealing if we have new content to show
    if (visibleWords < words.length) {
      // Small delay before starting to reveal
      timeoutRef.current = setTimeout(revealNextWord, 50);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isStreaming, words, visibleWords, wordsPerSecond]);

  // Use displayed content for rendering to avoid re-parsing on every chunk
  return (
    <div className="relative">
      <MarkedRenderer
        content={displayedContent}
        messageId={messageId}
        isStreaming={false} // Don't let MarkedRenderer handle streaming
        globalExpandedState={globalExpandedState}
        onGlobalCodeBlockToggle={onGlobalCodeBlockToggle}
      />
      {isStreaming && visibleWords < words.length && (
        <span className="animate-pulse opacity-70 ml-1">▊</span>
      )}
    </div>
  );
}