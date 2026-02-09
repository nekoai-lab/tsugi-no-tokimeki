"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { StickerAlbumPost } from '@/lib/types';

interface StickerPostHorizontalListProps {
    posts: StickerAlbumPost[];
}

export default function StickerPostHorizontalList({ posts }: StickerPostHorizontalListProps) {
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentIndexRef = useRef(0);

    // 4秒ごとに自動スクロール（Hooksは早期リターンの前に呼び出す必要がある）
    useEffect(() => {
        if (posts.length <= 1) return;

        const interval = setInterval(() => {
            if (!scrollContainerRef.current) return;

            currentIndexRef.current = (currentIndexRef.current + 1) % posts.length;
            const cardWidth = 256 + 12; // w-64 (256px) + gap-3 (12px)
            const containerWidth = scrollContainerRef.current.clientWidth;
            
            // カードを画面の中央に配置するためのスクロール位置を計算
            const scrollPosition = (currentIndexRef.current * cardWidth) - (containerWidth / 2) + (cardWidth / 2);

            scrollContainerRef.current.scrollTo({
                left: Math.max(0, scrollPosition), // 負の値にならないように
                behavior: 'smooth',
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [posts.length]);

    if (posts.length === 0) {
        return null;
    }

    const handleCardClick = (post: StickerAlbumPost) => {
        // stickerBookIdはuserIdとして扱う（各ユーザーが1つのシール帳を持つ想定）
        // ただし、現在の実装では全ユーザーの投稿が1つのコレクションにあるため、
        // シール帳ページでpostIdでフィルタリングする
        const postId = post.id;
        router.push(`/sticker-book?postId=${postId}`);
    };

    return (
        <div className="w-full">
            <h3 className="text-sm font-bold text-gray-500 mb-3 px-1">シール帳の最新投稿</h3>
            <div 
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide -mx-4 px-4"
            >
                <div className="flex gap-3 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => handleCardClick(post)}
                            className="flex-shrink-0 w-64 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            {/* 画像のみ */}
                            <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
                                <img
                                    src={post.imageUrl}
                                    alt={post.caption || 'シール帳の写真'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

