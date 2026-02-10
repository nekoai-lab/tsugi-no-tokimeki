"use client";

import { X, Heart } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

interface ImageViewerProps {
    imageUrl: string;
    caption?: string;
    onClose: () => void;
    // 追加: 投稿者情報とファボ
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
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={onClose}
        >
            {/* 閉じるボタン */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
            >
                <X className="w-6 h-6" />
            </button>

            {/* 画像（中央配置） */}
            <div className="flex-1 flex items-center justify-center p-4">
                <img
                    src={imageUrl}
                    alt={caption || ''}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* 下部: 投稿者情報・コメント・ファボ */}
            <div 
                className="bg-gradient-to-t from-black via-black/90 to-transparent pt-6 pb-8 px-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 投稿者名 + ハンドル */}
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-white font-bold text-base">{displayName}</p>
                        {handle && (
                            <p className="text-white/60 text-sm">@{handle}</p>
                        )}
                    </div>

                    {/* ファボボタン */}
                    {onToggleLike && (
                        <button
                            onClick={onToggleLike}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 active:scale-95 transition-transform"
                        >
                            <Heart
                                className={`w-5 h-5 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
                            />
                            <span className="text-white text-sm font-bold">{likesCount}</span>
                        </button>
                    )}
                </div>

                {/* コメント（全文表示） */}
                {caption && (
                    <p className="text-white/90 text-sm mt-2 leading-relaxed">{caption}</p>
                )}
            </div>
        </div>
    );
}
