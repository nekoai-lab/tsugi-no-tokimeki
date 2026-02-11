"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { getRouteProposalByDate, saveRouteProposal } from '@/lib/routeProposalService';
import { subscribeStickerAlbumPosts } from '@/lib/stickerAlbumService';
import StickerPostHorizontalList from '@/components/StickerPostHorizontalList';
import TodayRouteHeroCard from '@/components/TodayRouteHeroCard';
import ConditionSummaryCard from '@/components/ConditionSummaryCard';
import ConditionEditModal, { type ConditionData } from '@/components/ConditionEditModal';
import type { StickerAlbumPost, RouteProposal } from '@/lib/types';

export default function HomePage() {
    const router = useRouter();
    const { userProfile, user, posts } = useApp();
    const [editingConditions, setEditingConditions] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [todayRouteId, setTodayRouteId] = useState<string | null>(null);
    const [todayRoute, setTodayRoute] = useState<RouteProposal | null>(null);
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
                setTodayRoute(todayRoute);
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

                const newProposal = {
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
                };

                const proposalId = await saveRouteProposal(user.uid, newProposal);

                setTodayRouteId(proposalId);
                setTodayRoute({
                    id: proposalId,
                    userId: user.uid,
                    confirmed: false,
                    ...newProposal,
                });
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

    // 全条件を一括保存
    const handleSaveConditions = async (data: ConditionData) => {
        if (!user) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(profileRef, {
            favorites: data.characters,
            areas: data.areas,
            area: data.areas[0] || '',
            preferredShops: data.shops,
            preferredStickerTypes: data.stickerTypes,
            startTime: data.startTime,
            endTime: data.endTime,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    };

    const handleViewSchedule = () => {
        if (todayRouteId) {
            router.push(`/route-result/${todayRouteId}`);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* 今日のときめきルート - ヒーローカード */}
            <section>
                <TodayRouteHeroCard
                    areas={todayRoute?.areas || currentAreas}
                    totalTravelTime={todayRoute?.totalTravelTime || 0}
                    shops={todayRoute?.shops || []}
                    onViewRoute={handleViewSchedule}
                    generating={generating}
                    hasRoute={!!todayRouteId}
                />
            </section>

            {/* シール帳の最新投稿 */}
            <section>
                <StickerPostHorizontalList posts={stickerPosts} />
            </section>

            {/* 設定中の条件 - コンパクトカード */}
            <section>
                <ConditionSummaryCard
                    characters={currentCharacters}
                    areas={currentAreas}
                    shops={currentShops}
                    stickerTypes={currentStickerTypes}
                    startTime={currentStartTime}
                    endTime={currentEndTime}
                    onEdit={() => setEditingConditions(true)}
                />
            </section>

            {/* 条件編集モーダル */}
            <ConditionEditModal
                isOpen={editingConditions}
                onClose={() => setEditingConditions(false)}
                onSave={handleSaveConditions}
                initialData={{
                    characters: currentCharacters,
                    areas: currentAreas,
                    shops: currentShops,
                    stickerTypes: currentStickerTypes,
                    startTime: currentStartTime,
                    endTime: currentEndTime,
                }}
            />
        </div>
    );
}

