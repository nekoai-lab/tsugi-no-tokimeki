"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, Bell, Info } from 'lucide-react';
import { AREAS, NOTIFICATION_TIME_SLOTS } from '@/lib/utils';
import type { TimeSlotKey } from '@/lib/types';

type AreaMode = 'profile' | 'all_tokyo';

export default function NotificationSettingsPage() {
    const router = useRouter();
    const { user, userProfile } = useApp();

    const [enabled, setEnabled] = useState(false);
    const [areaMode, setAreaMode] = useState<AreaMode>('profile');
    const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlotKey[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile?.notificationPreferences) {
            setEnabled(userProfile.notificationPreferences.enabled);
            setSelectedTimeSlots(userProfile.notificationPreferences.timeSlots || []);

            // 保存されたエリアがAREAS全件と一致するなら「東京全域」
            const savedAreas = userProfile.notificationPreferences.areas || [];
            if (savedAreas.length === AREAS.length && AREAS.every(a => savedAreas.includes(a))) {
                setAreaMode('all_tokyo');
            } else {
                setAreaMode('profile');
            }
        }
    }, [userProfile?.notificationPreferences]);

    const toggleTimeSlot = (key: TimeSlotKey) => {
        setSelectedTimeSlots(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const getNotificationAreas = (): string[] => {
        if (areaMode === 'all_tokyo') {
            return [...AREAS];
        }
        // プロフィールのエリア設定を使用
        const profileAreas = userProfile?.areas && userProfile.areas.length > 0
            ? userProfile.areas
            : (userProfile?.area ? [userProfile.area] : []);
        return profileAreas;
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
            await updateDoc(profileRef, {
                notificationPreferences: {
                    enabled,
                    areas: getNotificationAreas(),
                    timeSlots: selectedTimeSlots,
                },
            });
            router.back();
        } catch (error) {
            console.error('Notification settings save error:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    const hasLineUserId = !!userProfile?.lineUserId;

    const profileAreaDisplay = (() => {
        const areas = userProfile?.areas && userProfile.areas.length > 0
            ? userProfile.areas
            : (userProfile?.area ? [userProfile.area] : []);
        return areas.length > 0 ? areas.join('、') : '未設定';
    })();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-shrink-0">
                <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="font-bold text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-pink-500" />
                    通知設定
                </h1>
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
                        LINE連携していない方は通知が届きません。プロフィールからLINE連携してください。
                    </p>
                </div>

                {/* Area Selection - 2択 */}
                <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                    <p className="font-bold text-sm text-gray-700 mb-2">通知を受け取るエリア</p>
                    <div className="space-y-2">
                        <button
                            onClick={() => setAreaMode('profile')}
                            className={`w-full p-4 rounded-xl text-left transition-colors border-2 ${
                                areaMode === 'profile'
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <p className={`font-bold text-sm ${areaMode === 'profile' ? 'text-pink-600' : 'text-gray-800'}`}>
                                現在設定しているエリアのみ
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {profileAreaDisplay}
                            </p>
                        </button>
                        <button
                            onClick={() => setAreaMode('all_tokyo')}
                            className={`w-full p-4 rounded-xl text-left transition-colors border-2 ${
                                areaMode === 'all_tokyo'
                                    ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <p className={`font-bold text-sm ${areaMode === 'all_tokyo' ? 'text-pink-600' : 'text-gray-800'}`}>
                                東京全域
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {AREAS.join('、')}
                            </p>
                        </button>
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
    );
}
