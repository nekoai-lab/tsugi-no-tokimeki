"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { ArrowLeft, Bell, Sun, Sunset, MapPin } from 'lucide-react';
import { AREAS, NOTIFICATION_TIMES } from '@/lib/utils';

type AreaMode = 'profile' | 'all_tokyo';

export default function NotificationSettingsPage() {
    const router = useRouter();
    const { user, userProfile } = useApp();

    const [enabled, setEnabled] = useState(false);
    const [areaMode, setAreaMode] = useState<AreaMode>('profile');
    const [morningNotification, setMorningNotification] = useState(true);
    const [eveningNotification, setEveningNotification] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile?.notificationPreferences) {
            const prefs = userProfile.notificationPreferences;
            setEnabled(prefs.enabled);
            
            // 新形式の設定を読み込み
            if (prefs.morningNotification !== undefined) {
                setMorningNotification(prefs.morningNotification);
            } else {
                // 旧形式からの移行: morning or afternoon があれば朝通知ON
                setMorningNotification(
                    prefs.timeSlots?.includes('morning') || 
                    prefs.timeSlots?.includes('afternoon') || 
                    true
                );
            }
            
            if (prefs.eveningNotification !== undefined) {
                setEveningNotification(prefs.eveningNotification);
            } else {
                // 旧形式からの移行: evening or night があれば夕方通知ON
                setEveningNotification(
                    prefs.timeSlots?.includes('evening') || 
                    prefs.timeSlots?.includes('night') || 
                    false
                );
            }

            // エリアモード
            const savedAreas = prefs.areas || [];
            if (savedAreas.length === AREAS.length && AREAS.every(a => savedAreas.includes(a))) {
                setAreaMode('all_tokyo');
            } else {
                setAreaMode('profile');
            }
        }
    }, [userProfile?.notificationPreferences]);

    const getNotificationAreas = (): string[] => {
        if (areaMode === 'all_tokyo') {
            return [...AREAS];
        }
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
                    morningNotification,
                    eveningNotification,
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
                    LINE通知設定
                </h1>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollable">
                {/* LINE未連携の警告 */}
                {!hasLineUserId && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800 font-medium">
                            ⚠️ LINE連携が必要です
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                            通知を受け取るには、プロフィール画面からLINE連携を行ってください
                        </p>
                    </div>
                )}

                {/* Master Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-800">プッシュ通知</p>
                        <p className="text-xs text-gray-500">シール情報をLINEで受け取る</p>
                    </div>
                    <button
                        onClick={() => setEnabled(!enabled)}
                        disabled={!hasLineUserId}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                            enabled ? 'bg-pink-500' : 'bg-gray-300'
                        } ${!hasLineUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                                enabled ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {/* 通知タイミング */}
                <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                    <p className="font-bold text-sm text-gray-700 mb-3">通知タイミング</p>
                    <div className="space-y-3">
                        {/* 朝の通知 */}
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Sun className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {NOTIFICATION_TIMES.morning.label}
                                            <span className="text-pink-500 ml-2 text-sm font-normal">
                                                {NOTIFICATION_TIMES.morning.time}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {NOTIFICATION_TIMES.morning.description}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMorningNotification(!morningNotification)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        morningNotification ? 'bg-pink-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            morningNotification ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* 夕方の通知 */}
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Sunset className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {NOTIFICATION_TIMES.evening.label}
                                            <span className="text-pink-500 ml-2 text-sm font-normal">
                                                {NOTIFICATION_TIMES.evening.time}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {NOTIFICATION_TIMES.evening.description}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEveningNotification(!eveningNotification)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${
                                        eveningNotification ? 'bg-pink-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            eveningNotification ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* エリア選択 */}
                <div className={enabled ? '' : 'opacity-40 pointer-events-none'}>
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <p className="font-bold text-sm text-gray-700">通知を受け取るエリア</p>
                    </div>
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
                                設定中のエリアのみ
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

                {/* 説明 */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        💡 <strong>朝の通知</strong>では、あなたのエリアの直近の目撃情報と、今日のおすすめルートをお届けします。
                        <br /><br />
                        🌆 <strong>夕方の通知</strong>では、今日1日の目撃情報をまとめてお届けします。
                    </p>
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
