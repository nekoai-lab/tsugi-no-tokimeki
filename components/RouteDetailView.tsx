"use client";

import React from 'react';
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react';
import type { RouteProposal } from '@/lib/types';
import { WEEKDAYS } from '@/lib/utils';

interface RouteDetailViewProps {
    proposal: RouteProposal;
    onBack: () => void;
    onConfirm?: () => void;
    onRequestAnother?: () => void;
}

export default function RouteDetailView({
    proposal,
    onBack,
    onConfirm,
    onRequestAnother,
}: RouteDetailViewProps) {
    const date = new Date(proposal.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS[date.getDay()]})`;

    const formatTimeRange = () => {
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

    const getAreasDisplay = () => {
        if (proposal.areas && proposal.areas.length > 0) {
            return proposal.areas.join('、');
        }
        // 古いデータ構造のフォールバック
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
                        {proposal.confirmed && (
                            <div className="mt-2 flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-bold">✅確定済み</span>
                            </div>
                        )}
                    </div>

                    {/* Shops List */}
                    <div className="space-y-4">
                        {proposal.shops.map((shop, index) => (
                            <div key={shop.id}>
                                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-pink-100 text-pink-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-bold text-gray-800">{shop.time}</span>
                                                <span className="text-sm font-bold text-gray-700">{shop.name}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{shop.description}</p>
                                            {shop.travelTimeFromPrevious ? (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <MapPin className="w-3 h-3" />
                                                    前の店から徒歩{shop.travelTimeFromPrevious}分
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
                                            ↓ 徒歩{proposal.shops[index + 1].travelTimeFromPrevious || 0}分
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-blue-800">
                            💡 効率的に{proposal.shops.length}店舗回れます！
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!proposal.confirmed && (onConfirm || onRequestAnother) && (
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {onConfirm && (
                        <button
                            onClick={onConfirm}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            このルートで行く！
                        </button>
                    )}
                    {onRequestAnother && (
                        <button
                            onClick={onRequestAnother}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                        >
                            別の提案をもらう
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

