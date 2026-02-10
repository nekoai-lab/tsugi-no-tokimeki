"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { getRouteProposalByDate, saveRouteProposal } from '@/lib/routeProposalService';
import { subscribeStickerAlbumPosts } from '@/lib/stickerAlbumService';
import { STICKER_TYPES, CHARACTERS, PREFERRED_SHOPS, AREAS } from '@/lib/utils';
import { Route, ChevronRight, Clock, Loader2 } from 'lucide-react';
import ProfileEditModal from '@/components/ProfileEditModal';
import TimeEditModal from '@/components/TimeEditModal';
import StickerPostHorizontalList from '@/components/StickerPostHorizontalList';
import type { StickerAlbumPost } from '@/lib/types';

function formatDisplayList(items: string[], max = 3): string {
    if (!items || items.length === 0) return '未設定';
    if (items.length <= max) return items.join('、');
    return `${items.slice(0, max).join('、')} 他${items.length - max}件`;
}

export default function HomePage() {
    const router = useRouter();
    const { userProfile, user, posts } = useApp();
    const [editingArea, setEditingArea] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState(false);
    const [editingShops, setEditingShops] = useState(false);
    const [editingStickerTypes, setEditingStickerTypes] = useState(false);
    const [editingTime, setEditingTime] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [todayRouteId, setTodayRouteId] = useState<string | null>(null);
    const [stickerPosts, setStickerPosts] = useState<StickerAlbumPost[]>([]);
    const generationStarted = useRef(false);

    const currentAreas = (() => {
        if (userProfile?.areas && userProfile.areas.length > 0) return userProfile.areas;
        if (userProfile?.area) return [userProfile.area];
        return [];
    })();
    const currentCharacters = userProfile?.favorites || [];
    const currentShops = userProfile?.preferredShops || [];
    const currentStickerTypes = userProfile?.preferredStickerTypes || [];
    const currentStartTime = userProfile?.startTime || '';
    const currentEndTime = userProfile?.endTime || '';

    // ページ表示時に今日のルートを確認し、なければ自動生成
    useEffect(() => {
        if (!user || !userProfile || generationStarted.current) return;
        generationStarted.current = true;

        const generateIfNeeded = async () => {
            const today = new Date().toISOString().split('T')[0];
            const todayRoute = await getRouteProposalByDate(user.uid, today);

            if (todayRoute) {
                setTodayRouteId(todayRoute.id);
                return;
            }

            // プロフィールが不十分な場合はスキップ
            const areas = userProfile.areas || (userProfile.area ? [userProfile.area] : []);
            if (areas.length === 0) return;

            setGenerating(true);
            try {
                const startTime = userProfile.startTime || '10:00';
                const endTime = userProfile.endTime || '20:00';

                const userPosts = posts
                    .filter(p => p.uid === user.uid)
                    .slice(0, 10)
                    .map(p => ({
                        text: p.text || '',
                        status: p.status,
                        character: p.character || '',
                        areaMasked: p.areaMasked || '',
                    }));

                const response = await fetch('/api/route-proposal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.uid,
                        areas,
                        stickerType: userProfile.preferredStickerTypes?.[0] || '',
                        stickerDesign: userProfile.favorites?.[0] || '',
                        startTime,
                        endTime,
                        preferredShops: userProfile.preferredShops || [],
                        userPosts,
                        favorites: userProfile.favorites || [],
                        userArea: userProfile.area || '',
                    }),
                });

                if (!response.ok) {
                    throw new Error('API call failed');
                }

                const data = await response.json();

                const proposalId = await saveRouteProposal(user.uid, {
                    date: today,
                    areas,
                    stickerType: userProfile.preferredStickerTypes?.[0] || '',
                    stickerDesign: userProfile.favorites?.[0] || '',
                    startTime,
                    endTime,
                    preferredShops: userProfile.preferredShops || [],
                    shops: data.shops || [],
                    totalTravelTime: data.totalTravelTime || 0,
                    supplementaryInfo: data.supplementaryInfo,
                });

                setTodayRouteId(proposalId);
            } catch (error) {
                console.error('Route generation error:', error);
            } finally {
                setGenerating(false);
            }
        };

        generateIfNeeded();
    }, [user, userProfile, posts]);

    // シール帳の最新投稿を取得
    useEffect(() => {
        const unsubscribe = subscribeStickerAlbumPosts((posts) => {
            // 最新10件のみ表示
            setStickerPosts(posts.slice(0, 10));
        });
        return () => unsubscribe();
    }, []);

    const handleSaveAreas = async (selected: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            areas: selected,
            area: selected[0] || '',
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleSaveCharacters = async (selected: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            favorites: selected,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleSaveShops = async (selected: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            preferredShops: selected,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleSaveStickerTypes = async (selected: string[]) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            preferredStickerTypes: selected,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleSaveTime = async (startTime: string, endTime: string) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            startTime,
            endTime,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleViewSchedule = () => {
        if (todayRouteId) {
            router.push(`/route-result/${todayRouteId}`);
        }
    };

    const timeDisplay = currentStartTime && currentEndTime
        ? `${currentStartTime}〜${currentEndTime}`
        : '未設定';

    return (
        <div className="p-4 space-y-6">
            {/* シール帳の最新投稿 */}
            <section>
                <StickerPostHorizontalList posts={stickerPosts} />
            </section>

            {/* Route Proposal Button */}
            <section>
                <button
                    onClick={handleViewSchedule}
                    disabled={generating || !todayRouteId}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AIがスケジュールを生成中...
                        </>
                    ) : todayRouteId ? (
                        <>
                            <Route className="w-5 h-5" />
                            AIの提案したスケジュールを見る
                        </>
                    ) : (
                        <>
                            <Route className="w-5 h-5" />
                            スケジュール準備中...
                        </>
                    )}
                </button>
            </section>

            {/* 設定中の条件 */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 mb-3 border-b pb-1">設定中の条件</h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => setEditingArea(true)}
                        className="w-full p-3 border-b border-gray-50 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <div className="text-left">
                            <span className="text-sm text-gray-600">エリア</span>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {formatDisplayList(currentAreas)}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                    <button
                        onClick={() => setEditingCharacter(true)}
                        className="w-full p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-left flex-1">
                                <span className="text-sm text-gray-600 block mb-2">お気に入りキャラ</span>
                                <div className="flex flex-wrap gap-1">
                                    {currentCharacters.length > 0 ? (
                                        currentCharacters.map(f => (
                                            <span key={f} className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-md">{f}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400">未設定</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                    </button>
                    <button
                        onClick={() => setEditingShops(true)}
                        className="w-full p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-left flex-1">
                                <span className="text-sm text-gray-600 block mb-2">よく行くお店</span>
                                <div className="flex flex-wrap gap-1">
                                    {currentShops.length > 0 ? (
                                        currentShops.map(s => (
                                            <span key={s} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{s}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400">未設定</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                    </button>
                    <button
                        onClick={() => setEditingStickerTypes(true)}
                        className="w-full p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-left flex-1">
                                <span className="text-sm text-gray-600 block mb-2">欲しいシールの種類</span>
                                <div className="flex flex-wrap gap-1">
                                    {currentStickerTypes.length > 0 ? (
                                        currentStickerTypes.map(t => (
                                            <span key={t} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md">{t}</span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400">未設定</span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                    </button>
                    <button
                        onClick={() => setEditingTime(true)}
                        className="w-full p-3 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <div className="text-left">
                                <span className="text-sm text-gray-600">指定時間</span>
                                <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    {timeDisplay}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                    </button>
                </div>
            </section>

            <ProfileEditModal
                isOpen={editingArea}
                onClose={() => setEditingArea(false)}
                onSave={handleSaveAreas}
                title="エリアを選択"
                options={AREAS}
                initialSelected={currentAreas}
            />
            <ProfileEditModal
                isOpen={editingCharacter}
                onClose={() => setEditingCharacter(false)}
                onSave={handleSaveCharacters}
                title="お気に入りキャラを選択"
                options={CHARACTERS}
                initialSelected={currentCharacters}
            />
            <ProfileEditModal
                isOpen={editingShops}
                onClose={() => setEditingShops(false)}
                onSave={handleSaveShops}
                title="よく行くお店を選択"
                options={PREFERRED_SHOPS}
                initialSelected={currentShops}
            />
            <ProfileEditModal
                isOpen={editingStickerTypes}
                onClose={() => setEditingStickerTypes(false)}
                onSave={handleSaveStickerTypes}
                title="欲しいシールの種類を選択"
                options={STICKER_TYPES}
                initialSelected={currentStickerTypes}
            />
            <TimeEditModal
                isOpen={editingTime}
                onClose={() => setEditingTime(false)}
                onSave={handleSaveTime}
                initialStartTime={currentStartTime}
                initialEndTime={currentEndTime}
            />
        </div>
    );
}

