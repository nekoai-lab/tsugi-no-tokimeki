"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { MapPin, Clock, Calendar as CalendarIcon, Search, Route } from 'lucide-react';
import type { Suggestion, UserProfile } from '@/lib/types';

export default function ForYouScreen() {
    const { suggestions, userProfile } = useApp();
    const router = useRouter();

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
        switch (decision) {
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

            {/* 4. Route Proposal Button */}
            <section>
                <button
                    onClick={() => router.push('/calendar?add=true')}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                    <Route className="w-5 h-5" />
                    今日のルートを提案してもらう
                </button>
            </section>
        </div>
    );
}
