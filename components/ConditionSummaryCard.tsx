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

/**
 * サマリー文を生成
 * 優先順位: キャラ（最大2つ） → エリア（最大2つ） → 時間
 * 例: エンジェルブルー・たまごっち 他 / 大宮・新宿 / 10:00–18:00
 */
function buildSummary(
    characters: string[],
    areas: string[],
    startTime: string,
    endTime: string
): string {
    const parts: string[] = [];

    // キャラ（最大2つ + 他）
    if (characters.length > 0) {
        if (characters.length <= 2) {
            parts.push(characters.join('・'));
        } else {
            parts.push(`${characters.slice(0, 2).join('・')} 他`);
        }
    }

    // エリア（最大2つ + 他）
    if (areas.length > 0) {
        if (areas.length <= 2) {
            parts.push(areas.join('・'));
        } else {
            parts.push(`${areas.slice(0, 2).join('・')} 他`);
        }
    }

    // 時間
    if (startTime && endTime) {
        parts.push(`${startTime}–${endTime}`);
    }

    if (parts.length === 0) {
        return '条件が設定されていません';
    }

    return parts.join(' / ');
}

export default function ConditionSummaryCard({
    characters,
    areas,
    startTime,
    endTime,
    onEdit,
}: ConditionSummaryCardProps) {
    const summary = buildSummary(characters, areas, startTime, endTime);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* ヘッダー + サマリー */}
            <div className="p-3">
                {/* 見出し行 */}
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-bold text-gray-700">📝 検索条件</h3>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                    >
                        編集
                        <Pencil className="w-3 h-3" />
                    </button>
                </div>

                {/* サマリー（最大2行） */}
                <p className="text-sm text-gray-600 leading-snug line-clamp-2">
                    {summary}
                </p>
            </div>
        </div>
    );
}
