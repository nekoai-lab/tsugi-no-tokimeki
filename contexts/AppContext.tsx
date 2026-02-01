"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '@/lib/firebase';
import type { UserProfile, Post, StoreEvent, Suggestion, FirebaseUser } from '@/lib/types';

interface AppContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  posts: Post[];
  events: StoreEvent[];
  suggestions: Suggestion | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({ uid: currentUser.uid });
        // Fetch Profile
        const profileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main');
        const unsubProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
        return () => unsubProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
    await signOut(auth);
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

