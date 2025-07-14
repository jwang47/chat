use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{command, AppHandle, Manager, State};

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
        Self { service_name }
    }

    fn get_entry(&self, provider: &str) -> Result<Entry, CredentialError> {
        let username = format!("{}-api-key", provider);
        Entry::new(&self.service_name, &username).map_err(CredentialError::Keyring)
    }

    pub fn get_credential(&self, provider: &str) -> Result<Option<String>, CredentialError> {
        let entry = self.get_entry(provider)?;
        match entry.get_password() {
            Ok(password) => Ok(Some(password)),
            Err(KeyringError::NoEntry) => Ok(None),
            Err(e) => Err(CredentialError::Keyring(e)),
        }
    }

    pub fn set_credential(&self, provider: &str, value: &str) -> Result<(), CredentialError> {
        let entry = self.get_entry(provider)?;
        entry.set_password(value).map_err(CredentialError::Keyring)
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
    store
        .set_credential(&provider, &value)
        .map(|_| true)
        .map_err(|e| e.to_string())
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
