"use client";

import liff from "@line/liff";
import { updateDebugStatus, debugLog } from '@/app/_components/DebugConsole';

let isInitialized = false;

/**
 * LIFF を初期化する
 */
export async function initializeLiff(): Promise<boolean> {
  debugLog('LIFF', 'initializeLiff called', { isInitialized });
  
  if (isInitialized) {
    debugLog('LIFF', 'Already initialized, skipping');
    // 既に初期化済みの場合も、LIFF内判定を実行
    if (typeof window !== 'undefined' && liff.isInClient()) {
      document.documentElement.classList.add('is-liff');

      // WebViewの表示領域に合わせてbodyの高さを固定
      const setBodyHeight = () => {
        document.body.style.height = `${window.innerHeight}px`;
      };

      window.addEventListener("resize", setBodyHeight);
      setBodyHeight();
    }
    return true;
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

  if (!liffId) {
    console.error("LIFF ID が設定されていません");
    debugLog('LIFF', 'ERROR: LIFF ID not configured');
    updateDebugStatus({ liff: 'error', errorMessage: 'LIFF ID not set' });
    return false;
  }

  try {
    debugLog('LIFF', 'liff.init start', { liffId: liffId.slice(0, 8) + '...' });
    await liff.init({ liffId });
    isInitialized = true;
    console.log("LIFF 初期化成功");
    debugLog('LIFF', 'liff.init SUCCESS');
    
    // LIFF情報をログ出力
    const liffInfo = {
      isInClient: liff.isInClient(),
      isLoggedIn: liff.isLoggedIn(),
      os: liff.getOS?.() ?? 'N/A',
      language: liff.getLanguage?.() ?? 'N/A',
      version: liff.getVersion?.() ?? 'N/A',
    };
    debugLog('LIFF', 'LIFF info', liffInfo);
    console.log('[LIFF] Info:', liffInfo);
    
    updateDebugStatus({ liff: 'ok' });

    // LIFF内判定を行い、is-liffクラスを付与
    if (typeof window !== 'undefined' && liff.isInClient()) {
      document.documentElement.classList.add('is-liff');
      console.log("LIFF内環境を検出: is-liffクラスを付与");
      debugLog('LIFF', 'In LIFF client, added is-liff class');

      // WebViewの表示領域に合わせてbodyの高さを固定
      const setBodyHeight = () => {
        document.body.style.height = `${window.innerHeight}px`;
        debugLog('LIFF', `Set body height: ${window.innerHeight}px`);
      };

      window.addEventListener("resize", setBodyHeight);
      setBodyHeight();
    }

    return true;
  } catch (error) {
    console.error("LIFF 初期化エラー:", error);
    debugLog('LIFF', 'ERROR: liff.init failed', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    updateDebugStatus({ liff: 'error', errorMessage: `LIFF: ${errorMsg.slice(0, 40)}` });
    return false;
  }
}

/**
 * LINE ログインを実行する
 */
export function loginWithLine(): void {
  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

/**
 * LINE ログアウトを実行する
 */
export function logoutFromLine(): void {
  if (liff.isLoggedIn()) {
    liff.logout();
    window.location.reload();
  }
}

/**
 * ログイン済みかどうかを確認する
 */
export function isLineLoggedIn(): boolean {
  return liff.isLoggedIn();
}

/**
 * LINE ユーザープロフィールを取得する
 */
export async function getLineProfile(): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
} | null> {
  if (!liff.isLoggedIn()) {
    return null;
  }

  try {
    const profile = await liff.getProfile();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    };
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    return null;
  }
}

/**
 * LIFF オブジェクトを直接取得する（高度な操作用）
 */
export function getLiff() {
  return liff;
}

