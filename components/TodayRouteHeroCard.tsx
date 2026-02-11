"use client";

import React from 'react';
import { Loader2, Pencil, Sparkles } from 'lucide-react';
import { generateRouteOverview } from '@/lib/googleMaps';
import type { Shop } from '@/lib/types';

interface TodayRouteHeroCardProps {
  areas: string[];
  totalTravelTime: number;
  shops: Shop[];
  onViewRoute: () => void;
  onRegenerate: () => void;
  generating?: boolean;
  hasRoute: boolean;
}

/**
 * For You トップに表示する「今日のときめきルート」ヒーローカード
 * 
 * デザイン要素:
 * - リボン付きタイトル「今日のときめきルート」
 * - エリア + 所要時間コース
 * - 見つけ確率バッジ（ダミー）
 * - ルート概要（A → B → C）
 * - 地図サムネ（プレースホルダー）
 * - 「ルートを見る」メインボタン
 * - 「再生成する」サブボタン
 */
export default function TodayRouteHeroCard({
  areas,
  totalTravelTime,
  shops,
  onViewRoute,
  onRegenerate,
  generating = false,
  hasRoute,
}: TodayRouteHeroCardProps) {
  // 所要時間を「X時間」形式に変換
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}時間`;
    return `${hours}時間${mins}分`;
  };

  // エリア表示
  const areaDisplay = areas.length > 0 ? areas[0] : 'エリア未設定';
  const durationDisplay = formatDuration(totalTravelTime);

  // ルート概要
  const routeOverview = generateRouteOverview(shops, 3);

  // 見つけ確率（ダミー値 - 将来的にはAIで計算）
  const probability = 78;

  return (
    <div className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 rounded-2xl border-2 border-pink-200 shadow-lg overflow-hidden">
      {/* キラキラ装飾（CSS） */}
      <div className="absolute top-2 right-3 text-pink-300">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="absolute top-8 right-8 text-pink-200">
        <Sparkles className="w-3 h-3" />
      </div>

      {/* リボン風タイトル */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-4 -mx-0.5 -mt-0.5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎀</span>
          <h2 className="font-bold text-lg tracking-wide">今日のときめきルート</h2>
        </div>
      </div>

      {/* カード本体 */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* 左側: 情報 */}
          <div className="flex-1 space-y-3">
            {/* エリア + 時間 */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800">📍 {areaDisplay}</span>
              <span className="text-gray-500 font-medium">{durationDisplay}コース</span>
            </div>

            {/* 見つけ確率バッジ */}
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
              発見確率 {probability}%
            </div>

            {/* ルート概要 */}
            <div className="text-sm text-gray-600 leading-relaxed">
              {generating ? (
                <span className="text-gray-400">ルート生成中...</span>
              ) : hasRoute ? (
                routeOverview
              ) : (
                <span className="text-gray-400">ルートを準備中...</span>
              )}
            </div>
          </div>

          {/* 右側: 地図サムネプレースホルダー */}
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center flex-shrink-0 border border-pink-200 overflow-hidden">
            {/* 簡易地図プレースホルダー */}
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-pink-50">
                {/* 地図風の装飾 */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute top-6 right-4 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></div>
                {/* 線で結ぶ */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <path
                    d="M 20 15 L 75 30 L 30 65 L 85 85"
                    stroke="#f472b6"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4,2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="mt-4 space-y-2">
          {/* メインボタン: ルートを見る */}
          <button
            onClick={onViewRoute}
            disabled={generating || !hasRoute}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AIがルートを生成中...
              </>
            ) : (
              'ルートを見る'
            )}
          </button>

          {/* サブボタン: 再生成する */}
          <div className="flex justify-end">
            <button
              onClick={onRegenerate}
              disabled={generating}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors disabled:opacity-50"
            >
              再生成する
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

