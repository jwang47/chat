use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use tauri::{command, State};

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
}

pub struct CredentialStore {
    service_name: String,
}

impl CredentialStore {
    pub fn new(service_name: String) -> Self {
        println!(
            "Creating CredentialStore with service name: {}",
            service_name
        );
        Self { service_name }
    }

    fn get_entry(&self, provider: &str) -> Result<Entry, CredentialError> {
        let username = format!("{}-api-key", provider);
        println!(
            "Creating keyring entry for service: '{}', username: '{}'",
            self.service_name, username
        );

        match Entry::new(&self.service_name, &username) {
            Ok(entry) => {
                println!("Successfully created keyring entry for {}", provider);
                Ok(entry)
            }
            Err(e) => {
                eprintln!("Failed to create keyring entry for {}: {:?}", provider, e);
                eprintln!(
                    "This might be due to keychain access permissions or service name conflicts"
                );
                Err(CredentialError::Keyring(e))
            }
        }
    }

    pub fn get_credential(&self, provider: &str) -> Result<Option<String>, CredentialError> {
        println!("Getting credential for provider: {}", provider);
        let entry = self.get_entry(provider)?;
        match entry.get_password() {
            Ok(password) => {
                println!("Successfully retrieved credential for {}", provider);
                Ok(Some(password))
            }
            Err(KeyringError::NoEntry) => {
                println!("No credential found for {}", provider);
                Ok(None)
            }
            Err(e) => {
                eprintln!("Error retrieving credential for {}: {:?}", provider, e);
                Err(CredentialError::Keyring(e))
            }
        }
    }

    pub fn set_credential(&self, provider: &str, value: &str) -> Result<(), CredentialError> {
        println!("Setting credential for provider: {}", provider);
        let entry = self.get_entry(provider)?;
        match entry.set_password(value) {
            Ok(_) => {
                println!("Successfully set credential for {}", provider);
                Ok(())
            }
            Err(e) => {
                eprintln!("Failed to set credential for {}: {:?}", provider, e);
                eprintln!(
                    "This might be due to keychain access permissions or system keyring issues"
                );
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
    println!("Testing keychain access...");

    // Test creating an entry
    let test_provider = "test-provider";
    let test_value = "test-value";

    match store.set_credential(test_provider, test_value) {
        Ok(_) => {
            println!("Successfully created test entry");

            // Test reading it back
            match store.get_credential(test_provider) {
                Ok(Some(value)) if value == test_value => {
                    println!("Successfully read back test entry");

                    // Clean up
                    let _ = store.remove_credential(test_provider);
                    Ok("Keychain access test passed".to_string())
                }
                Ok(Some(value)) => {
                    let _ = store.remove_credential(test_provider);
                    Err(format!(
                        "Value mismatch: expected '{}', got '{}'",
                        test_value, value
                    ))
                }
                Ok(None) => {
                    let _ = store.remove_credential(test_provider);
                    Err("Could not read back test entry".to_string())
                }
                Err(e) => {
                    let _ = store.remove_credential(test_provider);
                    Err(format!("Error reading test entry: {}", e))
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to create test entry: {}", e);
            Err(format!("Keychain access test failed: {}", e))
        }
    }
}
