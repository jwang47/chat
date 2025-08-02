import { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  className?: string;
  wordsPerSecond?: number; // How fast to reveal words
}

export function StreamingText({ 
  content, 
  isStreaming, 
  className = '',
  wordsPerSecond = 8 
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [visibleWords, setVisibleWords] = useState(0);
  const contentRef = useRef(content);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const words = content.split(/(\s+)/); // Split on whitespace but keep the spaces

  // Update content reference when it changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Handle word-by-word reveal
  useEffect(() => {
    if (!isStreaming) {
      // If not streaming, show all content immediately
      setVisibleWords(words.length);
      setDisplayedContent(content);
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const revealNextWord = () => {
      setVisibleWords(prev => {
        const next = prev + 1;
        const currentWords = contentRef.current.split(/(\s+)/);
        
        if (next <= currentWords.length) {
          setDisplayedContent(currentWords.slice(0, next).join(''));
          
          // Schedule next word if there are more and still streaming
          if (next < currentWords.length) {
            timeoutRef.current = setTimeout(revealNextWord, 1000 / wordsPerSecond);
          }
        }
        
        return next;
      });
    };

    // Start revealing if we have new content
    const currentWords = content.split(/(\s+)/);
    if (visibleWords < currentWords.length) {
      timeoutRef.current = setTimeout(revealNextWord, 1000 / wordsPerSecond);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, isStreaming, wordsPerSecond, visibleWords, words.length]);

  // Reset when content is completely new (new message)
  useEffect(() => {
    if (content.length < displayedContent.length) {
      // Content got shorter, probably new message
      setVisibleWords(0);
      setDisplayedContent('');
    }
  }, [content, displayedContent.length]);

  return (
    <span className={className}>
      {displayedContent}
      {isStreaming && visibleWords < words.length && (
        <span className="animate-pulse opacity-50">|</span>
      )}
    </span>
  );
}