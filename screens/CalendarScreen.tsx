"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { WEEKDAYS } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Plus, MapPin, CheckCircle } from 'lucide-react';
import { subscribeRouteProposals, confirmRouteProposal } from '@/lib/routeProposalService';

import RouteDetailView from '@/components/RouteDetailView';
import type { RouteProposal } from '@/lib/types';
import RouteProposalModal from '@/components/RouteProposalModal/RouteProposalModal';

type ViewMode = 'list' | 'detail' | 'modal';

export default function CalendarScreen() {
    const { user, userProfile } = useApp();
    const [routeProposals, setRouteProposals] = useState<RouteProposal[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedProposal, setSelectedProposal] = useState<RouteProposal | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // ルート提案をリアルタイム購読
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeRouteProposals(user.uid, (proposals) => {
            setRouteProposals(proposals);
        });

        return () => unsubscribe();
    }, [user]);

    // URLパラメータからモーダル起動フラグをチェック
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('add') === 'true') {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
                setViewMode('modal');
            }
        }
    }, []);

    const formatDateString = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const handleDateClick = (proposal: RouteProposal) => {
        setSelectedProposal(proposal);
        setViewMode('detail');
    };

    const handleAddSchedule = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setViewMode('modal');
    };

    const handleModalConfirm = () => {
        setViewMode('list');
        setSelectedDate('');
        // URLパラメータをクリア
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
        }
    };

    const handleDetailConfirm = async () => {
        if (!selectedProposal || !user) return;

        try {
            await confirmRouteProposal(user.uid, selectedProposal.id);
            setSelectedProposal({ ...selectedProposal, confirmed: true });
        } catch (error) {
            console.error('Confirm error:', error);
            alert('確定に失敗しました');
        }
    };

    const handleRequestAnother = () => {
        if (!selectedProposal) return;
        setSelectedDate(selectedProposal.date);
        setViewMode('modal');
    };

    const formatTimeRange = (proposal: RouteProposal) => {
        if (proposal.startTime && proposal.endTime) {
            return `${proposal.startTime}〜${proposal.endTime}`;
        }
        // 古いデータ構造のフォールバック
        if (proposal.timeSlot) {
            const timeSlotLabel = { morning: '午前', afternoon: '午後', allday: '1日中' }[proposal.timeSlot];
            return timeSlotLabel;
        }
        return '時間未設定';
    };

    const getAreasDisplay = (proposal: RouteProposal) => {
        if (proposal.areas && proposal.areas.length > 0) {
            return proposal.areas.join('、');
        }
        // 古いデータ構造のフォールバック
        if (proposal.area) {
            return proposal.area;
        }
        return 'エリア未設定';
    };

    // 詳細画面表示
    if (viewMode === 'detail' && selectedProposal) {
        return (
            <RouteDetailView
                proposal={selectedProposal}
                onBack={() => setViewMode('list')}
                onConfirm={handleDetailConfirm}
                onRequestAnother={handleRequestAnother}
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-pink-500" />
                    次の行動スケジュール
                    <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">v3 New</span>
                </h2>

                {routeProposals.length === 0 ? (
                    // スケジュールがない場合
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="bg-gray-100 rounded-full p-6 mb-4">
                            <CalendarIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-6 text-sm">まだスケジュールがありません</p>
                        <button
                            onClick={handleAddSchedule}
                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            スケジュールを追加
                        </button>
                    </div>
                ) : (
                    // スケジュールがある場合
                    <div className="space-y-3">
                        {routeProposals.map((proposal) => {
                            const date = new Date(proposal.date);
                            const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;

                            return (
                                <button
                                    key={proposal.id}
                                    onClick={() => handleDateClick(proposal)}
                                    className="w-full text-left rounded-xl p-4 border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-800">{dateStr}</span>
                                        {proposal.confirmed ? (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                確定済み
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded">
                                                🗺️ AI提案のルートあり
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-600 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {getAreasDisplay(proposal)}エリア
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatTimeRange(proposal)}・{proposal.shops.length}店舗
                                        </div>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="text-xs text-pink-500 font-bold">見る →</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* スケジュール追加ボタン（スケジュールがある場合も表示） */}
                {routeProposals.length > 0 && (
                    <div className="mt-6">
                        <button
                            onClick={handleAddSchedule}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            スケジュールを追加
                        </button>
                    </div>
                )}
            </div>

            {/* モーダル */}
            {viewMode === 'modal' && (
                <RouteProposalModal
                    onClose={() => {
                        setViewMode('list');
                        setSelectedDate('');
                        if (typeof window !== 'undefined') {
                            window.history.replaceState({}, '', window.location.pathname);
                        }
                    }}
                    onConfirm={handleModalConfirm}
                    selectedDate={selectedDate}
                />
            )}
        </div>
    );
}
