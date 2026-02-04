"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Sparkles } from 'lucide-react';

export default function RootPage() {
  const { user, userProfile, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && userProfile) {
        router.push('/home');
      } else if (user && !userProfile) {
        router.push('/onboarding');
      }
    }
  }, [loading, user, userProfile, router]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-pink-50">
      <div className="flex flex-col items-center">
        <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
        <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
      </div>
    </div>
  );
}
