"use client";

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selected: string[], customItems: string[]) => void;
    title: string;
    options: string[];
    initialSelected: string[];
    initialCustomItems: string[];
    customPlaceholder: string;
    maxCustomItems?: number;
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    onSave,
    title,
    options,
    initialSelected,
    initialCustomItems,
    customPlaceholder,
    maxCustomItems = 10,
}: ProfileEditModalProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [customItems, setCustomItems] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelected([...initialSelected]);
            setCustomItems([...initialCustomItems]);
            setShowCustomInput(initialCustomItems.length > 0);
            setCustomInput('');
        }
    }, [isOpen, initialSelected, initialCustomItems]);

    if (!isOpen) return null;

    const toggleOption = (option: string) => {
        setSelected(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    const toggleOther = () => {
        setShowCustomInput(prev => !prev);
        if (showCustomInput) {
            setCustomInput('');
        }
    };

    const addCustomItem = () => {
        const trimmed = customInput.trim();
        if (trimmed && !customItems.includes(trimmed) && customItems.length < maxCustomItems) {
            setCustomItems(prev => [...prev, trimmed]);
            setCustomInput('');
        }
    };

    const removeCustomItem = (item: string) => {
        setCustomItems(prev => prev.filter(i => i !== item));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const finalCustom = [...customItems];
            if (customInput.trim() && !finalCustom.includes(customInput.trim()) && finalCustom.length < maxCustomItems) {
                finalCustom.push(customInput.trim());
            }
            await onSave(selected, finalCustom);
            onClose();
        } catch {
            alert('保存に失敗しました。再試行してください。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Options */}
                <div className="flex-1 overflow-y-auto p-5 space-y-2">
                    {options.map(option => {
                        const isSelected = selected.includes(option);
                        return (
                            <button
                                key={option}
                                onClick={() => toggleOption(option)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                    isSelected
                                        ? 'border-pink-500 bg-pink-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <span className={`text-sm font-medium ${isSelected ? 'text-pink-700' : 'text-gray-700'}`}>
                                    {option}
                                </span>
                                {isSelected && (
                                    <Check className="w-5 h-5 text-pink-500" />
                                )}
                            </button>
                        );
                    })}

                    {/* その他 */}
                    <button
                        onClick={toggleOther}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            showCustomInput
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                        <span className={`text-sm font-medium ${showCustomInput ? 'text-pink-700' : 'text-gray-700'}`}>
                            その他
                        </span>
                        {showCustomInput && (
                            <Check className="w-5 h-5 text-pink-500" />
                        )}
                    </button>

                    {showCustomInput && (
                        <div className="mt-3 space-y-2">
                            {/* Existing custom items */}
                            {customItems.map(item => (
                                <div key={item} className="flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
                                    <span className="flex-1 text-sm text-pink-700">{item}</span>
                                    <button
                                        onClick={() => removeCustomItem(item)}
                                        className="p-1 hover:bg-pink-100 rounded-full"
                                    >
                                        <X className="w-4 h-4 text-pink-400" />
                                    </button>
                                </div>
                            ))}
                            {/* Input for new custom item */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomItem();
                                        }
                                    }}
                                    placeholder={customPlaceholder}
                                    className="flex-1 px-3 py-2 border-2 border-pink-300 rounded-xl text-sm focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                                />
                                {customInput.trim() && (
                                    <button
                                        onClick={addCustomItem}
                                        className="px-3 py-2 bg-pink-100 text-pink-600 rounded-xl text-sm font-medium hover:bg-pink-200 transition-colors"
                                    >
                                        追加
                                    </button>
                                )}
                            </div>
                            {customItems.length >= maxCustomItems && (
                                <p className="text-xs text-gray-400">カスタム項目は最大{maxCustomItems}件までです</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || (selected.length === 0 && customItems.length === 0 && !customInput.trim())}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
