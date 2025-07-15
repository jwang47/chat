use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use tauri::{command, State};

// Credential storage using keyring-rs
// 
// Important requirements for macOS/iOS (from keyring-rs documentation):
// - Service names and usernames cannot be empty (treated as wildcards on lookup)
// - Proper entitlements are required for keychain access
// - The data protection keychain is preferred over the file-based keychain

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeys {
    pub openrouter: Option<String>,
    pub gemini: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum CredentialError {
    #[error("Keyring error: {0}")]
    Keyring(#[from] KeyringError),
    #[error("Provider not found: {0}")]
    ProviderNotFound(String),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Invalid provider name: {0}")]
    InvalidProvider(String),
}

pub struct CredentialStore {
    service_name: String,
}

impl CredentialStore {
    pub fn new(service_name: String) -> Self {
        // Ensure service name is not empty (keyring-rs requirement for macOS/iOS)
        if service_name.is_empty() {
            panic!("Service name cannot be empty on macOS/iOS");
        }

        println!(
            "Creating CredentialStore with service name: {}",
            service_name
        );
        Self { service_name }
    }

    fn get_entry(&self, provider: &str) -> Result<Entry, CredentialError> {
        // Validate provider name is not empty (keyring-rs requirement for macOS/iOS)
        if provider.is_empty() {
            return Err(CredentialError::InvalidProvider(
                "Provider name cannot be empty".to_string(),
            ));
        }

        let username = format!("{}-api-key", provider);
        println!(
            "🔑 Creating keyring entry for service: '{}', username: '{}'",
            self.service_name, username
        );
        println!("   📝 Note: You mentioned seeing 'Chat Safe Storage' in Keychain");
        println!("   📝 Expected service name: '{}'", self.service_name);
        println!("   📝 Expected username: '{}'", username);

        match Entry::new(&self.service_name, &username) {
            Ok(entry) => {
                println!("✅ Successfully created keyring entry for {}", provider);
                Ok(entry)
            }
            Err(e) => {
                eprintln!("❌ Failed to create keyring entry for {}: {:?}", provider, e);
                eprintln!(
                    "   This might be due to keychain access permissions or service name conflicts"
                );
                eprintln!("   Expected service: '{}', username: '{}'", self.service_name, username);
                Err(CredentialError::Keyring(e))
            }
        }
    }

    pub fn get_credential(&self, provider: &str) -> Result<Option<String>, CredentialError> {
        println!("🔍 Getting credential for provider: {}", provider);
        println!("   Service: {}", self.service_name);
        println!("   Username will be: {}-api-key", provider);
        
        let entry = self.get_entry(provider)?;
        println!("✅ Entry created successfully, attempting to get password...");
        
        match entry.get_password() {
            Ok(password) => {
                println!(
                    "✅ Successfully retrieved credential for {} (length: {})",
                    provider,
                    password.len()
                );
                println!("   First 10 chars: {:?}", password.chars().take(10).collect::<String>());
                Ok(Some(password))
            }
            Err(KeyringError::NoEntry) => {
                println!("❌ No credential found for {}", provider);
                println!("   This means the keyring entry does not exist");
                Ok(None)
            }
            Err(e) => {
                eprintln!("❌ Error retrieving credential for {}: {:?}", provider, e);
                eprintln!("   Error details: {}", e);
                eprintln!("   This might be due to keychain access permissions or entitlements");
                
                // Try to provide more specific error information
                eprintln!("   Error type: {:?}", std::mem::discriminant(&e));
                
                Err(CredentialError::Keyring(e))
            }
        }
    }

    pub fn set_credential(&self, provider: &str, value: &str) -> Result<(), CredentialError> {
        println!(
            "💾 Setting credential for provider: {} (value length: {})",
            provider,
            value.len()
        );
        println!("   Service: {}", self.service_name);
        println!("   Username will be: {}-api-key", provider);
        println!("   First 10 chars of value: {:?}", value.chars().take(10).collect::<String>());
        
        let entry = self.get_entry(provider)?;
        println!("✅ Entry created successfully, attempting to set password...");
        
        match entry.set_password(value) {
            Ok(_) => {
                println!("✅ Successfully set credential for {}", provider);

                // Immediately try to read it back as a verification
                println!("🔍 Verifying credential was saved correctly...");
                match entry.get_password() {
                    Ok(retrieved) => {
                        println!("✅ Verification retrieval successful (length: {})", retrieved.len());
                        println!("   First 10 chars retrieved: {:?}", retrieved.chars().take(10).collect::<String>());
                        
                        if retrieved == value {
                            println!("✅ Credential verification successful for {} - values match perfectly", provider);
                        } else {
                            println!(
                                "⚠️ Credential verification failed - value mismatch for {}",
                                provider
                            );
                            println!("   Expected length: {}, got length: {}", value.len(), retrieved.len());
                            println!("   Expected first 10: {:?}", value.chars().take(10).collect::<String>());
                            println!("   Got first 10: {:?}", retrieved.chars().take(10).collect::<String>());
                        }
                    }
                    Err(e) => {
                        println!(
                            "⚠️ Credential verification failed - could not retrieve for {}: {:?}",
                            provider, e
                        );
                        println!("   Error details: {}", e);
                    }
                }

                Ok(())
            }
            Err(e) => {
                eprintln!("❌ Failed to set credential for {}: {:?}", provider, e);
                eprintln!("   Error details: {}", e);
                eprintln!(
                    "   This might be due to keychain access permissions or system keyring issues"
                );
                
                // Provide more specific error information
                eprintln!("   Error type: {:?}", std::mem::discriminant(&e));
                
                Err(CredentialError::Keyring(e))
            }
        }
    }

    pub fn remove_credential(&self, provider: &str) -> Result<(), CredentialError> {
        let entry = self.get_entry(provider)?;
        match entry.delete_credential() {
            Ok(_) => Ok(()),
            Err(KeyringError::NoEntry) => Ok(()), // Already removed
            Err(e) => Err(CredentialError::Keyring(e)),
        }
    }

    pub fn get_all_credentials(&self) -> Result<ApiKeys, CredentialError> {
        Ok(ApiKeys {
            openrouter: self.get_credential("openrouter")?,
            gemini: self.get_credential("gemini")?,
        })
    }

    pub fn clear_all_credentials(&self) -> Result<(), CredentialError> {
        let _ = self.remove_credential("openrouter");
        let _ = self.remove_credential("gemini");
        Ok(())
    }

    pub fn has_credential(&self, provider: &str) -> Result<bool, CredentialError> {
        Ok(self.get_credential(provider)?.is_some())
    }

    pub fn has_any_credential(&self) -> Result<bool, CredentialError> {
        Ok(self.has_credential("openrouter")? || self.has_credential("gemini")?)
    }
}

// Tauri commands
#[command]
pub async fn get_api_key(
    provider: String,
    store: State<'_, CredentialStore>,
) -> Result<Option<String>, String> {
    store.get_credential(&provider).map_err(|e| e.to_string())
}

#[command]
pub async fn set_api_key(
    provider: String,
    value: String,
    store: State<'_, CredentialStore>,
) -> Result<bool, String> {
    println!("Attempting to save API key for provider: {}", provider);

    match store.set_credential(&provider, &value) {
        Ok(_) => {
            println!("Successfully saved API key for provider: {}", provider);
            Ok(true)
        }
        Err(e) => {
            eprintln!("Failed to save API key for provider {}: {}", provider, e);

            // Log more details about the error
            match &e {
                CredentialError::Keyring(keyring_error) => {
                    eprintln!("Keyring error details: {:?}", keyring_error);
                }
                CredentialError::ProviderNotFound(p) => {
                    eprintln!("Provider not found: {}", p);
                }
                CredentialError::Serialization(s) => {
                    eprintln!("Serialization error: {}", s);
                }
                CredentialError::InvalidProvider(p) => {
                    eprintln!("Invalid provider name: {}", p);
                }
            }

            Err(e.to_string())
        }
    }
}

#[command]
pub async fn remove_api_key(
    provider: String,
    store: State<'_, CredentialStore>,
) -> Result<bool, String> {
    store
        .remove_credential(&provider)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_all_api_keys(store: State<'_, CredentialStore>) -> Result<ApiKeys, String> {
    store.get_all_credentials().map_err(|e| e.to_string())
}

#[command]
pub async fn clear_all_api_keys(store: State<'_, CredentialStore>) -> Result<bool, String> {
    store
        .clear_all_credentials()
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn has_api_key(
    provider: String,
    store: State<'_, CredentialStore>,
) -> Result<bool, String> {
    store.has_credential(&provider).map_err(|e| e.to_string())
}

#[command]
pub async fn has_any_api_key(store: State<'_, CredentialStore>) -> Result<bool, String> {
    store.has_any_credential().map_err(|e| e.to_string())
}

#[command]
pub async fn test_keychain_access(store: State<'_, CredentialStore>) -> Result<String, String> {
    println!("🔍 Starting comprehensive keychain access test...");
    println!("Service name: {}", store.service_name);

    // Test creating an entry
    let test_provider = "test-provider";
    let test_value = "test-value";

    println!("📝 Phase 1: Testing credential storage...");
    match store.set_credential(test_provider, test_value) {
        Ok(_) => {
            println!("✅ Phase 1 completed: Credential stored successfully");

            // Add a small delay to ensure keychain sync
            println!("⏳ Waiting 100ms for keychain synchronization...");
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            println!("📖 Phase 2: Testing credential retrieval...");
            
            // Try to get the entry details for debugging
            let entry_result = store.get_entry(test_provider);
            match &entry_result {
                Ok(entry) => {
                    println!("🔑 Entry created successfully for debugging");
                    println!("   Service: {}", store.service_name);
                    println!("   Username: {}-api-key", test_provider);
                    
                    // Try to get password directly from entry
                    println!("🔍 Attempting direct password retrieval from entry...");
                    match entry.get_password() {
                        Ok(password) => {
                            println!("✅ Direct retrieval successful: length = {}", password.len());
                            if password == test_value {
                                println!("✅ Direct retrieval value matches expected");
                            } else {
                                println!("❌ Direct retrieval value mismatch: expected '{}', got '{}'", test_value, password);
                            }
                        }
                        Err(e) => {
                            println!("❌ Direct retrieval failed: {:?}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("❌ Failed to create entry for debugging: {:?}", e);
                }
            }

            // Test reading it back through the normal method
            match store.get_credential(test_provider) {
                Ok(Some(value)) if value == test_value => {
                    println!("✅ Phase 2 completed: Successfully read back test entry");

                    // Clean up
                    println!("🧹 Phase 3: Cleaning up test entry...");
                    match store.remove_credential(test_provider) {
                        Ok(_) => println!("✅ Cleanup successful"),
                        Err(e) => println!("⚠️ Cleanup failed: {}", e),
                    }
                    Ok("🎉 Keychain access test passed - all phases successful".to_string())
                }
                Ok(Some(value)) => {
                    println!("❌ Phase 2 failed: Value mismatch");
                    println!("   Expected: '{}'", test_value);
                    println!("   Got: '{}'", value);
                    println!("   Expected length: {}", test_value.len());
                    println!("   Got length: {}", value.len());
                    
                    let _ = store.remove_credential(test_provider);
                    Err(format!(
                        "Value mismatch: expected '{}' (len={}), got '{}' (len={})",
                        test_value, test_value.len(), value, value.len()
                    ))
                }
                Ok(None) => {
                    println!("❌ Phase 2 failed: Could not read back test entry");
                    println!("🔍 Debugging: Entry exists but returns None");
                    
                    // Additional debugging - try to list what we can find
                    println!("🔍 Attempting to check if credential exists using has_credential...");
                    match store.has_credential(test_provider) {
                        Ok(exists) => println!("   has_credential returned: {}", exists),
                        Err(e) => println!("   has_credential failed: {}", e),
                    }
                    
                    let _ = store.remove_credential(test_provider);
                    Err("Could not read back test entry - entry appears to exist but returns None".to_string())
                }
                Err(e) => {
                    println!("❌ Phase 2 failed: Error reading test entry");
                    println!("   Error: {}", e);
                    println!("   Error type: {:?}", e);
                    
                    let _ = store.remove_credential(test_provider);
                    Err(format!("Error reading test entry: {}", e))
                }
            }
        }
        Err(e) => {
            println!("❌ Phase 1 failed: Could not create test entry");
            println!("   Error: {}", e);
            println!("   Error type: {:?}", e);
            Err(format!("Keychain access test failed during storage: {}", e))
        }
    }
}
