"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
    error?: string;
    minDate?: string; // YYYY-MM-DD format
}

export function CustomDatePicker({
    label,
    value,
    onChange,
    error,
    minDate,
}: CustomDatePickerProps) {
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

    // YYYY-MM-DDをYYYY/MM/DDに変換
    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '/');
    };

    // 現在選択されている年月
    const currentDate = value ? new Date(value) : new Date();
    const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());
    const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());

    // カレンダーの日付配列を生成
    const generateCalendarDays = () => {
        const firstDay = new Date(displayYear, displayMonth, 1);
        const lastDay = new Date(displayYear, displayMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: (number | null)[] = [];

        // 月初の空白
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // 月の日付
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handleDateSelect = (day: number) => {
        const selectedDate = new Date(displayYear, displayMonth, day);
        const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // minDateチェック
        if (minDate && dateStr < minDate) {
            return;
        }

        onChange(dateStr);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        if (displayMonth === 0) {
            setDisplayMonth(11);
            setDisplayYear(displayYear - 1);
        } else {
            setDisplayMonth(displayMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (displayMonth === 11) {
            setDisplayMonth(0);
            setDisplayYear(displayYear + 1);
        } else {
            setDisplayMonth(displayMonth + 1);
        }
    };

    const isDateDisabled = (day: number) => {
        if (!minDate) return false;
        const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return dateStr < minDate;
    };

    const isSelectedDate = (day: number) => {
        if (!value) return false;
        const selected = new Date(value);
        return selected.getFullYear() === displayYear &&
               selected.getMonth() === displayMonth &&
               selected.getDate() === day;
    };

    const calendarDays = generateCalendarDays();
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <div className="relative" ref={pickerRef}>
            <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>

            {/* 選択されている日付の表示ボタン */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full p-2.5 rounded-xl border text-left
                    transition-all flex items-center justify-between bg-gray-50
                    ${error
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 hover:border-pink-300 focus:border-pink-500'
                    }
                `}
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                        {value ? formatDateDisplay(value) : '日付を選択'}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
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

            {/* カレンダーピッカー */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-pink-300 rounded-xl shadow-2xl overflow-hidden">
                    {/* 月切り替えヘッダー */}
                    <div className="bg-pink-50 py-3 px-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-pink-100 rounded transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="font-bold text-gray-700">
                            {displayYear}年 {monthNames[displayMonth]}
                        </div>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-pink-100 rounded transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                        {dayNames.map((day, idx) => (
                            <div
                                key={idx}
                                className={`text-center py-2 text-xs font-bold ${
                                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* カレンダーグリッド */}
                    <div className="grid grid-cols-7 p-2">
                        {calendarDays.map((day, idx) => {
                            if (day === null) {
                                return <div key={`empty-${idx}`} className="aspect-square" />;
                            }

                            const disabled = isDateDisabled(day);
                            const selected = isSelectedDate(day);
                            const dayOfWeek = idx % 7;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => !disabled && handleDateSelect(day)}
                                    disabled={disabled}
                                    className={`
                                        aspect-square flex items-center justify-center text-sm rounded-lg
                                        transition-colors
                                        ${selected
                                            ? 'bg-pink-500 text-white font-bold'
                                            : disabled
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'hover:bg-pink-50'
                                        }
                                        ${!selected && !disabled && dayOfWeek === 0 ? 'text-red-500' : ''}
                                        ${!selected && !disabled && dayOfWeek === 6 ? 'text-blue-500' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
