"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
let mainWindow;
// Secure credential storage service
class CredentialStore {
    static async getCredential(provider) {
        try {
            if (!electron_1.safeStorage.isEncryptionAvailable()) {
                throw new Error('Encryption not available on this platform');
            }
            // In a real implementation, you'd store the encrypted data in a file or database
            // For now, we'll use a simple approach with the OS keychain via safeStorage
            const key = this.STORAGE_KEYS[provider];
            // Try to get from app's user data directory
            const userData = electron_1.app.getPath('userData');
            const credentialsPath = path.join(userData, 'credentials.json');
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                if (fs.existsSync(credentialsPath)) {
                    const encrypted = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                    if (encrypted[key]) {
                        const decrypted = electron_1.safeStorage.decryptString(Buffer.from(encrypted[key], 'base64'));
                        return decrypted;
                    }
                }
            }
            catch (error) {
                console.error('Error reading credentials:', error);
            }
            return null;
        }
        catch (error) {
            console.error(`Error getting credential for ${provider}:`, error);
            return null;
        }
    }
    static async setCredential(provider, value) {
        try {
            if (!electron_1.safeStorage.isEncryptionAvailable()) {
                throw new Error('Encryption not available on this platform');
            }
            const key = this.STORAGE_KEYS[provider];
            const userData = electron_1.app.getPath('userData');
            const credentialsPath = path.join(userData, 'credentials.json');
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            // Load existing credentials
            let credentials = {};
            if (fs.existsSync(credentialsPath)) {
                try {
                    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                }
                catch {
                    credentials = {};
                }
            }
            if (value.trim()) {
                // Encrypt and store
                const encrypted = electron_1.safeStorage.encryptString(value.trim());
                credentials[key] = encrypted.toString('base64');
            }
            else {
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
        }
        catch (error) {
            console.error(`Error setting credential for ${provider}:`, error);
            return false;
        }
    }
    static async removeCredential(provider) {
        return this.setCredential(provider, '');
    }
    static async getAllCredentials() {
        const openrouter = await this.getCredential('openrouter');
        const gemini = await this.getCredential('gemini');
        return {
            openrouter: openrouter || undefined,
            gemini: gemini || undefined,
        };
    }
    static async clearAllCredentials() {
        try {
            const userData = electron_1.app.getPath('userData');
            const credentialsPath = path.join(userData, 'credentials.json');
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            if (fs.existsSync(credentialsPath)) {
                fs.unlinkSync(credentialsPath);
            }
            return true;
        }
        catch (error) {
            console.error('Error clearing credentials:', error);
            return false;
        }
    }
}
CredentialStore.STORAGE_KEYS = {
    openrouter: 'openrouter-api-key',
    gemini: 'gemini-api-key',
};
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
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
        mainWindow = null;
    });
}
// App event handlers
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for secure credential storage
electron_1.ipcMain.handle('credentials:get', async (_, provider) => {
    return await CredentialStore.getCredential(provider);
});
electron_1.ipcMain.handle('credentials:set', async (_, provider, value) => {
    return await CredentialStore.setCredential(provider, value);
});
electron_1.ipcMain.handle('credentials:remove', async (_, provider) => {
    return await CredentialStore.removeCredential(provider);
});
electron_1.ipcMain.handle('credentials:getAll', async () => {
    return await CredentialStore.getAllCredentials();
});
electron_1.ipcMain.handle('credentials:clear', async () => {
    return await CredentialStore.clearAllCredentials();
});
electron_1.ipcMain.handle('credentials:hasAny', async () => {
    const credentials = await CredentialStore.getAllCredentials();
    return !!(credentials.openrouter || credentials.gemini);
});
electron_1.ipcMain.handle('credentials:has', async (_, provider) => {
    const credential = await CredentialStore.getCredential(provider);
    return !!credential;
});
