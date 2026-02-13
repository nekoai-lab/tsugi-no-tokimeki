// vConsole の型定義
declare module 'vconsole' {
  interface VConsoleOptions {
    theme?: 'light' | 'dark';
    target?: HTMLElement;
    onReady?: () => void;
  }

  export default class VConsole {
    constructor(options?: VConsoleOptions);
    destroy(): void;
    show(): void;
    hide(): void;
    showSwitch(): void;
    hideSwitch(): void;
  }
}

// LIFF グローバル型定義の拡張
interface Window {
  liff?: {
    isInClient?: () => boolean;
    getOS?: () => string;
    getLanguage?: () => string;
    getVersion?: () => string;
    isLoggedIn?: () => boolean;
    getProfile?: () => Promise<{
      userId: string;
      displayName: string;
      pictureUrl?: string;
    }>;
  };
}


