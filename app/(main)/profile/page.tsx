"use client";

import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { Bell, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userProfile, signOut } = useApp();

    const notificationEnabled = userProfile?.notificationPreferences?.enabled && !!userProfile?.lineUserId;

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="font-bold text-lg">My Profile</h1>
                    <p className="text-xs text-gray-500">ID: {user?.uid?.slice(0, 6)}...</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => router.push('/notification-settings')}
                        className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-pink-500" />
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-900">通知設定</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {notificationEnabled ? '通知ON' : '通知OFF'}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <button
                    onClick={signOut}
                    className="w-full py-3 text-red-500 font-bold bg-red-50 rounded-xl mt-8"
                >
                    ログアウト
                </button>
            </div>
        </div>
    );
}
