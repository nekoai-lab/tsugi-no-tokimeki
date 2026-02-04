"use client";

import React, { useState, useEffect, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';

export default function DebugAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  
  // AppContext から取得
  const { user: appUser, userProfile, loading: appLoading } = useApp();

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DebugAuth] ${message}`);
  };

  useEffect(() => {
    addLog('Component mounted');
    addLog(`window.location.hostname: ${window.location.hostname}`);
    addLog(`auth object exists: ${!!auth}`);
    addLog(`auth.app.name: ${auth?.app?.name || 'unknown'}`);
    
    // 既存のリスナーがあれば解除
    if (unsubRef.current) {
      addLog('Cleaning up previous listener');
      unsubRef.current();
    }

    // Auth State Listener (直接)
    addLog('Setting up onAuthStateChanged listener (direct)...');
    unsubRef.current = onAuthStateChanged(
      auth,
      (user) => {
        addLog(`✅ onAuthStateChanged FIRED (direct)! user: ${user ? user.uid.slice(0, 8) + '...' : 'null'}`);
        setAuthUser(user);
      },
      (err) => {
        addLog(`❌ onAuthStateChanged ERROR: ${err.message}`);
        setError(err.message);
      }
    );
    addLog('Listener setup complete');

    return () => {
      addLog('Component unmounting, cleaning up listener');
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  // AppContext の状態変化を監視
  useEffect(() => {
    addLog(`📦 AppContext changed: loading=${appLoading}, user=${appUser?.uid?.slice(0,8) || 'null'}, profile=${userProfile ? 'exists' : 'null'}`);
  }, [appLoading, appUser, userProfile]);

  const handleSignIn = async () => {
    addLog('Attempting signInAnonymously...');
    try {
      const result = await signInAnonymously(auth);
      addLog(`✅ signInAnonymously SUCCESS! uid: ${result.user.uid.slice(0, 8)}...`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`❌ signInAnonymously ERROR: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">🔐 Debug Auth Page</h1>
      
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <h2 className="font-bold mb-2">Direct Auth State:</h2>
        <p>Auth User: {authUser ? `✅ ${authUser.uid.slice(0, 8)}... (anonymous: ${authUser.isAnonymous})` : '❌ null'}</p>
        <p>Error: {error || 'none'}</p>
        <p suppressHydrationWarning>Hostname: {typeof window !== 'undefined' ? window.location.hostname : 'SSR'}</p>
      </div>

      <div className="mb-4 p-4 bg-blue-900 rounded">
        <h2 className="font-bold mb-2">📦 AppContext State:</h2>
        <p>Loading: {appLoading ? '⏳ true' : '✅ false'}</p>
        <p>User: {appUser ? `✅ ${appUser.uid.slice(0, 8)}...` : '❌ null'}</p>
        <p>Profile: {userProfile ? '✅ exists' : '❌ null'}</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Sign In Anonymously
        </button>
        <button
          onClick={handleClearLogs}
          className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-black p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        <h2 className="font-bold mb-2 text-green-400">Logs:</h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">No logs yet...</p>
        ) : (
          logs.map((log, i) => (
            <p key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') || log.includes('FIRED') ? 'text-green-400' : log.includes('AppContext') ? 'text-blue-400' : 'text-gray-300'}>
              {log}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

