"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut, type Unsubscribe } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { auth, db, appId } from '@/lib/firebase';
import { linkLineAccount } from '@/lib/userService';
import { initializeLiff, isLineLoggedIn, getLineProfile } from '@/lib/liff';
import type { UserProfile, Post, StoreEvent, Suggestion, FirebaseUser } from '@/lib/types';
import { updateDebugStatus, debugLog } from '@/app/_components/DebugConsole';

interface AppContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  posts: Post[];
  events: StoreEvent[];
  suggestions: Suggestion | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // モーダル表示中かどうか（ナビ・FAB非表示用）
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  // LINE連携を手動で実行
  linkLine: () => Promise<void>;
  isLinkingLine: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// タイムアウト時間（開発中は20秒）
const AUTH_TIMEOUT_MS = 20000;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkingLine, setIsLinkingLine] = useState(false);
  
  // クロージャ問題を避けるためrefで状態を追跡
  const authReadyRef = useRef(false);
  const lineLinkCheckedRef = useRef(false);
  const authUnsubRef = useRef<Unsubscribe | null>(null);
  const profileUnsubRef = useRef<Unsubscribe | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Initialization - アプリで1回だけ実行
  useEffect(() => {
    // 既にリスナーがあれば何もしない（多重登録防止）
    if (authUnsubRef.current) {
      console.log('🔐 [Auth] Listener already exists, skipping setup');
      debugLog('AUTH', 'Listener already exists, skipping');
      return;
    }
    
    console.log('🔐 [Auth] Setup start');
    debugLog('AUTH', 'Setup start');
    const debugInfo = {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
      authExists: !!auth,
      authAppName: auth?.app?.name || 'unknown',
    };
    console.log('🔐 [Auth] Debug info:', debugInfo);
    debugLog('AUTH', 'Debug info', debugInfo);
    
    // タイムアウト設定（保険）
    timeoutRef.current = setTimeout(() => {
      if (!authReadyRef.current) {
        console.error('🔐 [Auth] Timeout after', AUTH_TIMEOUT_MS, 'ms - forcing ready state');
        debugLog('AUTH', `ERROR: Timeout after ${AUTH_TIMEOUT_MS}ms`);
        updateDebugStatus({ auth: 'error', errorMessage: 'Auth timeout' });
        authReadyRef.current = true;
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);
    
    // Anonymous Auth を開始
    const initAuth = async () => {
      try {
        console.log('🔐 [Auth] Starting anonymous auth...');
        debugLog('AUTH', 'signInAnonymously start');
        await signInAnonymously(auth);
        console.log('🔐 [Auth] Anonymous auth successful');
        debugLog('AUTH', 'signInAnonymously SUCCESS');
      } catch (error) {
        console.error('🔐 [Auth] Error:', error);
        debugLog('AUTH', 'ERROR: signInAnonymously failed', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        updateDebugStatus({ auth: 'error', errorMessage: `Auth: ${errorMsg.slice(0, 40)}` });
        // エラー時はタイムアウトをクリアしてready状態に
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        authReadyRef.current = true;
        setLoading(false);
      }
    };
    initAuth();
    
    // Auth State Listener
    console.log('🔐 [Auth] Subscribe to onAuthStateChanged');
    debugLog('AUTH', 'Subscribe to onAuthStateChanged');
    authUnsubRef.current = onAuthStateChanged(auth, (currentUser) => {
      console.log('🔐 [Auth] Callback fired:', currentUser ? `uid=${currentUser.uid.slice(0,8)}...` : 'null');
      debugLog('AUTH', 'onAuthStateChanged fired', { uid: currentUser?.uid?.slice(0, 8) || 'null' });
      
      // タイムアウトをクリア（listenerが発火したので不要）
      if (timeoutRef.current) {
        console.log('🔐 [Auth] Clearing timeout');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Auth準備完了
      authReadyRef.current = true;
      
      if (currentUser) {
        setUser({ uid: currentUser.uid });
        debugLog('AUTH', 'Auth OK, uid set');
        updateDebugStatus({ auth: 'ok' });
        
        // 既存のProfile listenerがあれば解除
        if (profileUnsubRef.current) {
          console.log('🔐 [Profile] Unsubscribe previous');
          profileUnsubRef.current();
          profileUnsubRef.current = null;
        }
        
        // Profile listener (これがAPI/Firestore読み込みに相当)
        console.log('🔐 [Profile] Subscribe start');
        debugLog('API', 'Profile onSnapshot start');
        const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main');
        profileUnsubRef.current = onSnapshot(
          profileRef,
          (docSnap) => {
            console.log('🔐 [Profile] Callback fired:', docSnap.exists() ? 'exists' : 'not exists');
            debugLog('API', 'Profile onSnapshot callback', { exists: docSnap.exists() });
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            updateDebugStatus({ api: 'ok' });
            setLoading(false);
          },
          (error) => {
            console.error('🔐 [Profile] Error:', error);
            debugLog('API', 'ERROR: Profile onSnapshot failed', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            updateDebugStatus({ api: 'error', errorMessage: `API: ${errorMsg.slice(0, 40)}` });
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setUserProfile(null);
        debugLog('AUTH', 'No user, auth null');
        updateDebugStatus({ auth: 'ok', api: 'skipped' });
        setLoading(false);
      }
    });
    
    // visibilitychange: ページ復帰時にリスナー状態を確認
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔐 [Visibility] Page became visible, authUnsubRef:', !!authUnsubRef.current);
        // リスナーが消えていたら再セットアップ（通常は消えないはず）
        if (!authUnsubRef.current && authReadyRef.current) {
          console.warn('🔐 [Visibility] Listener was lost, but auth is ready - skipping re-subscribe');
        }
      }
    };
    
    // pageshow: bfcache から復帰
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔐 [PageShow] Restored from bfcache, authUnsubRef:', !!authUnsubRef.current);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    // Cleanup
    return () => {
      console.log('🔐 [Auth] Cleanup start');
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      
      if (timeoutRef.current) {
        console.log('🔐 [Auth] Clearing timeout in cleanup');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (profileUnsubRef.current) {
        console.log('🔐 [Profile] Unsubscribe in cleanup');
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }
      
      if (authUnsubRef.current) {
        console.log('🔐 [Auth] Unsubscribe in cleanup');
        authUnsubRef.current();
        authUnsubRef.current = null;
      }
    };
  }, []); // 依存配列を空に - アプリで1回だけ実行

  // LINE連携チェック - ユーザー認証後にLIFFを初期化し、LINEログイン済みなら自動連携
  useEffect(() => {
    if (!user) return;
    
    // URLにLIFF関連のパラメータがある場合は、LINE認証から戻ってきた可能性がある
    const hasLiffParams = typeof window !== 'undefined' && (
      window.location.search.includes('liff.state') ||
      window.location.search.includes('code=') ||
      window.location.hash.includes('access_token')
    );
    
    // LIFF関連パラメータがある場合はフラグをリセットして再チェック
    if (hasLiffParams) {
      console.log('📱 [LINE] Detected LIFF params in URL, forcing re-check');
      lineLinkCheckedRef.current = false;
    }
    
    if (lineLinkCheckedRef.current) return;
    
    // 即座にフラグを立てて多重実行を防止
    lineLinkCheckedRef.current = true;
    
    const checkLineLink = async () => {
      try {
        console.log('📱 [LINE] Checking LINE link status...');
        
        // LIFF初期化（タイムアウト付き）
        const initPromise = initializeLiff();
        const timeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 8000) // 8秒に延長
        );
        
        const initialized = await Promise.race([initPromise, timeoutPromise]);
        if (!initialized) {
          console.log('📱 [LINE] LIFF initialization failed or timeout, skipping');
          return;
        }
        
        // LINEログイン済みかチェック
        if (!isLineLoggedIn()) {
          console.log('📱 [LINE] Not logged in to LINE');
          return;
        }
        
        // LINEプロフィール取得
        const lineProfile = await getLineProfile();
        if (!lineProfile) {
          console.log('📱 [LINE] Failed to get LINE profile');
          return;
        }
        
        console.log('📱 [LINE] LINE logged in, userId:', lineProfile.userId.slice(0, 8) + '...');
        
        // LINE連携を実行（バックグラウンドで、UIをブロックしない）
        try {
          await linkLineAccount(user.uid, lineProfile.userId, lineProfile.displayName);
          console.log('📱 [LINE] LINE account linked successfully');
          
          // URLからLIFFパラメータをクリーンアップ（履歴を置き換え）
          if (hasLiffParams && typeof window !== 'undefined') {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
            console.log('📱 [LINE] Cleaned up LIFF params from URL');
          }
        } catch (err) {
          console.error('📱 [LINE] Link error:', err);
        }
        
      } catch (error) {
        console.error('📱 [LINE] Error checking LINE link:', error);
      }
    };
    
    // 遅延なしで即座に実行
    checkLineLink();
  }, [user]);

  // 手動でLINE連携を実行（プロフィール画面から呼び出し）
  const handleLinkLine = async () => {
    if (!user) return;
    
    setIsLinkingLine(true);
    try {
      // LIFF初期化（タイムアウト付き）
      const initPromise = initializeLiff();
      const timeoutPromise = new Promise<boolean>((resolve) => 
        setTimeout(() => resolve(false), 8000) // 8秒に延長
      );
      
      const initialized = await Promise.race([initPromise, timeoutPromise]);
      if (!initialized) {
        alert('LINE連携の初期化に失敗しました。再度お試しください。');
        setIsLinkingLine(false);
        return;
      }
      
      // LINEログイン済みかチェック
      if (!isLineLoggedIn()) {
        // LINEログインページにリダイレクト
        // redirectUri は LIFFエンドポイントURL と同じパスにする必要がある
        const liff = await import('@line/liff').then(m => m.default);
        const redirectUrl = window.location.origin + '/onboarding';
        console.log('📱 [LINE] Redirecting to LINE login, will return to:', redirectUrl);
        liff.login({ redirectUri: redirectUrl });
        return; // リダイレクトされるので、ここで終了
      }
      
      // LINEプロフィール取得
      const lineProfile = await getLineProfile();
      if (!lineProfile) {
        alert('LINEプロフィールの取得に失敗しました');
        setIsLinkingLine(false);
        return;
      }
      
      // LINE連携を実行
      await linkLineAccount(user.uid, lineProfile.userId, lineProfile.displayName);
      alert('LINE連携が完了しました！');
      
    } catch (error) {
      console.error('LINE連携エラー:', error);
      alert('LINE連携に失敗しました');
    } finally {
      setIsLinkingLine(false);
    }
  };

  // Firestore Subscriptions
  useEffect(() => {
    if (!user) return;

    // 1. Posts Subscription (Community Feed)
    const postsQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    }, (err) => console.error("Posts fetch error:", err));

    // 2. Store Events Subscription (Official/Inferred Calendar)
    const eventsQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'store_events')
    );
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreEvent)));
    }, (err) => console.error("Events fetch error:", err));

    return () => {
      console.log('🔥 [Firestore] Cleaning up subscriptions');
      unsubPosts();
      unsubEvents();
    };
  }, [user]);

  // Mock "Agent" Logic (Generating Suggestions locally for prototype)
  const suggestions = useMemo(() => {
    if (posts.length > 0 && userProfile) {
      // Simulate Agent Analysis based on recent posts
      const recentPosts = posts.slice(0, 10);
      const favPosts = recentPosts.filter(p => userProfile.favorites.includes(p.character));
      
      let decision: 'go' | 'gather' | 'wait' = 'wait';
      let score = 0.3;
      let reasons = ['まだ情報が少ないみたい...'];

      if (favPosts.some(p => p.status === 'bought' || p.status === 'seen')) {
        decision = 'go';
        score = 0.85;
        reasons = [
          `${favPosts[0].areaMasked}で${favPosts[0].character}の目撃情報あり！`,
          `過去の傾向から今なら在庫がある確率が高いよ`,
          `あなたの行動範囲内での動きが活発です`
        ];
      } else if (favPosts.length > 0) {
        decision = 'gather';
        score = 0.5;
        reasons = ['動きはあるけど、まだ確定情報が足りないかも', 'もう少し様子を見てみよう'];
      }

      return {
        decision,
        score,
        reasons,
        candidates: [
          { area: userProfile.area || '新宿', time: '18:00〜', prob: Math.floor(score * 100) },
          { area: '池袋', time: '19:30〜', prob: Math.floor(score * 80) }
        ]
      };
    } else {
      // Default state
      return {
        decision: 'wait' as const,
        score: 0.1,
        reasons: ['まだ静かな様子...', '投稿が増えるのを待とう'],
        candidates: []
      };
    }
  }, [posts, userProfile]);

  const handleSignOut = async () => {
    console.log('🚪 [SignOut] Starting sign out process');
    
    // Firestoreのデータをクリア
    setPosts([]);
    setEvents([]);
    
    // ログアウト実行
    await signOut(auth);
    
    console.log('🚪 [SignOut] Sign out completed');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        posts,
        events,
        suggestions,
        loading,
        signOut: handleSignOut,
        isModalOpen,
        setIsModalOpen,
        linkLine: handleLinkLine,
        isLinkingLine,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

