"use client";

import React, { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { WEEKDAYS } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';

export default function CalendarScreen() {
    const { userProfile } = useApp();

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
                    const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;

                    return (
                        <div key={i} className={`rounded-xl p-4 border transition-all ${available
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
                                        空き時間: {(userProfile?.availability[date.getDay().toString()] || []).join(', ')}
                                    </div>

                                    {/* Mock matched event */}
                                    {i % 3 === 0 && (
                                        <div className="mt-2 bg-pink-50 rounded-lg p-2 text-xs border border-pink-100 flex gap-2 items-start">
                                            <Sparkles className="w-3 h-3 text-pink-500 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-gray-800">再販の可能性アリ</p>
                                                <p className="text-gray-500">{userProfile?.area}エリア周辺で動きがありそうです</p>
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
}
