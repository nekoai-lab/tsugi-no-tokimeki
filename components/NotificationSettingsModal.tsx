"use client";

import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { XCircle, Bell, Info } from 'lucide-react';
import { AREAS, NOTIFICATION_TIME_SLOTS } from '@/lib/utils';
import type { TimeSlotKey } from '@/lib/types';

interface NotificationSettingsModalProps {
    onClose: () => void;
}

export default function NotificationSettingsModal({ onClose }: NotificationSettingsModalProps) {
    const { user, userProfile } = useApp();

    const [enabled, setEnabled] = useState(false);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlotKey[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize from profile
    useEffect(() => {
        if (userProfile?.notificationPreferences) {
            setEnabled(userProfile.notificationPreferences.enabled);
            setSelectedAreas(userProfile.notificationPreferences.areas || []);
            setSelectedTimeSlots(userProfile.notificationPreferences.timeSlots || []);
        }
    }, [userProfile?.notificationPreferences]);

    // Area candidates from profile + defaults
    const areaCandidates = useMemo(() => {
        const profileAreas = userProfile?.areas && userProfile.areas.length > 0
            ? userProfile.areas
            : (userProfile?.area ? [userProfile.area] : []);
        const customAreas = userProfile?.customAreas || [];
        const seen = new Set<string>();
        const result: string[] = [];
        for (const a of [...profileAreas, ...AREAS, ...customAreas]) {
            if (!seen.has(a)) {
                seen.add(a);
                result.push(a);
            }
        }
        return result;
    }, [userProfile?.areas, userProfile?.area, userProfile?.customAreas]);

    const toggleArea = (area: string) => {
        setSelectedAreas(prev =>
            prev.includes(area)
                ? prev.filter(a => a !== area)
                : [...prev, area]
        );
    };

    const toggleTimeSlot = (key: TimeSlotKey) => {
        setSelectedTimeSlots(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await updateDoc(profileRef, {
                notificationPreferences: {
                    enabled,
                    areas: selectedAreas,
                    timeSlots: selectedTimeSlots,
                },
            });
            onClose();
        } catch (error) {
            console.error('Notification settings save error:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    const hasLineUserId = !!userProfile?.lineUserId;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-pink-500" />
                        通知設定
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollable">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-800">プッシュ通知</p>
                            <p className="text-xs text-gray-500">新しい目撃情報をLINEで受け取る</p>
                        </div>
                        <button
                            onClick={() => setEnabled(!enabled)}
                            className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-pink-500' : 'bg-gray-300'}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    {/* LINE Warning */}
                    <div className={`flex items-start gap-2 p-3 rounded-xl ${hasLineUserId ? 'bg-gray-50' : 'bg-pink-50 border border-pink-200'}`}>
                        <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${hasLineUserId ? 'text-gray-400' : 'text-pink-500'}`} />
                        <p className={`text-xs ${hasLineUserId ? 'text-gray-500' : 'text-pink-600 font-medium'}`}>
                            LINE連携していない方は通知が行きません。プロフィールからLINE連携してください。
                        </p>
                    </div>

                    {/* Area Selection */}
                    <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                        <p className="font-bold text-sm text-gray-700 mb-2">通知を受け取るエリア</p>
                        <div className="grid grid-cols-3 gap-2">
                            {areaCandidates.map(area => (
                                <button
                                    key={area}
                                    onClick={() => toggleArea(area)}
                                    className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                                        selectedAreas.includes(area)
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time Slot Selection */}
                    <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                        <p className="font-bold text-sm text-gray-700 mb-2">通知を受け取る時間帯</p>
                        <div className="grid grid-cols-2 gap-2">
                            {NOTIFICATION_TIME_SLOTS.map(slot => (
                                <button
                                    key={slot.key}
                                    onClick={() => toggleTimeSlot(slot.key)}
                                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
                                        selectedTimeSlots.includes(slot.key)
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <span className="block font-bold">{slot.label}</span>
                                    <span className={`block text-xs mt-0.5 ${
                                        selectedTimeSlots.includes(slot.key) ? 'text-pink-100' : 'text-gray-400'
                                    }`}>{slot.range}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex-shrink-0 pb-safe">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
