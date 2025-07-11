Excellent question! I'll help you build a comprehensive TypeScript API service with proper type safety and error handling. This example demonstrates advanced TypeScript features including generics, interfaces, and async programming patterns.

Here's a robust implementation that showcases modern TypeScript best practices:

```typescript
interface ApiResponse<T> {
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
  theme: "light" | "dark" | "auto";
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: "immediate" | "daily" | "weekly";
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "friends";
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
        message: "User retrieved from cache",
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/users/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData: User = await response.json();

      // Cache the user
      this.cache.set(id, userData);

      return {
        data: userData,
        status: response.status,
        message: "User retrieved successfully",
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateUserPreferences(
    userId: number,
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(
        `${this.apiUrl}/users/${userId}/preferences`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser: User = await response.json();

      // Update cache
      this.cache.set(userId, updatedUser);

      return {
        data: updatedUser,
        status: response.status,
        message: "User preferences updated successfully",
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to update user preferences: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async searchUsers(
    query: string,
    filters?: {
      location?: string;
      theme?: UserPreferences["theme"];
      profileVisibility?: PrivacySettings["profileVisibility"];
    }
  ): Promise<ApiResponse<User[]>> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append("q", query);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, value);
          }
        });
      }

      const response = await fetch(
        `${this.apiUrl}/users/search?${searchParams}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const users: User[] = await response.json();

      // Cache all users
      users.forEach((user) => this.cache.set(user.id, user));

      return {
        data: users,
        status: response.status,
        message: `Found ${users.length} users`,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to search users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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
  const userService = new UserService("https://api.example.com");

  try {
    // Fetch a user
    const userResponse = await userService.fetchUser(1);
    console.log("User:", userResponse.data);

    // Update preferences
    const updatedResponse = await userService.updateUserPreferences(1, {
      theme: "dark",
      notifications: {
        email: true,
        push: false,
        sms: false,
        frequency: "daily",
      },
    });
    console.log("Updated user:", updatedResponse.data);

    // Search users
    const searchResponse = await userService.searchUsers("john", {
      location: "New York",
      theme: "dark",
    });
    console.log("Search results:", searchResponse.data);

    console.log("Cache size:", userService.getCacheSize());
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
```

This implementation demonstrates several advanced TypeScript features:

1. **Generic Types**: Using `ApiResponse<T>` for type-safe API responses
2. **Union Types**: `'light' | 'dark' | 'auto'` for strict string literal types
3. **Optional Properties**: Using `?` for optional interface properties
4. **Utility Types**: `Partial<T>` for partial updates and `Record<K, V>` for key-value pairs
5. **Type Guards**: Using `instanceof` for proper error handling
6. **Method Overloading**: Flexible parameter handling with optional types

Here's an additional example showing how to use discriminated unions for better type safety:

```typescript
type ApiResult<T> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; code: number };

class TypeSafeUserService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchUser(id: number): Promise<ApiResult<User>> {
    try {
      const response = await fetch(`${this.apiUrl}/users/${id}`);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.statusText}`,
          code: response.status,
        };
      }

      const userData: User = await response.json();
      return {
        success: true,
        data: userData,
        message: "User retrieved successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: 500,
      };
    }
  }
}

// Usage with type-safe error handling
async function handleUserFetch(service: TypeSafeUserService, id: number) {
  const result = await service.fetchUser(id);

  if (result.success) {
    // TypeScript knows result.data is available
    console.log("User name:", result.data.name);
  } else {
    // TypeScript knows result.error and result.code are available
    console.error(`Error ${result.code}: ${result.error}`);
  }
}
```
