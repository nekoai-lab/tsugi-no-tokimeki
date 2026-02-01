"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import ProfileScreen from '@/screens/ProfileScreen';

export default function ProfilePage() {
  const { user, userProfile, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !userProfile) {
      router.push('/onboarding');
    }
  }, [loading, user, userProfile, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-pink-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 text-pink-500 animate-bounce">✨</div>
          <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
        </div>
      </div>
    );
  }

  return <ProfileScreen />;
}

