"use client";

import React from 'react';
import { Pencil } from 'lucide-react';

interface ConditionSummaryCardProps {
    characters: string[];
    areas: string[];
    shops: string[];
    stickerTypes: string[];
    startTime: string;
    endTime: string;
    onEdit: () => void;
}

function formatList(items: string[], max = 3): string {
    if (!items || items.length === 0) return '未設定';
    if (items.length <= max) return items.join('、');
    return `${items.slice(0, max).join('、')} 他${items.length - max}件`;
}

interface RowProps {
    icon: string;
    label: string;
    value: string;
}

function ConditionRow({ icon, label, value }: RowProps) {
    return (
        <div className="flex items-start gap-2 py-1.5">
            <span className="text-sm flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500">{label}</span>
                <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
            </div>
        </div>
    );
}

export default function ConditionSummaryCard({
    characters,
    areas,
    shops,
    stickerTypes,
    startTime,
    endTime,
    onEdit,
}: ConditionSummaryCardProps) {
    const timeDisplay = startTime && endTime ? `${startTime}〜${endTime}` : '未設定';

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-700">📝 検索条件</h3>
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                    編集
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 py-2 divide-y divide-gray-50">
                <ConditionRow
                    icon="🎀"
                    label="お気に入りキャラ"
                    value={formatList(characters)}
                />
                <ConditionRow
                    icon="📍"
                    label="エリア"
                    value={formatList(areas)}
                />
                <ConditionRow
                    icon="🏪"
                    label="よく行くお店"
                    value={formatList(shops)}
                />
                <ConditionRow
                    icon="🏷️"
                    label="欲しいシールの種類"
                    value={formatList(stickerTypes)}
                />
                <ConditionRow
                    icon="⏰"
                    label="指定時間"
                    value={timeDisplay}
                />
            </div>
        </div>
    );
}

