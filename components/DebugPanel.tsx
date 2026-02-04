"use client";

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId, auth } from '@/lib/firebase';

/**
 * デバッグパネル - 開発時のみ表示
 * - UID表示
 * - オンボーディングリセットボタン
 */
export default function DebugPanel() {
  const { user } = useApp();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // デバッグモードでない場合は何も表示しない
  const isDebugMode = 
    process.env.NODE_ENV !== 'production' || 
    process.env.NEXT_PUBLIC_DEBUG_MODE === '1';

  if (!isDebugMode) {
    return null;
  }

  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;
  const isAnonymous = currentUser?.isAnonymous;

  // コンソールにも出力
  if (uid) {
    console.log('[DEBUG] current uid:', uid);
    console.log('[DEBUG] isAnonymous:', isAnonymous);
  }

  const handleResetOnboarding = async () => {
    if (!uid) {
      setMessage('❌ UID not found');
      return;
    }

    if (!confirm('オンボーディングをリセットしますか？\nプロフィールが削除されます。')) {
      return;
    }

    setIsResetting(true);
    setMessage(null);

    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
      await deleteDoc(profileRef);
      setMessage('✅ Reset success! Reload the page.');
      console.log('[DEBUG] Profile deleted for uid:', uid);
      
      // 3秒後にリロード
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[DEBUG] Reset failed:', error);
      setMessage(`❌ Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxWidth: '280px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ color: '#888' }}>🔧 Debug</span>
        <span style={{ color: '#666', marginLeft: '8px' }}>{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#888' }}>UID: </span>
            <span style={{ color: '#4ade80' }}>
              {uid ? `${uid.slice(0, 8)}...` : 'null'}
            </span>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Anonymous: </span>
            <span style={{ color: isAnonymous ? '#facc15' : '#4ade80' }}>
              {isAnonymous ? 'true' : 'false'}
            </span>
          </div>

          {uid && (
            <div style={{ marginBottom: '6px', fontSize: '10px', color: '#666', wordBreak: 'break-all' }}>
              Full: {uid}
            </div>
          )}

          <button
            onClick={handleResetOnboarding}
            disabled={isResetting || !uid}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: isResetting ? '#666' : '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isResetting || !uid ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              marginTop: '4px',
            }}
          >
            {isResetting ? 'Resetting...' : '🗑️ Reset Onboarding'}
          </button>

          {message && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px',
                backgroundColor: message.includes('✅') ? '#166534' : '#991b1b',
                borderRadius: '4px',
                fontSize: '10px',
              }}
            >
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


