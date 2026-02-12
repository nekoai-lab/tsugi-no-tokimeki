"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Sparkles } from 'lucide-react';

export default function RootPage() {
  const { user, userProfile, loading } = useApp();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isFromLineAuth, setIsFromLineAuth] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // LINE認証から戻ってきたかどうかを検出（クライアントサイドのみ）
  useEffect(() => {
    const checkLineAuth = 
      window.location.search.includes('liff.state') ||
      window.location.search.includes('code=') ||
      window.location.hash.includes('access_token') ||
      document.referrer.includes('line.me') ||
      document.referrer.includes('liff');
    
    if (checkLineAuth) {
      console.log('🔗 Detected return from LINE auth');
      setIsFromLineAuth(true);
    }
  }, []);

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

  // LINE認証から戻ってきた場合の強制リダイレクト
  useEffect(() => {
    if (!isFromLineAuth || hasRedirected) return;
    
    // loadingが完了していなくても、3秒後に強制的に /home へ
    const forceRedirectTimer = setTimeout(() => {
      if (!hasRedirected) {
        console.log('🔗 Force redirecting to /home after LINE auth');
        setHasRedirected(true);
        router.push('/home');
      }
    }, 3000);
    
    return () => clearTimeout(forceRedirectTimer);
  }, [isFromLineAuth, hasRedirected, router]);

  // 通常のリダイレクト処理
  useEffect(() => {
    // 既にリダイレクト済み、またはLINE認証からの戻りなら何もしない
    if (hasRedirected || isFromLineAuth) return;
    
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
    <div className="flex min-full-height w-full items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center">
        <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
        <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
      </div>
    </div>
  );
}
