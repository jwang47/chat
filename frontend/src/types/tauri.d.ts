export interface ApiKeys {
  openrouter?: string;
  gemini?: string;
}

export type ApiKeyProvider = keyof ApiKeys;

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (command: string, args?: any) => Promise<any>;
      };
      event: {
        listen: (
          event: string,
          handler: (event: any) => void
        ) => Promise<() => void>;
        emit: (event: string, payload?: any) => Promise<void>;
      };
    };
  }
}

export {};
