import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow;

// Secure credential storage service
class CredentialStore {
  private static readonly STORAGE_KEYS = {
    openrouter: 'openrouter-api-key',
    gemini: 'gemini-api-key',
  } as const;

  static async getCredential(provider: keyof typeof this.STORAGE_KEYS): Promise<string | null> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this platform');
      }
      
      // In a real implementation, you'd store the encrypted data in a file or database
      // For now, we'll use a simple approach with the OS keychain via safeStorage
      const key = this.STORAGE_KEYS[provider];
      
      // Try to get from app's user data directory
      const userData = app.getPath('userData');
      const credentialsPath = path.join(userData, 'credentials.json');
      
      try {
        const fs = await import('fs');
        if (fs.existsSync(credentialsPath)) {
          const encrypted = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
          if (encrypted[key]) {
            const decrypted = safeStorage.decryptString(Buffer.from(encrypted[key], 'base64'));
            return decrypted;
          }
        }
      } catch (error) {
        console.error('Error reading credentials:', error);
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting credential for ${provider}:`, error);
      return null;
    }
  }

  static async setCredential(provider: keyof typeof this.STORAGE_KEYS, value: string): Promise<boolean> {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this platform');
      }

      const key = this.STORAGE_KEYS[provider];
      const userData = app.getPath('userData');
      const credentialsPath = path.join(userData, 'credentials.json');
      
      const fs = await import('fs');
      
      // Load existing credentials
      let credentials: Record<string, string> = {};
      if (fs.existsSync(credentialsPath)) {
        try {
          credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        } catch {
          credentials = {};
        }
      }
      
      if (value.trim()) {
        // Encrypt and store
        const encrypted = safeStorage.encryptString(value.trim());
        credentials[key] = encrypted.toString('base64');
      } else {
        // Remove if empty
        delete credentials[key];
      }
      
      // Ensure directory exists
      if (!fs.existsSync(userData)) {
        fs.mkdirSync(userData, { recursive: true });
      }
      
      // Save encrypted credentials
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      return true;
    } catch (error) {
      console.error(`Error setting credential for ${provider}:`, error);
      return false;
    }
  }

  static async removeCredential(provider: keyof typeof this.STORAGE_KEYS): Promise<boolean> {
    return this.setCredential(provider, '');
  }

  static async getAllCredentials(): Promise<Record<string, string | undefined>> {
    const openrouter = await this.getCredential('openrouter');
    const gemini = await this.getCredential('gemini');
    
    return {
      openrouter: openrouter || undefined,
      gemini: gemini || undefined,
    };
  }

  static async clearAllCredentials(): Promise<boolean> {
    try {
      const userData = app.getPath('userData');
      const credentialsPath = path.join(userData, 'credentials.json');
      
      const fs = await import('fs');
      if (fs.existsSync(credentialsPath)) {
        fs.unlinkSync(credentialsPath);
      }
      return true;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    
    // Show immediately in dev mode for debugging
    mainWindow.show();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (!isDev) {
      mainWindow.show();
    }
  });
  
  // Add error handling for load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
    mainWindow.show(); // Show window anyway so user can see the error
  });

  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for secure credential storage
ipcMain.handle('credentials:get', async (_, provider: string) => {
  return await CredentialStore.getCredential(provider as any);
});

ipcMain.handle('credentials:set', async (_, provider: string, value: string) => {
  return await CredentialStore.setCredential(provider as any, value);
});

ipcMain.handle('credentials:remove', async (_, provider: string) => {
  return await CredentialStore.removeCredential(provider as any);
});

ipcMain.handle('credentials:getAll', async () => {
  return await CredentialStore.getAllCredentials();
});

ipcMain.handle('credentials:clear', async () => {
  return await CredentialStore.clearAllCredentials();
});

ipcMain.handle('credentials:hasAny', async () => {
  const credentials = await CredentialStore.getAllCredentials();
  return !!(credentials.openrouter || credentials.gemini);
});

ipcMain.handle('credentials:has', async (_, provider: string) => {
  const credential = await CredentialStore.getCredential(provider as any);
  return !!credential;
});