"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { getRouteProposalById, updateRouteProposal, confirmRouteProposal } from '@/lib/routeProposalService';
import type { RouteProposal, Shop } from '@/lib/types';
import RouteDetailView from '@/components/RouteDetailView';
import RouteRegenerateModal from '@/components/RouteRegenerateModal';
import { Loader2 } from 'lucide-react';

export default function RouteResultPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useApp();
    const [proposal, setProposal] = useState<RouteProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRegenerate, setShowRegenerate] = useState(false);

    useEffect(() => {
        if (!user || !id) return;

        const load = async () => {
            const data = await getRouteProposalById(user.uid, id);
            setProposal(data);
            setLoading(false);
        };
        load();
    }, [user, id]);

    const handleRegenerate = () => {
        setShowRegenerate(true);
    };

    const handleConfirm = async () => {
        if (!user || !proposal) return;

        await updateRouteProposal(user.uid, proposal.id, {
            shops: proposal.shops,
            totalTravelTime: proposal.totalTravelTime,
        });

        // Mark as confirmed
        await confirmRouteProposal(user.uid, proposal.id);

        // Navigate back to home
        router.push('/home');
    };

    const handleRegenerateConfirm = async (shops: Shop[], totalTravelTime: number) => {
        if (!user || !proposal) return;

        await updateRouteProposal(user.uid, proposal.id, {
            shops,
            totalTravelTime,
        });

        // 更新されたデータを再取得
        const updated = await getRouteProposalById(user.uid, proposal.id);
        if (updated) setProposal(updated);
        setShowRegenerate(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    <p className="text-sm text-gray-500">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">ルート提案が見つかりません</p>
                    <button
                        onClick={() => router.push('/home')}
                        className="text-pink-500 font-bold"
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <RouteDetailView
                proposal={proposal}
                onBack={() => router.push('/home')}
                onRegenerate={handleRegenerate}
                onConfirm={handleConfirm}
            />

            {showRegenerate && (
                <RouteRegenerateModal
                    proposal={proposal}
                    onClose={() => setShowRegenerate(false)}
                    onConfirm={handleRegenerateConfirm}
                />
            )}
        </>
    );
}
