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
    likesCount = 0,
    isLiked = false,
    onToggleLike
}: ImageViewerProps) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black"
            onClick={onClose}
        >
            {/* 写真：フルスクリーン（主役） */}
            <img
                src={imageUrl}
                alt={caption || ''}
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
            />

            {/* 上部グラデーション（閉じるボタン用） */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

            {/* 閉じるボタン */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-20 transition-colors"
            >
                <X className="w-6 h-6 drop-shadow-lg" />
            </button>

            {/* 下部グラデーション（キャプション用） */}
            {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent pt-12 pb-6 px-5 pointer-events-none">
                    <p className="text-white text-base leading-relaxed line-clamp-1 drop-shadow-lg">
                        {caption}
                    </p>
                </div>
            )}

            {/* 右下: ♡ボタン（写真の一部として、控えめに） */}
            {onToggleLike && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike();
                    }}
                    className="absolute bottom-6 right-5 z-20 p-2.5 rounded-full bg-black/20 backdrop-blur-sm active:scale-90 transition-transform"
                >
                    <Heart
                        className={`w-6 h-6 drop-shadow-lg ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-white/80'}`}
                    />
                    {likesCount > 0 && (
                        <span className="absolute -bottom-1 -right-1 text-white text-[10px] font-bold bg-black/40 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                            {likesCount}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}

