Certainly! I'll help you build a thread-safe user management system in Rust. This example demonstrates several important Rust concepts including ownership, borrowing, concurrency, and error handling.

Here's a comprehensive implementation that showcases modern Rust patterns:

```rust
use std::collections::HashMap;
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
}
```

This implementation demonstrates several key Rust concepts:

1. **Memory Safety**: Using `Arc<Mutex<T>>` for thread-safe shared ownership
2. **Error Handling**: Proper use of `Result<T, E>` types with the `?` operator
3. **Ownership**: Cloning data when needed and using references where possible
4. **Concurrency**: Safe concurrent access using Mutex and async/await
5. **Pattern Matching**: Using `match` expressions for elegant control flow

The `UserManager` struct provides a thread-safe interface for managing users, and the async main function demonstrates how to use it in a concurrent environment. The `Arc<Mutex<T>>` pattern is a common way to share mutable data between threads safely in Rust.

Here's an alternative approach using channels for communication:

```rust
use tokio::sync::mpsc;

#[derive(Debug)]
enum UserCommand {
    Add { name: String, email: String, response: tokio::sync::oneshot::Sender<u64> },
    Get { id: u64, response: tokio::sync::oneshot::Sender<Option<User>> },
    UpdateStatus { id: u64, active: bool, response: tokio::sync::oneshot::Sender<bool> },
}

async fn user_manager_actor(mut receiver: mpsc::Receiver<UserCommand>) {
    let mut users = HashMap::new();
    let mut next_id = 1u64;

    while let Some(command) = receiver.recv().await {
        match command {
            UserCommand::Add { name, email, response } => {
                let user = User { id: next_id, name, email, active: true };
                users.insert(next_id, user);
                let _ = response.send(next_id);
                next_id += 1;
            }
            UserCommand::Get { id, response } => {
                let user = users.get(&id).cloned();
                let _ = response.send(user);
            }
            UserCommand::UpdateStatus { id, active, response } => {
                let updated = users.get_mut(&id).map(|u| { u.active = active; true }).unwrap_or(false);
                let _ = response.send(updated);
            }
        }
    }
}
```
