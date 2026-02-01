"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { UseFormSetValue } from 'react-hook-form';
import type { RouteProposalFormData } from '@/lib/routeProposalTypes';

interface CustomTimePickerProps {
    name: 'startTime' | 'endTime';
    label: string;
    error?: string;
    formValues: RouteProposalFormData;
    setValue: UseFormSetValue<RouteProposalFormData>;
}

export function CustomTimePicker({
    name,
    label,
    error,
    formValues,
    setValue,
}: CustomTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // 外側クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // 時間と分のオプション（1時間単位）
    // 00:00-04:00と23:00は除外
    const hours = Array.from({ length: 24 }, (_, i) => i).filter(h => h >= 5 && h <= 22);
    const minutes = [0]; // 1時間単位なので0分のみ

    const currentValue = formValues[name] || (name === 'startTime' ? '10:00' : '15:00');
    const [hour] = currentValue.split(':');
    const selectedHour = parseInt(hour) || 10;
    const selectedMinute = 0; // 1時間単位なので常に0分

    const handleTimeChange = (newHour: number, newMinute: number) => {
        const formattedTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
        setValue(name, formattedTime, { shouldValidate: true });
    };

    return (
        <div className="relative" ref={pickerRef}>
            <label className="text-sm font-bold text-gray-700 mb-2 block">{label}</label>

            {/* 選択されている時間の表示ボタン */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-3 rounded-xl border-2 text-left
                    transition-all flex items-center justify-between
                    ${error
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 hover:border-pink-300 focus:border-pink-500'
                    }
                `}
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-bold">
                        {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
            )}

            {/* ピッカー */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-pink-300 rounded-xl shadow-2xl overflow-hidden">
                    <div className="flex h-64">
                        {/* 時のみ（1時間単位） */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="sticky top-0 bg-pink-50 py-2 text-center text-sm font-bold text-gray-600 border-b border-gray-200">
                                時
                            </div>
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleTimeChange(h, 0)}
                                    className={`
                                        w-full py-3 text-center transition-colors
                                        ${selectedHour === h && selectedMinute === 0
                                            ? 'bg-pink-500 text-white font-bold'
                                            : 'hover:bg-pink-50'
                                        }
                                    `}
                                >
                                    {String(h).padStart(2, '0')}:00
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 完了ボタン */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3 bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors"
                    >
                        完了
                    </button>
                </div>
            )}
        </div>
    );
}

