"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Sparkles } from 'lucide-react';

export default function RootPage() {
  const { user, userProfile, loading } = useApp();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LINE認証から戻ってきたかどうかを検出
  const isFromLineAuth = typeof window !== 'undefined' && (
    window.location.search.includes('liff.state') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('access_token') ||
    document.referrer.includes('line.me') ||
    document.referrer.includes('liff')
  );

  // ローディングが長く続く場合のタイムアウト処理
  useEffect(() => {
    if (loading && !loadingTimeoutRef.current) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Loading timeout - forcing redirect to /home');
        if (!hasRedirected) {
          setHasRedirected(true);
          router.push('/home');
        }
      }, 10000); // 10秒でタイムアウト
    }
    
    if (!loading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, hasRedirected, router]);

  useEffect(() => {
    // 既にリダイレクト済みなら何もしない
    if (hasRedirected) return;
    
    // LINE認証から戻ってきた場合は特別処理
    if (isFromLineAuth) {
      console.log('🔗 Detected return from LINE auth');
      
      // loadingが完了していなくても、3秒後に強制的に /home へ
      const forceRedirectTimer = setTimeout(() => {
        if (!hasRedirected) {
          console.log('🔗 Force redirecting to /home after LINE auth');
          setHasRedirected(true);
          router.push('/home');
        }
      }, 3000);
      
      return () => clearTimeout(forceRedirectTimer);
    }
    
    if (!loading) {
      if (user && userProfile) {
        setHasRedirected(true);
        router.push('/home');
      } else if (user && !userProfile) {
        setHasRedirected(true);
        router.push('/onboarding');
      }
    }
  }, [loading, user, userProfile, router, hasRedirected, isFromLineAuth]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center">
        <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
        <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
      </div>
    </div>
  );
}
