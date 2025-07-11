import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { StreamingMarkdown } from "../chat/StreamingMarkdown";

// Sample files to load
const SAMPLE_FILES = ["javascript.md", "typescript.md", "python.md", "rust.md"];

interface StreamingState {
  content: string;
  isStreaming: boolean;
  language: string;
  currentIndex: number;
}

export function StreamingCodeTest() {
  const [streams, setStreams] = useState<StreamingState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(50); // ms between characters
  const [maxStreams, setMaxStreams] = useState(3);
  const [codeSamples, setCodeSamples] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load sample files
  useEffect(() => {
    const loadSamples = async () => {
      try {
        setIsLoading(true);
        const samples: Record<string, string> = {};

        for (const fileName of SAMPLE_FILES) {
          try {
            const response = await fetch(`/src/data/samples/${fileName}`);
            if (response.ok) {
              const content = await response.text();
              const language = fileName.replace(".md", "");
              samples[language] = content;
            } else {
              console.warn(`Failed to load ${fileName}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Error loading ${fileName}:`, error);
          }
        }

        if (Object.keys(samples).length === 0) {
          throw new Error("No sample files could be loaded");
        }

        setCodeSamples(samples);
        setLoadError(null);
      } catch (error) {
        console.error("Error loading samples:", error);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load samples"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSamples();
  }, []);

  const languages = Object.keys(codeSamples);

  const startStreaming = () => {
    if (isRunning || languages.length === 0) return;

    setIsRunning(true);

    // Initialize streams
    const initialStreams: StreamingState[] = [];
    for (let i = 0; i < maxStreams; i++) {
      const language = languages[i % languages.length];
      initialStreams.push({
        content: "",
        isStreaming: true,
        language,
        currentIndex: 0,
      });
    }
    setStreams(initialStreams);

    // Start streaming interval
    intervalRef.current = setInterval(() => {
      setStreams((prevStreams) =>
        prevStreams.map((stream) => {
          if (!stream.isStreaming) return stream;

          const fullCode = codeSamples[stream.language];
          if (!fullCode) return stream;

          const nextIndex = stream.currentIndex + 1;

          if (nextIndex >= fullCode.length) {
            // Restart from beginning for infinite streaming
            return {
              ...stream,
              content: fullCode.substring(0, 1),
              currentIndex: 1,
            };
          }

          return {
            ...stream,
            content: fullCode.substring(0, nextIndex),
            currentIndex: nextIndex,
          };
        })
      );
    }, streamSpeed);
  };

  const stopStreaming = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop streaming state
    setStreams((prevStreams) =>
      prevStreams.map((stream) => ({
        ...stream,
        isStreaming: false,
      }))
    );
  };

  const resetStreams = () => {
    stopStreaming();
    setStreams([]);
  };

  const addStream = () => {
    if (streams.length >= 10) return; // Limit to 10 streams

    const newLanguage = languages[streams.length % languages.length];
    const newStream: StreamingState = {
      content: "",
      isStreaming: isRunning,
      language: newLanguage,
      currentIndex: 0,
    };

    setStreams((prev) => [...prev, newStream]);
  };

  const removeStream = (index: number) => {
    setStreams((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Infinite Streaming Code Block Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex gap-2">
              <Button
                onClick={startStreaming}
                disabled={isRunning || isLoading || languages.length === 0}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isLoading ? "Loading..." : "Start Streaming"}
              </Button>
              <Button
                onClick={stopStreaming}
                disabled={!isRunning}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Stop Streaming
              </Button>
              <Button
                onClick={resetStreams}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Speed (ms):</label>
              <input
                type="range"
                min="10"
                max="200"
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {streamSpeed}ms
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Max Streams:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxStreams}
                onChange={(e) => setMaxStreams(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border rounded"
              />
            </div>

            <Button
              onClick={addStream}
              variant="outline"
              size="sm"
              disabled={streams.length >= 10}
            >
              Add Stream
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {loadError ? (
              <p className="text-red-500">
                <strong>Error:</strong> {loadError}
              </p>
            ) : (
              <>
                <p>
                  <strong>Status:</strong>{" "}
                  {isLoading
                    ? "Loading samples..."
                    : isRunning
                    ? "Streaming"
                    : "Stopped"}{" "}
                  |<strong> Active Streams:</strong> {streams.length} |
                  <strong> Languages:</strong>{" "}
                  {languages.join(", ") || "None loaded"}
                </p>
                <p className="mt-1">
                  This test simulates infinite streaming code blocks that
                  restart from the beginning when they reach the end. Use the
                  controls above to start/stop streaming, adjust speed, and
                  manage the number of concurrent streams.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {streams.map((stream, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Stream {index + 1} - {stream.language}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {stream.content.length} chars |{" "}
                      {stream.content.split("\n").length} lines
                    </span>
                    {stream.isStreaming && (
                      <span className="text-green-500 animate-pulse">
                        ● Streaming
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => removeStream(index)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="text-sm">
                  <StreamingMarkdown
                    key={`stream-${index}`}
                    content={
                      stream.content
                        ? `\`\`\`${stream.language}\n${stream.content}\n\`\`\``
                        : ""
                    }
                    className="foobar"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              <p className="text-lg mb-2">No streams active</p>
              <p>
                Click "Start Streaming" to begin testing infinite streaming code
                blocks
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
