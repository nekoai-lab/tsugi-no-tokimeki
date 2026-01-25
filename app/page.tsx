"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Search, 
  Plus, 
  Bell, 
  User, 
  Home, 
  Sparkles,
  XCircle,
  RefreshCw,
  Send,
  Map
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'tsugi-no-tokimeki';

// --- Types ---
interface UserProfile {
  favorites: string[];
  area: string;
  availability: Record<string, string[]>;
  updatedAt?: Timestamp;
}

interface Post {
  id: string;
  uid: string;
  text: string;
  status: 'seen' | 'bought' | 'soldout';
  character: string;
  stickerType: string;
  areaMasked: string;
  createdAt?: Timestamp;
}

interface StoreEvent {
  id: string;
  [key: string]: unknown;
}

interface Suggestion {
  decision: 'go' | 'gather' | 'wait';
  score: number;
  reasons: string[];
  candidates: { area: string; time: string; prob: number }[];
}

interface FirebaseUser {
  uid: string;
}

// --- Constants ---
const CHARACTERS = ['エンジェルブルー', 'メゾピアノ', 'デイジーラバーズ', 'ポンポネット', 'ブルークロス'];
const STICKER_TYPES = ['ボンボンドロップ', 'プチドロップ', 'タイルシール', 'ノーマル'];
const AREAS = ['新宿', '渋谷', '池袋', '東京', '横浜', '大宮'];
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// --- Helper Functions ---
const formatDate = (date: Timestamp | Date | null | undefined): string => {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getRelativeTime = (date: Timestamp | Date | null | undefined): string => {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return 'たった今';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
  return formatDate(d);
};

// --- Components ---

// 1. Onboarding Component
const Onboarding = ({ user, onComplete }: { user: FirebaseUser; onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    favorites: [],
    area: '',
    availability: {}
  });

  const toggleFavorite = (char: string) => {
    setProfile(prev => ({
      ...prev,
      favorites: prev.favorites.includes(char) 
        ? prev.favorites.filter(c => c !== char)
        : [...prev.favorites, char]
    }));
  };

  const toggleAvailability = (dayIndex: number, timeSlot: string) => {
    const dayStr = dayIndex.toString();
    setProfile(prev => {
      const currentSlots = prev.availability[dayStr] || [];
      const newSlots = currentSlots.includes(timeSlot)
        ? currentSlots.filter(s => s !== timeSlot)
        : [...currentSlots, timeSlot];
      return { ...prev, availability: { ...prev.availability, [dayStr]: newSlots } };
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
        ...profile,
        updatedAt: serverTimestamp()
      });
      onComplete();
    } catch (e) {
      console.error("Error saving profile", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-pink-50 p-6 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">
        <div className="mb-8 text-center">
          <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Tsugi no Tokimeki</h1>
          <p className="text-gray-500 text-sm mt-2">次のトキメキを逃さないための<br/>行動判断エージェント</p>
        </div>

        {step === 1 && (
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
            <h2 className="text-lg font-bold mb-4 text-center">推しキャラを選んでね</h2>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {CHARACTERS.map(char => (
                <button
                  key={char}
                  onClick={() => toggleFavorite(char)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    profile.favorites.includes(char)
                      ? 'bg-pink-500 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={profile.favorites.length === 0}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
            <h2 className="text-lg font-bold mb-4 text-center">よく行くエリアは？</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => setProfile({ ...profile, area })}
                  className={`p-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    profile.area === area
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-transparent bg-gray-100 text-gray-600'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!profile.area}
                className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold disabled:opacity-50"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full bg-white p-6 rounded-2xl shadow-sm animate-in fade-in duration-500">
            <h2 className="text-lg font-bold mb-2 text-center">いつ買いに行ける？(v3)</h2>
            <p className="text-xs text-center text-gray-400 mb-4">空いている時間を登録すると<br/>「行ける日」だけ通知します</p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {WEEKDAYS.map((day, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-8 text-sm font-bold text-gray-600 text-center">{day}</span>
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                    {['午前', '午後', '夕方', '夜'].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toggleAvailability(idx, slot)}
                        className={`whitespace-nowrap px-2 py-1 rounded-md text-xs border ${
                          (profile.availability[idx.toString()] || []).includes(slot)
                            ? 'bg-blue-100 border-blue-400 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 text-gray-500 font-medium">戻る</button>
              <button 
                onClick={saveProfile}
                className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-200"
              >
                はじめる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Main App Shell & Views
const AppShell = ({ user, userProfile }: { user: FirebaseUser; userProfile: UserProfile }) => {
  const [activeTab, setActiveTab] = useState('foryou');
  const [showPostModal, setShowPostModal] = useState(false);

  // Data State
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null);

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
  useEffect(() => {
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

      setSuggestions({
        decision,
        score,
        reasons,
        candidates: [
          { area: userProfile.area || '新宿', time: '18:00〜', prob: Math.floor(score * 100) },
          { area: '池袋', time: '19:30〜', prob: Math.floor(score * 80) }
        ]
      });
    } else {
       // Default state
       setSuggestions({
        decision: 'wait',
        score: 0.1,
        reasons: ['まだ静かな様子...', '投稿が増えるのを待とう'],
        candidates: []
      });
    }
  }, [posts, userProfile]);


  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-4 py-3 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Tsugi no Tokimeki
        </h1>
        <div className="flex items-center gap-3">
            {/* Mock Notification Badge */}
            <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-300 to-purple-300 border-2 border-white"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'foryou' && <ForYouView suggestions={suggestions} userProfile={userProfile} />}
        {activeTab === 'feed' && <FeedView posts={posts} userProfile={userProfile} />}
        {activeTab === 'calendar' && <CalendarView userProfile={userProfile} />}
        {activeTab === 'profile' && <ProfileView userProfile={userProfile} user={user} />}
      </main>

      {/* Floating Action Button for Post */}
      <button 
        onClick={() => setShowPostModal(true)}
        className="absolute bottom-20 right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20">
        <NavButton active={activeTab === 'foryou'} onClick={() => setActiveTab('foryou')} icon={Sparkles} label="For You" />
        <NavButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} icon={Home} label="Feed" />
        <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={CalendarIcon} label="Calendar" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Profile" />
      </nav>

      {/* Post Modal Overlay */}
      {showPostModal && (
        <PostModal 
            onClose={() => setShowPostModal(false)} 
            user={user} 
            userProfile={userProfile}
        />
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 w-16">
    <Icon className={`w-6 h-6 transition-colors ${active ? 'text-pink-500' : 'text-gray-400'}`} />
    <span className={`text-[10px] font-medium ${active ? 'text-pink-500' : 'text-gray-400'}`}>{label}</span>
  </button>
);

// --- Sub-Views ---

const ForYouView = ({ suggestions, userProfile }: { suggestions: Suggestion | null; userProfile: UserProfile }) => {
    // Helper to calculate next match
    const nextMatch = useMemo(() => {
        if (!userProfile?.availability) return null;
        // Simple mock matching logic
        const today = new Date().getDay();
        const availableSlots = userProfile.availability[today.toString()] || [];
        if (availableSlots.length > 0) return { day: '今日', slots: availableSlots };
        
        // Check upcoming days...
        return { day: '土曜日', slots: ['午後'] }; // Mock
    }, [userProfile]);

    const getStatusColor = (decision: string | undefined) => {
        switch(decision) {
            case 'go': return 'bg-gradient-to-br from-pink-500 to-rose-500 text-white';
            case 'gather': return 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white';
            default: return 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600';
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* 1. Today's Decision Card */}
            <section className="animate-in fade-in duration-500">
                <div className={`rounded-3xl p-6 shadow-lg relative overflow-hidden ${getStatusColor(suggestions?.decision)}`}>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Today&apos;s AI Decision</span>
                            <span className="text-3xl font-black">{Math.floor((suggestions?.score || 0) * 100)}%</span>
                        </div>
                        <h2 className="text-4xl font-extrabold mb-4">
                            {suggestions?.decision === 'go' ? 'いま動こう！' : 
                             suggestions?.decision === 'gather' ? '情報収集中' : '待機推奨'}
                        </h2>
                        
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-2">
                            <h3 className="text-xs font-bold opacity-75 mb-1 flex items-center gap-1">
                                <Search className="w-3 h-3" /> 判断の根拠
                            </h3>
                            {suggestions?.reasons.map((reason, i) => (
                                <p key={i} className="text-sm font-medium leading-snug flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                    {reason}
                                </p>
                            ))}
                        </div>
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </section>

            {/* 2. Candidates */}
            {suggestions?.decision !== 'wait' && (
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> おすすめアクション
                    </h3>
                    <div className="grid gap-3">
                        {suggestions?.candidates.map((cand, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-800">{cand.area}</span>
                                        <span className="text-sm text-gray-500">エリア</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {cand.time} 推奨
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold text-pink-500">{cand.prob}%</span>
                                    <span className="text-[10px] text-gray-400">遭遇期待値</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. Next Opportunity (v3 Feature) */}
            <section className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">次の行けるチャンス</h3>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            {nextMatch 
                                ? `あなたの空き時間（${nextMatch.day}・${nextMatch.slots.join('/')}）に、${userProfile?.area || '設定エリア'}周辺でイベントがありそうです。` 
                                : '現在、確実に行ける候補日は見つかりませんでした。'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeedView = ({ posts, userProfile }: { posts: Post[]; userProfile: UserProfile }) => {
    return (
        <div className="pb-4">
            {/* Filters (Mock) */}
            <div className="px-4 py-3 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto">
                <button className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium whitespace-nowrap">全て</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1">
                    <Heart className="w-3 h-3" /> お気に入り
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1">
                    <Map className="w-3 h-3" /> {userProfile?.area || 'エリア'}
                </button>
            </div>

            {/* Feed List */}
            <div className="divide-y divide-gray-100">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        まだ投稿がありません。<br/>最初の情報をシェアしよう！
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                        post.status === 'bought' ? 'bg-green-50 border-green-200 text-green-700' :
                                        post.status === 'soldout' ? 'bg-red-50 border-red-200 text-red-700' :
                                        'bg-blue-50 border-blue-200 text-blue-700'
                                    }`}>
                                        {post.status === 'bought' ? '買えた！' : post.status === 'soldout' ? '売り切れ' : '目撃'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">{post.character}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{getRelativeTime(post.createdAt)}</span>
                            </div>
                            
                            <p className="text-sm text-gray-800 mb-2 leading-relaxed">{post.text}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {post.areaMasked || 'エリア不明'}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {post.stickerType}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CalendarView = ({ userProfile }: { userProfile: UserProfile }) => {
    // Generate next 7 days
    const dates = useMemo(() => {
        const list: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            list.push(d);
        }
        return list;
    }, []);

    const isAvailable = (date: Date) => {
        const dayIdx = date.getDay().toString();
        return (userProfile?.availability?.[dayIdx]?.length || 0) > 0;
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-pink-500" />
                行ける候補日リスト
                <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">v3 New</span>
            </h2>
            
            <div className="space-y-3">
                {dates.map((date, i) => {
                    const available = isAvailable(date);
                    const dateStr = `${date.getMonth()+1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;
                    
                    return (
                        <div key={i} className={`rounded-xl p-4 border transition-all ${
                            available 
                                ? 'bg-white border-pink-200 shadow-sm' 
                                : 'bg-gray-50 border-transparent opacity-60'
                        }`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-bold ${available ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {dateStr}
                                </span>
                                {available ? (
                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">行ける！</span>
                                ) : (
                                    <span className="text-[10px] text-gray-400">予定なし</span>
                                )}
                            </div>

                            {available && (
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 
                                        空き時間: {(userProfile.availability[date.getDay().toString()] || []).join(', ')}
                                    </div>
                                    
                                    {/* Mock matched event */}
                                    {i % 3 === 0 && (
                                        <div className="mt-2 bg-pink-50 rounded-lg p-2 text-xs border border-pink-100 flex gap-2 items-start">
                                            <Sparkles className="w-3 h-3 text-pink-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-gray-800">再販の可能性アリ</p>
                                                <p className="text-gray-500">{userProfile.area}エリア周辺で動きがありそうです</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-xs text-gray-500 text-center">
                Googleカレンダー連携は今後のアップデートで追加予定です
            </div>
        </div>
    );
};

const ProfileView = ({ userProfile, user }: { userProfile: UserProfile; user: FirebaseUser }) => {
    return (
        <div className="p-4">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                    🦄
                </div>
                <div>
                    <h2 className="font-bold text-lg">My Profile</h2>
                    <p className="text-xs text-gray-500">ID: {user?.uid?.slice(0, 6)}...</p>
                </div>
            </div>

            <div className="space-y-6">
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">設定中の条件</h3>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="p-3 border-b border-gray-50 flex justify-between">
                            <span className="text-sm text-gray-600">エリア</span>
                            <span className="text-sm font-bold text-gray-900">{userProfile?.area}</span>
                        </div>
                        <div className="p-3 border-b border-gray-50">
                            <span className="text-sm text-gray-600 block mb-2">お気に入りキャラ</span>
                            <div className="flex flex-wrap gap-1">
                                {userProfile?.favorites?.map(f => (
                                    <span key={f} className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-md">{f}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <button 
                    onClick={() => signOut(auth)}
                    className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl mt-8"
                >
                    ログアウト
                </button>
            </div>
        </div>
    );
};

// --- Modals ---

const PostModal = ({ onClose, user, userProfile }: { onClose: () => void; user: FirebaseUser; userProfile: UserProfile }) => {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<'seen' | 'bought' | 'soldout'>('seen');
    const [character, setCharacter] = useState(userProfile?.favorites?.[0] || CHARACTERS[0]);
    const [stickerType, setStickerType] = useState(STICKER_TYPES[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), {
                uid: user.uid,
                text,
                status,
                character,
                stickerType,
                areaMasked: userProfile?.area || '不明',
                createdAt: serverTimestamp()
            });
            onClose();
        } catch (e) {
            console.error("Post error:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">情報をシェア</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><XCircle className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="space-y-4">
                    {/* Status Select */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        {[
                            { id: 'seen' as const, label: '👀 見た', activeClass: 'bg-white text-blue-600 shadow-sm' },
                            { id: 'bought' as const, label: '🛍 買えた', activeClass: 'bg-white text-green-600 shadow-sm' },
                            { id: 'soldout' as const, label: '😢 売り切れ', activeClass: 'bg-white text-red-600 shadow-sm' }
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStatus(s.id)}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                                    status === s.id ? s.activeClass : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            value={character} onChange={(e) => setCharacter(e.target.value)}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                            {CHARACTERS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         <select 
                            value={stickerType} onChange={(e) => setStickerType(e.target.value)}
                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                            {STICKER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="詳細を教えてください（例：3Fのガチャコーナーにありました！残りわずかです。）"
                        className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    />

                    <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                        <MapPin className="w-3 h-3" />
                        <span>位置情報は「{userProfile?.area}」周辺として丸められます</span>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !text}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        投稿する
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Entry Point ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-pink-50">
            <div className="flex flex-col items-center">
                <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
                <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
            </div>
        </div>
    );
  }

  // If authenticated but no profile, show Onboarding
  if (user && !userProfile) {
    return <Onboarding user={user} onComplete={() => {}} />;
  }

  if (user && userProfile) {
    return <AppShell user={user} userProfile={userProfile} />;
  }

  // Fallback loading state
  return (
    <div className="flex h-screen w-full items-center justify-center bg-pink-50">
        <div className="flex flex-col items-center">
            <Sparkles className="w-10 h-10 text-pink-500 animate-bounce" />
            <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
        </div>
    </div>
  );
}
