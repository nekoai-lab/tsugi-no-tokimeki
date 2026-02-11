"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Bell, ChevronRight, Edit2, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import ProfileIconEditModal from '@/components/ProfileIconEditModal';
import ProfileNameEditModal from '@/components/ProfileNameEditModal';
import { updateProfile } from '@/lib/profileService';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userProfile, signOut, linkLine, isLinkingLine } = useApp();
    const [showIconModal, setShowIconModal] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);

    const displayName = userProfile?.displayName || '未設定';
    const photoUrl = userProfile?.photoUrl || '';
    const handle = userProfile?.handle || '未設定';
    // 表示用（@付き）
    const displayHandle = handle === '未設定' ? '@未設定' : `@${handle.replace(/^@/, '')}`;
    const supportId = userProfile?.supportId || user?.uid?.slice(0, 8) || '未設定';
    const notificationsEnabled = userProfile?.notificationsEnabled ?? (userProfile?.notificationPreferences?.enabled && !!userProfile?.lineUserId);
    const lineLinked = !!userProfile?.lineUserId;

    const handleIconSave = async (newPhotoUrl: string) => {
        if (!user) return;
        try {
            await updateProfile(user.uid, { photoUrl: newPhotoUrl });
        } catch (error) {
            console.error('Failed to save icon:', error);
            alert('アイコンの保存に失敗しました');
        }
    };

    const handleNameSave = async (newDisplayName: string, newHandle: string) => {
        if (!user) return;
        try {
            await updateProfile(user.uid, {
                displayName: newDisplayName,
                handle: newHandle,
            });
        } catch (error) {
            console.error('Failed to save name:', error);
            alert('名前の保存に失敗しました');
        }
    };

    return (
        <div className="p-6">
            {/* プロフィールヘッダー */}
            <div className="mb-8">
                <h1 className="font-bold text-xl mb-6">プロフィール</h1>

                {/* アイコン */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-pink-500">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="プロフィール画像"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-400">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowIconModal(true)}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-lg hover:bg-pink-600 transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {/* 表示名・ハンドルネーム */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
                    <button
                        onClick={() => setShowNameModal(true)}
                        className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <div className="text-left flex-1">
                            <p className="text-sm font-bold text-gray-900 mb-1">
                                {displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {displayHandle}
                            </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                </div>

                {/* ユーザーID（サポート用） */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1">ユーザーID（サポート用）</p>
                    <p className="text-sm font-mono text-gray-700">{supportId}</p>
                </div>
            </div>

            {/* 設定項目 */}
            <div className="space-y-4">
                {/* LINE通知 */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => router.push('/notification-settings')}
                        className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-pink-500" />
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-900">LINE通知</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {notificationsEnabled ? 'ON' : 'OFF'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* LINE連携 */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {lineLinked ? (
                        // 連携済み
                        <div className="w-full p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">LINE連携</p>
                                    <p className="text-xs text-green-600 mt-0.5">
                                        連携済み ✓
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 未連携 → ボタン表示
                        <button
                            onClick={linkLine}
                            disabled={isLinkingLine}
                            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                {isLinkingLine ? (
                                    <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">LINE連携</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {isLinkingLine ? '連携中...' : 'タップして連携する'}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-[#06C755] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                連携する
                            </div>
                        </button>
                    )}
                </div>
            </div>

            {/* ログアウト */}
            <button
                onClick={signOut}
                className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl mt-8"
            >
                ログアウト
            </button>

            {/* モーダル */}
            <ProfileIconEditModal
                isOpen={showIconModal}
                onClose={() => setShowIconModal(false)}
                onSave={handleIconSave}
                currentPhotoUrl={photoUrl}
            />

            <ProfileNameEditModal
                isOpen={showNameModal}
                onClose={() => setShowNameModal(false)}
                onSave={handleNameSave}
                currentDisplayName={displayName}
                currentHandle={handle.replace(/^@/, '')}
            />
        </div>
    );
}
