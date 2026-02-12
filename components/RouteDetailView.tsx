"use client";

import React from 'react';
import { ArrowLeft, MapPin, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import type { RouteProposal } from '@/lib/types';
import { WEEKDAYS } from '@/lib/utils';
import { generateGoogleMapsUrl } from '@/lib/googleMaps';

// シンプルなMarkdownレンダラー
function renderMarkdown(text: string) {
    return text
        .split('\n')
        .map((line, index) => {
            // 見出し ### を処理
            if (line.startsWith('### ')) {
                return (
                    <h3 key={index} className="font-bold text-sm text-blue-800 mt-3 mb-1">
                        {line.replace(/^### /, '')}
                    </h3>
                );
            }
            // 見出し ## を処理
            if (line.startsWith('## ')) {
                return (
                    <h2 key={index} className="font-bold text-base text-blue-900 mt-3 mb-2">
                        {line.replace(/^## /, '')}
                    </h2>
                );
            }
            // 見出し # を処理
            if (line.startsWith('# ')) {
                return (
                    <h1 key={index} className="font-bold text-lg text-blue-900 mt-3 mb-2">
                        {line.replace(/^# /, '')}
                    </h1>
                );
            }
            // 箇条書き - を処理
            if (line.startsWith('- ')) {
                return (
                    <li key={index} className="ml-4 text-xs text-blue-700">
                        {line.replace(/^- /, '• ')}
                    </li>
                );
            }
            // 箇条書き * を処理
            if (line.startsWith('* ')) {
                return (
                    <li key={index} className="ml-4 text-xs text-blue-700">
                        {line.replace(/^\* /, '• ')}
                    </li>
                );
            }
            // 太字 **text** を処理
            const boldRegex = /\*\*(.*?)\*\*/g;
            if (boldRegex.test(line)) {
                const parts = line.split(boldRegex);
                return (
                    <p key={index} className="text-xs text-blue-700 mb-1">
                        {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
                    </p>
                );
            }
            // 空行
            if (line.trim() === '') {
                return <br key={index} />;
            }
            // 通常のテキスト
            return (
                <p key={index} className="text-xs text-blue-700 mb-1">
                    {line}
                </p>
            );
        });
}

interface RouteDetailViewProps {
    proposal: RouteProposal;
    onBack: () => void;
    onRegenerate?: () => void;
    onConfirm?: () => void;
}

export default function RouteDetailView({
    proposal,
    onBack,
    onRegenerate,
    onConfirm,
}: RouteDetailViewProps) {
    const date = new Date(proposal.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;

    const formatTimeRange = () => {
        if (proposal.startTime && proposal.endTime) {
            return `${proposal.startTime}〜${proposal.endTime}`;
        }
        if (proposal.timeSlot) {
            const timeSlotLabel = { morning: '午前', afternoon: '午後', allday: '1日中' }[proposal.timeSlot];
            return timeSlotLabel;
        }
        return '時間未設定';
    };

    const getAreasDisplay = () => {
        if (proposal.areas && proposal.areas.length > 0) {
            return proposal.areas.join('、');
        }
        if (proposal.area) {
            return proposal.area;
        }
        return 'エリア未設定';
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="font-bold text-lg">{dateStr}のルート</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {/* Route Summary */}
                    <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-5 h-5 text-pink-500" />
                            <span className="font-bold text-pink-900">{getAreasDisplay()}エリア</span>
                        </div>
                        <div className="space-y-1 mb-2">
                            {(proposal.stickerType || proposal.stickerDesign) && (
                                <div className="text-sm text-pink-700">
                                    <span className="font-bold">シール:</span> {proposal.stickerType || '未設定'}・{proposal.stickerDesign || '未設定'}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-pink-600" />
                                <span className="text-sm text-pink-700">{formatTimeRange()}（合計移動時間: {proposal.totalTravelTime}分）</span>
                            </div>
                            {proposal.preferredShops && proposal.preferredShops.length > 0 && (
                                <div className="text-xs text-pink-600">
                                    希望店舗: {proposal.preferredShops.join('、')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Shops List */}
                    <div className="space-y-4">
                        {proposal.shops.map((shop, index) => {
                            // カテゴリーに応じたスタイル
                            const getCategoryStyle = () => {
                                switch (shop.category) {
                                    case 'lunch':
                                        return {
                                            bg: 'bg-orange-50',
                                            border: 'border-orange-200',
                                            badgeBg: 'bg-orange-100',
                                            badgeText: 'text-orange-600',
                                            icon: '🍽️',
                                            label: 'ランチ'
                                        };
                                    case 'cafe':
                                        return {
                                            bg: 'bg-amber-50',
                                            border: 'border-amber-200',
                                            badgeBg: 'bg-amber-100',
                                            badgeText: 'text-amber-600',
                                            icon: '☕',
                                            label: 'お茶'
                                        };
                                    case 'dinner':
                                        return {
                                            bg: 'bg-indigo-50',
                                            border: 'border-indigo-200',
                                            badgeBg: 'bg-indigo-100',
                                            badgeText: 'text-indigo-600',
                                            icon: '🍴',
                                            label: 'ディナー'
                                        };
                                    default:
                                        return {
                                            bg: 'bg-white',
                                            border: 'border-gray-100',
                                            badgeBg: 'bg-pink-100',
                                            badgeText: 'text-pink-600',
                                            icon: '🛍️',
                                            label: 'ショップ'
                                        };
                                }
                            };

                            const style = getCategoryStyle();

                            return (
                                <div key={shop.id}>
                                    <div className={`${style.bg} rounded-xl p-4 border ${style.border} shadow-sm`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`${style.badgeBg} ${style.badgeText} rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                                {shop.category && shop.category !== 'shop' ? style.icon : index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1 flex-nowrap">
                                                    <span className="font-bold text-gray-800 flex-shrink-0">{shop.time}</span>
                                                    <span className="text-sm font-bold text-gray-700 truncate">{shop.name}</span>
                                                    {shop.category && shop.category !== 'shop' && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${style.badgeBg} ${style.badgeText}`}>
                                                            {style.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{shop.description}</p>
                                                {shop.travelTimeFromPrevious ? (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3" />
                                                        前の店から{shop.travelMode === 'train' ? '電車' : '徒歩'}{shop.travelTimeFromPrevious}分
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <MapPin className="w-3 h-3" />
                                                        {getAreasDisplay()}エリア
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow between shops */}
                                    {index < proposal.shops.length - 1 && (
                                        <div className="flex justify-center py-2">
                                            <div className="text-xs text-gray-400 font-bold">
                                                ↓ {proposal.shops[index + 1].travelMode === 'train' ? '🚃 電車' : '🚶‍♀️ 徒歩'}{proposal.shops[index + 1].travelTimeFromPrevious || 0}分
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-blue-800 font-bold mb-2">
                            💡 効率的に{proposal.shops.length}店舗回れます！
                        </p>
                        {proposal.supplementaryInfo && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-xs font-bold text-blue-700 mb-2">📝 補足情報</p>
                                <div className="leading-relaxed">
                                    {renderMarkdown(proposal.supplementaryInfo)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-100 space-y-3">
                {/* Googleマップで開くボタン - Primary */}
                {proposal.shops.length > 0 && (
                    <a
                        href={generateGoogleMapsUrl(proposal.shops)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Googleマップで開く
                    </a>
                )}

                {/* Confirm Button */}
                {onConfirm && (
                    <button
                        onClick={onConfirm}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        ✓ このルートで行く
                    </button>
                )}

                {/* Regenerate Button */}
                {onRegenerate && (
                    <button
                        onClick={onRegenerate}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        このルートを再生成する
                    </button>
                )}
            </div>
        </div>
    );
}
