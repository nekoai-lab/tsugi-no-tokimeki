"use client";

import { useEffect, useState, useRef } from 'react';

/**
 * デバッグステータスの型
 */
export interface DebugStatus {
  boot: 'pending' | 'ok' | 'error';
  liff: 'pending' | 'ok' | 'error' | 'skipped';
  auth: 'pending' | 'ok' | 'error';
  api: 'pending' | 'ok' | 'error' | 'skipped';
  errorMessage?: string;
}

// グローバルにステータスを公開（他のファイルから更新可能に）
declare global {
  interface Window {
    __debugStatus?: DebugStatus;
    __updateDebugStatus?: (partial: Partial<DebugStatus>) => void;
  }
}

/**
 * DebugConsole コンポーネント
 * - debug=1 のときだけ vConsole を有効化
 * - LINE内（LIFF WebView）でのみ vConsole を表示
 * - 右上に小さなステータス表示
 */
export default function DebugConsole() {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [status, setStatus] = useState<DebugStatus>({
    boot: 'pending',
    liff: 'pending',
    auth: 'pending',
    api: 'pending',
  });
  const vConsoleRef = useRef<unknown>(null);
  const initAttemptedRef = useRef(false);

  // ステータス更新用のグローバル関数を設定
  useEffect(() => {
    // グローバルステータス初期化
    window.__debugStatus = status;
    
    // 更新関数をグローバルに公開
    window.__updateDebugStatus = (partial: Partial<DebugStatus>) => {
      setStatus(prev => {
        const newStatus = { ...prev, ...partial };
        window.__debugStatus = newStatus;
        return newStatus;
      });
    };

    return () => {
      delete window.__updateDebugStatus;
      delete window.__debugStatus;
    };
  }, []);

  // statusが変わった時にグローバルステータスも更新
  useEffect(() => {
    window.__debugStatus = status;
  }, [status]);

  // debug=1 判定 & vConsole初期化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get('debug') === '1';
    const debugOff = params.get('debug') === '0';
    
    // LocalStorageのデバッグフラグを確認
    const STORAGE_KEY = '__tsugi_debug_mode';
    let storedDebug = false;
    try {
      storedDebug = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // localStorage unavailable
    }
    
    // debug=1 の場合はLocalStorageに保存（次回以降も有効）
    if (debugParam) {
      try {
        localStorage.setItem(STORAGE_KEY, '1');
        console.log('[DebugConsole] debug=1 saved to localStorage');
      } catch {
        // localStorage unavailable
      }
    }
    
    // debug=0 の場合はLocalStorageをクリア（デバッグ無効化）
    if (debugOff) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[DebugConsole] debug mode disabled');
      } catch {
        // localStorage unavailable
      }
      return;
    }
    
    // URLパラメータ または LocalStorage でデバッグモード判定
    const shouldEnableDebug = debugParam || storedDebug;

    if (!shouldEnableDebug) {
      console.log('[DebugConsole] debug mode not enabled, skipping');
      return;
    }

    console.log('[DebugConsole] debug mode enabled', { fromUrl: debugParam, fromStorage: storedDebug });
    setIsDebugMode(true);

    // Boot ログ出力
    console.log('=== [DEBUG BOOT] ===');
    console.log('[DEBUG] location.href:', window.location.href);
    console.log('[DEBUG] userAgent:', navigator.userAgent);
    console.log('[DEBUG] timestamp:', new Date().toISOString());

    // ステータス更新
    window.__updateDebugStatus?.({ boot: 'ok' });

    // vConsole を dynamic import で読み込み（SSR回避）
    const initVConsole = async () => {
      try {
        // LIFF SDK がロードされるまで少し待つ
        let attempts = 0;
        const maxAttempts = 20; // 最大2秒待つ
        
        while (!window.liff && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        // isInClient チェック（LINE内のみvConsole表示）
        // ただし、デバッグモードが有効な場合はLINE外でも表示する
        const isInClient = window.liff?.isInClient?.() ?? false;
        console.log('[DEBUG] liff.isInClient():', isInClient);
        console.log('[DEBUG] liff available:', !!window.liff);
        
        if (window.liff) {
          try {
            console.log('[DEBUG] liff.getOS():', window.liff.getOS?.() ?? 'N/A');
            console.log('[DEBUG] liff.getLanguage():', window.liff.getLanguage?.() ?? 'N/A');
            console.log('[DEBUG] liff.getVersion():', window.liff.getVersion?.() ?? 'N/A');
          } catch (e) {
            console.log('[DEBUG] liff info error:', e);
          }
        }

        // vConsole を初期化
        // - LINE内では常に表示
        // - LINE外では force=1 で強制表示可能
        // - LocalStorageでデバッグモードが有効な場合も表示
        const forceParam = params.get('force') === '1';
        const shouldShowVConsole = isInClient || forceParam || storedDebug;
        
        console.log('[DEBUG] shouldShowVConsole:', shouldShowVConsole, '(isInClient:', isInClient, ', force:', forceParam, ', storedDebug:', storedDebug, ')');

        if (shouldShowVConsole) {
          const VConsole = (await import('vconsole')).default;
          vConsoleRef.current = new VConsole({
            theme: 'dark',
            onReady: () => {
              console.log('[DEBUG] vConsole ready');
            },
          });
          console.log('[DEBUG] vConsole initialized');
        } else {
          console.log('[DEBUG] vConsole skipped (not in LINE client, use ?debug=1&force=1 to force)');
        }

      } catch (error) {
        console.error('[DEBUG] vConsole initialization error:', error);
      }
    };

    initVConsole();

    // クリーンアップ
    return () => {
      if (vConsoleRef.current && typeof (vConsoleRef.current as { destroy?: () => void }).destroy === 'function') {
        (vConsoleRef.current as { destroy: () => void }).destroy();
        vConsoleRef.current = null;
      }
    };
  }, []);

  // デバッグモードでない場合は何も表示しない
  if (!isDebugMode) {
    return null;
  }

  // ステータスバッジを生成
  const getStatusBadge = (key: keyof Omit<DebugStatus, 'errorMessage'>, label: string) => {
    const value = status[key];
    let color = '#666';
    let text = 'pending';
    
    switch (value) {
      case 'ok':
        color = '#22c55e';
        text = 'ok';
        break;
      case 'error':
        color = '#ef4444';
        text = 'ERR';
        break;
      case 'skipped':
        color = '#a855f7';
        text = 'skip';
        break;
      case 'pending':
      default:
        color = '#f59e0b';
        text = '...';
        break;
    }

    return (
      <span
        key={key}
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          marginRight: '4px',
          borderRadius: '4px',
          backgroundColor: color,
          color: '#fff',
          fontSize: '9px',
          fontWeight: 'bold',
          fontFamily: 'monospace',
        }}
      >
        {label}:{text}
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '4px',
        right: '4px',
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '4px 8px',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
        {getStatusBadge('boot', 'boot')}
        {getStatusBadge('liff', 'liff')}
        {getStatusBadge('auth', 'auth')}
        {getStatusBadge('api', 'api')}
      </div>
      {status.errorMessage && (
        <div
          style={{
            fontSize: '8px',
            color: '#ef4444',
            fontFamily: 'monospace',
            maxWidth: '200px',
            wordBreak: 'break-all',
            marginTop: '2px',
          }}
        >
          ERR: {status.errorMessage.slice(0, 50)}
        </div>
      )}
    </div>
  );
}

// ヘルパー関数をエクスポート（他のファイルから使用可能）
export function updateDebugStatus(partial: Partial<DebugStatus>): void {
  if (typeof window !== 'undefined' && window.__updateDebugStatus) {
    window.__updateDebugStatus(partial);
  }
  
  // コンソールにもログ出力
  const keys = Object.keys(partial) as (keyof DebugStatus)[];
  keys.forEach(key => {
    const value = partial[key];
    if (key === 'errorMessage' && value) {
      console.error(`[DEBUG STATUS] ${key}: ${value}`);
    } else if (value === 'error') {
      console.error(`[DEBUG STATUS] ${key}: ${value}`);
    } else {
      console.log(`[DEBUG STATUS] ${key}: ${value}`);
    }
  });
}

// 初期ブートログを出力するヘルパー
export function debugLog(category: string, message: string, data?: unknown): void {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== '1') return;

  const timestamp = new Date().toISOString().split('T')[1];
  if (data !== undefined) {
    console.log(`[${timestamp}] [${category}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] [${category}] ${message}`);
  }
}

