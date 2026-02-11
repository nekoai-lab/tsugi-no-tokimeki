"use client";

import React from 'react';
import { Loader2, Sparkles, Clock, MapPin, Store } from 'lucide-react';
import { generateRouteOverview } from '@/lib/googleMaps';
import type { Shop } from '@/lib/types';

interface TodayRouteHeroCardProps {
  areas: string[];
  totalTravelTime: number;
  shops: Shop[];
  startTime?: string;   // 開始時間（例: "10:00"）
  endTime?: string;     // 終了時間（例: "18:00"）
  onViewRoute: () => void;
  generating?: boolean;
  hasRoute: boolean;
}

/**
 * For You トップに表示する「今日のときめきルート」ヒーローカード
 * 
 * デザイン要素:
 * - リボン付きタイトル「今日のときめきルート」
 * - エリア + 時間帯 + 総活動時間
 * - 見つけ確率バッジ（ダミー）
 * - ルート概要（A → B → C）
 * - 店舗数・移動時間の詳細
 * - 「ルートを見る」メインボタン
 */
export default function TodayRouteHeroCard({
  areas,
  totalTravelTime,
  shops,
  startTime,
  endTime,
  onViewRoute,
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

  // 総活動時間を計算（店舗数 × 滞在時間30分 + 移動時間）
  const shopCount = shops.filter(s => s.category === 'shop' || !s.category).length;
  const totalActivityTime = shopCount * 30 + totalTravelTime;

  // 時間帯表示
  const timeRangeDisplay = startTime && endTime ? `${startTime}〜${endTime}` : null;
  
  // エリア表示（複数エリアの場合は結合）
  const areaDisplay = areas.length > 0 
    ? (areas.length > 2 ? `${areas[0]}・${areas[1]} 他` : areas.join('・'))
    : 'エリア未設定';

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
          <div className="flex-1 space-y-2">
            {/* エリア */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-500" />
              <span className="text-lg font-bold text-gray-800">{areaDisplay}</span>
            </div>

            {/* 時間帯 + 総活動時間 */}
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-pink-400" />
              {timeRangeDisplay ? (
                <span className="font-medium">
                  {timeRangeDisplay}
                  <span className="text-gray-400 ml-1">（約{formatDuration(totalActivityTime)}）</span>
                </span>
              ) : (
                <span className="font-medium">{formatDuration(totalActivityTime)}コース</span>
              )}
            </div>

            {/* 店舗数・移動時間 */}
            {hasRoute && shops.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {shopCount}店舗
                </span>
                <span>移動 {formatDuration(totalTravelTime)}</span>
              </div>
            )}

            {/* 見つけ確率バッジ */}
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              ✨ 発見確率 {probability}%
            </div>

            {/* ルート概要 */}
            <div className="text-sm text-gray-600 leading-relaxed pt-1">
              {generating ? (
                <span className="text-gray-400">ルート生成中...</span>
              ) : hasRoute ? (
                <span className="font-medium">{routeOverview}</span>
              ) : (
                <span className="text-gray-400">ルートを準備中...</span>
              )}
            </div>
          </div>

          {/* 右側: 地図サムネプレースホルダー */}
          <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center flex-shrink-0 border border-pink-200 overflow-hidden self-center">
            {/* 簡易地図プレースホルダー */}
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-pink-50">
                {/* 地図風の装飾 */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute top-5 right-3 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 bg-pink-400 rounded-full"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></div>
                {/* 線で結ぶ */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <path
                    d="M 20 20 L 70 35 L 25 60 L 80 80"
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
        <div className="mt-4">
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
        </div>
      </div>
    </div>
  );
}

