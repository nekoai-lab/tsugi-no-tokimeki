"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Sparkles } from 'lucide-react';

export default function RootPage() {
  const { user, userProfile, loading } = useApp();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // 既にリダイレクト済みなら何もしない
    if (hasRedirected) return;
    
    // LINE認証から戻ってきたかどうかを検出
    const isFromLineAuth = typeof window !== 'undefined' && (
      window.location.search.includes('liff.state') ||
      window.location.search.includes('code=') ||
      window.location.hash.includes('access_token') ||
      document.referrer.includes('line.me') ||
      document.referrer.includes('liff')
    );
    
    if (!loading) {
      if (user && userProfile) {
        setHasRedirected(true);
        router.push('/home');
      } else if (user && !userProfile) {
        // LINE認証から戻ってきた場合は、プロフィールがまだ読み込まれていない可能性がある
        // 少し待ってから判定する
        if (isFromLineAuth) {
          console.log('🔗 Detected return from LINE auth, waiting for profile...');
          // 2秒待ってもプロフィールがなければオンボーディングへ
          const timer = setTimeout(() => {
            if (!userProfile) {
              // 既存ユーザーの可能性があるので /home にリダイレクト
              // /home 側でプロフィール有無を再判定する
              setHasRedirected(true);
              router.push('/home');
            }
          }, 2000);
          return () => clearTimeout(timer);
        } else {
          setHasRedirected(true);
          router.push('/onboarding');
        }
      }
    }
  }, [loading, user, userProfile, router, hasRedirected]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center">
        <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
        <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
      </div>
    </div>
  );
}
