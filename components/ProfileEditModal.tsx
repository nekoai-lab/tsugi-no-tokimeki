"use client";

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selected: string[]) => void;
    title: string;
    options: string[];
    initialSelected: string[];
}

export default function ProfileEditModal({
    isOpen,
    onClose,
    onSave,
    title,
    options,
    initialSelected,
}: ProfileEditModalProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelected([...initialSelected]);
        }
    }, [isOpen, initialSelected]);

    if (!isOpen) return null;

    const toggleOption = (option: string) => {
        setSelected(prev =>
            prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(selected);
            onClose();
        } catch {
            alert('保存に失敗しました。再試行してください。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-lg">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Options */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || selected.length === 0}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
