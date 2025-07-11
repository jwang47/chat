import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreamingText } from "@/components/chat/StreamingText";
import { renderMarkdown } from "@/lib/markdown";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { StreamingMarkdown } from "../chat/StreamingMarkdown";

// Sample code snippets for different languages
const CODE_SAMPLES = {
  javascript: `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Generate fibonacci sequence
const sequence = [];
for (let i = 0; i < 10; i++) {
    sequence.push(fibonacci(i));
}

console.log('Fibonacci sequence:', sequence);

// Advanced example with promises
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Using the function
fetchData('https://api.example.com/data')
    .then(data => console.log(data))
    .catch(error => console.error('Failed:', error));`,

  python: `import asyncio
import aiohttp
from typing import List, Dict, Optional

class DataProcessor:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_data(self, endpoint: str) -> Dict:
        if not self.session:
            raise RuntimeError("Session not initialized")
        
        url = f"{self.base_url}/{endpoint}"
        async with self.session.get(url) as response:
            response.raise_for_status()
            return await response.json()
    
    async def process_batch(self, endpoints: List[str]) -> List[Dict]:
        tasks = [self.fetch_data(endpoint) for endpoint in endpoints]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                print(f"Error processing: {result}")
                continue
            processed_results.append(result)
        
        return processed_results

# Usage example
async def main():
    endpoints = ['users', 'posts', 'comments', 'tags']
    
    async with DataProcessor('https://api.example.com') as processor:
        results = await processor.process_batch(endpoints)
        
        for i, result in enumerate(results):
            print(f"Result {i + 1}: {len(result)} items")
            
        # Advanced data processing
        combined_data = {}
        for result in results:
            if isinstance(result, dict):
                combined_data.update(result)
        
        print(f"Combined data has {len(combined_data)} keys")

if __name__ == "__main__":
    asyncio.run(main())`,

  rust: `use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Clone)]
struct User {
    id: u64,
    name: String,
    email: String,
    active: bool,
}

#[derive(Debug)]
struct UserManager {
    users: Arc<Mutex<HashMap<u64, User>>>,
    next_id: Arc<Mutex<u64>>,
}

impl UserManager {
    fn new() -> Self {
        Self {
            users: Arc::new(Mutex::new(HashMap::new())),
            next_id: Arc::new(Mutex::new(1)),
        }
    }
    
    fn add_user(&self, name: String, email: String) -> Result<u64, String> {
        let mut users = self.users.lock().map_err(|_| "Failed to lock users")?;
        let mut next_id = self.next_id.lock().map_err(|_| "Failed to lock next_id")?;
        
        let id = *next_id;
        *next_id += 1;
        
        let user = User {
            id,
            name,
            email,
            active: true,
        };
        
        users.insert(id, user);
        Ok(id)
    }
    
    fn get_user(&self, id: u64) -> Result<Option<User>, String> {
        let users = self.users.lock().map_err(|_| "Failed to lock users")?;
        Ok(users.get(&id).cloned())
    }
    
    fn update_user_status(&self, id: u64, active: bool) -> Result<bool, String> {
        let mut users = self.users.lock().map_err(|_| "Failed to lock users")?;
        
        match users.get_mut(&id) {
            Some(user) => {
                user.active = active;
                Ok(true)
            }
            None => Ok(false),
        }
    }
    
    fn list_active_users(&self) -> Result<Vec<User>, String> {
        let users = self.users.lock().map_err(|_| "Failed to lock users")?;
        Ok(users.values()
            .filter(|user| user.active)
            .cloned()
            .collect())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manager = UserManager::new();
    
    // Add some users
    let user1_id = manager.add_user("Alice".to_string(), "alice@example.com".to_string())?;
    let user2_id = manager.add_user("Bob".to_string(), "bob@example.com".to_string())?;
    let user3_id = manager.add_user("Charlie".to_string(), "charlie@example.com".to_string())?;
    
    println!("Added users: {}, {}, {}", user1_id, user2_id, user3_id);
    
    // Simulate some async work
    sleep(Duration::from_millis(100)).await;
    
    // Update user status
    manager.update_user_status(user2_id, false)?;
    
    // List active users
    let active_users = manager.list_active_users()?;
    println!("Active users: {:?}", active_users);
    
    // Concurrent access test
    let manager_clone = Arc::new(manager);
    let mut handles = vec![];
    
    for i in 0..5 {
        let manager_ref = Arc::clone(&manager_clone);
        let handle = tokio::spawn(async move {
            let name = format!("User{}", i + 4);
            let email = format!("user{}@example.com", i + 4);
            
            match manager_ref.add_user(name, email) {
                Ok(id) => println!("Thread {} added user with ID: {}", i, id),
                Err(e) => println!("Thread {} failed to add user: {}", i, e),
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.await?;
    }
    
    let final_users = manager_clone.list_active_users()?;
    println!("Final active users count: {}", final_users.len());
    
    Ok(())
}`,

  typescript: `interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    timestamp: Date;
}

interface User {
    id: number;
    name: string;
    email: string;
    profile: UserProfile;
    preferences: UserPreferences;
}

interface UserProfile {
    avatar: string;
    bio: string;
    location: string;
    website?: string;
    socialLinks: Record<string, string>;
}

interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}

interface NotificationSettings {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
}

interface PrivacySettings {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLocation: boolean;
    allowSearch: boolean;
}

class UserService {
    private apiUrl: string;
    private cache: Map<number, User> = new Map();
    
    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }
    
    async fetchUser(id: number): Promise<ApiResponse<User>> {
        // Check cache first
        const cachedUser = this.cache.get(id);
        if (cachedUser) {
            return {
                data: cachedUser,
                status: 200,
                message: 'User retrieved from cache',
                timestamp: new Date()
            };
        }
        
        try {
            const response = await fetch(\`\${this.apiUrl}/users/\${id}\`);
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const userData: User = await response.json();
            
            // Cache the user
            this.cache.set(id, userData);
            
            return {
                data: userData,
                status: response.status,
                message: 'User retrieved successfully',
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(\`Failed to fetch user: \${error instanceof Error ? error.message : 'Unknown error'}\`);
        }
    }
    
    async updateUserPreferences(
        userId: number, 
        preferences: Partial<UserPreferences>
    ): Promise<ApiResponse<User>> {
        try {
            const response = await fetch(\`\${this.apiUrl}/users/\${userId}/preferences\`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences)
            });
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const updatedUser: User = await response.json();
            
            // Update cache
            this.cache.set(userId, updatedUser);
            
            return {
                data: updatedUser,
                status: response.status,
                message: 'User preferences updated successfully',
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(\`Failed to update user preferences: \${error instanceof Error ? error.message : 'Unknown error'}\`);
        }
    }
    
    async searchUsers(query: string, filters?: {
        location?: string;
        theme?: UserPreferences['theme'];
        profileVisibility?: PrivacySettings['profileVisibility'];
    }): Promise<ApiResponse<User[]>> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('q', query);
            
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value) {
                        searchParams.append(key, value);
                    }
                });
            }
            
            const response = await fetch(\`\${this.apiUrl}/users/search?\${searchParams}\`);
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const users: User[] = await response.json();
            
            // Cache all users
            users.forEach(user => this.cache.set(user.id, user));
            
            return {
                data: users,
                status: response.status,
                message: \`Found \${users.length} users\`,
                timestamp: new Date()
            };
        } catch (error) {
            throw new Error(\`Failed to search users: \${error instanceof Error ? error.message : 'Unknown error'}\`);
        }
    }
    
    clearCache(): void {
        this.cache.clear();
    }
    
    getCacheSize(): number {
        return this.cache.size;
    }
}

// Usage example
async function main() {
    const userService = new UserService('https://api.example.com');
    
    try {
        // Fetch a user
        const userResponse = await userService.fetchUser(1);
        console.log('User:', userResponse.data);
        
        // Update preferences
        const updatedResponse = await userService.updateUserPreferences(1, {
            theme: 'dark',
            notifications: {
                email: true,
                push: false,
                sms: false,
                frequency: 'daily'
            }
        });
        console.log('Updated user:', updatedResponse.data);
        
        // Search users
        const searchResponse = await userService.searchUsers('john', {
            location: 'New York',
            theme: 'dark'
        });
        console.log('Search results:', searchResponse.data);
        
        console.log('Cache size:', userService.getCacheSize());
    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error);`,
};

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const languages = Object.keys(CODE_SAMPLES) as (keyof typeof CODE_SAMPLES)[];

  const startStreaming = () => {
    if (isRunning) return;

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

          const fullCode =
            CODE_SAMPLES[stream.language as keyof typeof CODE_SAMPLES];
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
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Streaming
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
            <p>
              <strong>Status:</strong> {isRunning ? "Streaming" : "Stopped"} |
              <strong> Active Streams:</strong> {streams.length} |
              <strong> Languages:</strong> {languages.join(", ")}
            </p>
            <p className="mt-1">
              This test simulates infinite streaming code blocks that restart
              from the beginning when they reach the end. Use the controls above
              to start/stop streaming, adjust speed, and manage the number of
              concurrent streams.
            </p>
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
