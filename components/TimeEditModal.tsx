"use client";

import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface TimeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (startTime: string, endTime: string) => void;
    initialStartTime: string;
    initialEndTime: string;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00 ~ 22:00

export default function TimeEditModal({
    isOpen,
    onClose,
    onSave,
    initialStartTime,
    initialEndTime,
}: TimeEditModalProps) {
    const [startHour, setStartHour] = useState(10);
    const [endHour, setEndHour] = useState(18);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStartHour(initialStartTime ? parseInt(initialStartTime.split(':')[0]) : 10);
            setEndHour(initialEndTime ? parseInt(initialEndTime.split(':')[0]) : 18);
        }
    }, [isOpen, initialStartTime, initialEndTime]);

    if (!isOpen) return null;

    const isValid = startHour < endHour;

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);
        try {
            const start = `${String(startHour).padStart(2, '0')}:00`;
            const end = `${String(endHour).padStart(2, '0')}:00`;
            await onSave(start, end);
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
                    <h3 className="font-bold text-lg">指定時間を設定</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Time Pickers */}
                <div className="p-5 space-y-6">
                    {/* Start Time */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 開始時刻
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                            {HOURS.map(h => (
                                <button
                                    key={h}
                                    onClick={() => setStartHour(h)}
                                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                        startHour === h
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {h}:00
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* End Time */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 終了時刻
                        </label>
                        <div className="grid grid-cols-6 gap-1.5">
                            {HOURS.map(h => (
                                <button
                                    key={h}
                                    onClick={() => setEndHour(h)}
                                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                        endHour === h
                                            ? 'bg-pink-500 text-white'
                                            : h <= startHour
                                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    disabled={h <= startHour}
                                >
                                    {h}:00
                                </button>
                            ))}
                        </div>
                    </div>

                    {!isValid && (
                        <p className="text-sm text-red-500">終了時刻は開始時刻より後にしてください</p>
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
                        disabled={saving || !isValid}
                        className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
