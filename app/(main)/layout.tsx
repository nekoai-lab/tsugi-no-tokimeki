"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { BookOpen, Plus } from 'lucide-react';
import NavButton from '@/components/NavButton';
import { Sparkles, Home, User } from 'lucide-react';
import PostModal from '@/components/PostModal';
import StickerAlbumPostModal from '@/components/StickerAlbumPostModal';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showPostModal, setShowPostModal] = useState(false);
    const [showStickerModal, setShowStickerModal] = useState(false);
    const { user, userProfile, loading, isModalOpen } = useApp();
    const router = useRouter();
    const pathname = usePathname();

    // 認証チェックとリダイレクト処理を共通化
    useEffect(() => {
        if (!loading && user && !userProfile) {
            router.push('/onboarding');
        }
    }, [loading, user, userProfile, router]);

    // ローディング中または未認証の場合はローディング画面を表示
    if (loading || !user || !userProfile) {
        return (
            <div className="flex min-h-[100dvh] h-[100dvh] w-full items-center justify-center bg-white">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 text-pink-500 animate-bounce">✨</div>
                    <p className="mt-4 text-pink-400 font-bold text-sm tracking-widest">LOADING...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] h-[100dvh] bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
            {/* Header - モーダル表示中は非表示 */}
            {!isModalOpen && (
                <header className="bg-white/80 backdrop-blur-md px-4 py-4 pt-safe sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Tsugi no Tokimeki
                    </h1>
                    <div className="flex items-center gap-3">
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 scrollable">
                {children}
            </main>

            {/* Floating Action Button for Post - Feedタブのみ表示 */}
            {!isModalOpen && pathname === '/feed' && (
                <button
                    onClick={() => setShowPostModal(true)}
                    className="absolute right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20"
                    style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 16px))' }}
                >
                    <Plus className="w-7 h-7" />
                </button>
            )}

            {/* Floating Action Button for Sticker Album - シール帳タブのみ表示 */}
            {!isModalOpen && pathname === '/sticker-book' && (
                <button
                    onClick={() => setShowStickerModal(true)}
                    className="absolute right-4 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-20"
                    style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 16px))' }}
                >
                    <Plus className="w-7 h-7" />
                </button>
            )}

            {/* Bottom Navigation - モーダル表示中は非表示 */}
            {!isModalOpen && (
                <nav
                    className="absolute w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-20"
                    style={{ bottom: 'env(safe-area-inset-bottom, 0px)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
                >
                    <NavButton href="/home" icon={Sparkles} label="For You" />
                    <NavButton href="/feed" icon={Home} label="Feed" />
                    <NavButton href="/sticker-book" icon={BookOpen} label="シール帳" />
                    <NavButton href="/profile" icon={User} label="Profile" />
                </nav>
            )}

            {/* Post Modal Overlay */}
            {showPostModal && (
                <PostModal onClose={() => setShowPostModal(false)} />
            )}

            {/* Sticker Album Post Modal */}
            {showStickerModal && (
                <StickerAlbumPostModal onClose={() => setShowStickerModal(false)} />
            )}

        </div>
    );
}

