"use client";

import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { CHARACTERS, AREAS, PREFERRED_SHOPS, STICKER_TYPES, TIME_SLOTS } from '@/lib/utils';

interface ConditionEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ConditionData) => Promise<void>;
    initialData: ConditionData;
}

export interface ConditionData {
    characters: string[];
    areas: string[];
    shops: string[];
    stickerTypes: string[];
    startTime: string;
    endTime: string;
}

interface SectionProps {
    title: string;
    icon: string;
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
    maxDisplay?: number;
}

function SelectionSection({ title, icon, options, selected, onToggle, maxDisplay = 6 }: SectionProps) {
    const [expanded, setExpanded] = useState(false);
    const displayOptions = expanded ? options : options.slice(0, maxDisplay);
    const hasMore = options.length > maxDisplay;

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span>{icon}</span>
                {title}
            </h4>
            <div className="flex flex-wrap gap-2">
                {displayOptions.map((option) => {
                    const isSelected = selected.includes(option);
                    return (
                        <button
                            key={option}
                            onClick={() => onToggle(option)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                    ? 'bg-pink-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {option}
                        </button>
                    );
                })}
            </div>
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="w-3 h-3" />
                            閉じる
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3" />
                            もっと見る（残り{options.length - maxDisplay}件）
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default function ConditionEditModal({
    isOpen,
    onClose,
    onSave,
    initialData,
}: ConditionEditModalProps) {
    const [characters, setCharacters] = useState<string[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const [shops, setShops] = useState<string[]>([]);
    const [stickerTypes, setStickerTypes] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('18:00');
    const [saving, setSaving] = useState(false);

    // 初期データをセット
    useEffect(() => {
        if (isOpen) {
            setCharacters(initialData.characters || []);
            setAreas(initialData.areas || []);
            setShops(initialData.shops || []);
            setStickerTypes(initialData.stickerTypes || []);
            setStartTime(initialData.startTime || '10:00');
            setEndTime(initialData.endTime || '18:00');
        }
    }, [isOpen, initialData]);

    const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                characters,
                areas,
                shops,
                stickerTypes,
                startTime,
                endTime,
            });
            onClose();
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">検索条件を編集</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* キャラクター */}
                    <SelectionSection
                        title="お気に入りキャラ"
                        icon="🎀"
                        options={CHARACTERS}
                        selected={characters}
                        onToggle={(item) => toggleItem(characters, setCharacters, item)}
                    />

                    {/* エリア */}
                    <SelectionSection
                        title="エリア"
                        icon="📍"
                        options={AREAS}
                        selected={areas}
                        onToggle={(item) => toggleItem(areas, setAreas, item)}
                    />

                    {/* ショップ */}
                    <SelectionSection
                        title="よく行くお店"
                        icon="🏪"
                        options={PREFERRED_SHOPS}
                        selected={shops}
                        onToggle={(item) => toggleItem(shops, setShops, item)}
                    />

                    {/* シールの種類 */}
                    <SelectionSection
                        title="欲しいシールの種類"
                        icon="🏷️"
                        options={STICKER_TYPES}
                        selected={stickerTypes}
                        onToggle={(item) => toggleItem(stickerTypes, setStickerTypes, item)}
                    />

                    {/* 時間 */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <span>⏰</span>
                            指定時間
                        </h4>
                        <div className="flex items-center gap-3">
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <span className="text-gray-500">〜</span>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                            >
                                {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            '保存中...'
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                保存して閉じる
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}


