"use client";

import { X, Heart } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

interface ImageViewerProps {
    imageUrl: string;
    caption?: string;
    onClose: () => void;
    userProfile?: UserProfile | null;
    likesCount?: number;
    isLiked?: boolean;
    onToggleLike?: () => void;
}

export default function ImageViewer({ 
    imageUrl, 
    caption, 
    onClose,
    userProfile,
    likesCount = 0,
    isLiked = false,
    onToggleLike
}: ImageViewerProps) {
    const displayName = userProfile?.displayName || '名無しさん';
    const handle = userProfile?.handle;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col overflow-hidden"
            onClick={onClose}
        >
            {/* 背景: 画像ブラー */}
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover scale-110"
                    style={{ filter: 'blur(30px)' }}
                />
                {/* 暗くするオーバーレイ */}
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* ノイズ/キラ粒オーバーレイ（世界観演出） */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* 閉じるボタン */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/30 backdrop-blur-sm text-white/90 hover:text-white hover:bg-black/50 z-20 transition-all"
            >
                <X className="w-5 h-5" />
            </button>

            {/* メイン画像（中央配置、角丸、影付き） */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <img
                    src={imageUrl}
                    alt={caption || ''}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    style={{ maxHeight: 'calc(100vh - 200px)' }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* 下部グラデーション + 情報シート */}
            <div 
                className="absolute bottom-0 left-0 right-0 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* グラデーション背景（高さ40%） */}
                <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-8 px-5">
                    {/* 投稿者名 + ハンドル */}
                    <div className="mb-2">
                        <p className="text-white font-bold text-lg drop-shadow-lg">{displayName}</p>
                        {handle && (
                            <p className="text-white/70 text-sm drop-shadow-md">@{handle}</p>
                        )}
                    </div>

                    {/* コメント（2行まで） */}
                    {caption && (
                        <p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-md mt-2">
                            {caption}
                        </p>
                    )}
                </div>
            </div>

            {/* 右下: ファボボタン（ピル型、浮いてる感じ） */}
            {onToggleLike && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike();
                    }}
                    className="absolute bottom-24 right-5 z-20 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-all hover:bg-white/25"
                >
                    <Heart
                        className={`w-5 h-5 transition-all ${isLiked ? 'fill-pink-500 text-pink-500 scale-110' : 'text-white'}`}
                    />
                    <span className="text-white text-sm font-bold">{likesCount}</span>
                </button>
            )}
        </div>
    );
}
