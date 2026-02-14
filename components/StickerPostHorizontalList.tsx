"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, ChevronRight } from 'lucide-react';
import { getUserProfile } from '@/lib/userService';
import type { StickerAlbumPost, UserProfile } from '@/lib/types';

interface StickerPostHorizontalListProps {
    posts: StickerAlbumPost[];
}

export default function StickerPostHorizontalList({ posts }: StickerPostHorizontalListProps) {
    const router = useRouter();
    const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});

    // 投稿者情報を取得
    useEffect(() => {
        const authorUids = Array.from(new Set(posts.map(p => p.authorUid).filter(Boolean))) as string[];
        if (authorUids.length === 0) return;

        Promise.all(authorUids.map(uid => getUserProfile(uid)))
            .then(profiles => {
                const map: Record<string, UserProfile> = {};
                profiles.forEach((profile, idx) => {
                    if (profile) {
                        map[authorUids[idx]] = profile;
                    }
                });
                setUserMap(map);
            })
            .catch(err => console.error('Failed to fetch user profiles:', err));
    }, [posts]);

    if (posts.length === 0) {
        return null;
    }

    const handleCardClick = (post: StickerAlbumPost) => {
        const postId = post.id;
        router.push(`/sticker-book?postId=${postId}`);
    };

    const handleViewAll = () => {
        router.push('/sticker-book');
    };

    return (
        <div className="w-full">
            {/* ヘッダー: タイトル + すべて見る */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-gray-500">シール帳の最近の投稿</h3>
                <button
                    onClick={handleViewAll}
                    className="flex items-center gap-0.5 text-xs text-pink-500 hover:text-pink-600 font-medium transition-colors"
                >
                    すべて見る
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* 横スクロール棚 */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div
                    className="flex gap-3 pb-2"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {posts.map((post) => {
                        const authorProfile = post.authorUid ? userMap[post.authorUid] : null;
                        const handle = authorProfile?.handle?.replace(/^@/, '') || null;
                        const likesCount = post.likes?.length || 0;

                        return (
                            <div
                                key={post.id}
                                onClick={() => handleCardClick(post)}
                                className="flex-shrink-0 w-[45%] max-w-[160px] cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.98]"
                                style={{ scrollSnapAlign: 'start' }}
                            >
                                {/* カード本体 */}
                                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                                    {/* 画像 */}
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.caption || 'シール帳の写真'}
                                        fill
                                        sizes="(max-width: 768px) 45vw, 160px"
                                        className="object-cover"
                                    />

                                    {/* 下部オーバーレイ（情報） */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-6 pb-2 px-2">
                                        <div className="flex items-center justify-between">
                                            {/* 左: @handle */}
                                            <span className="text-white text-xs font-medium truncate max-w-[60%]">
                                                {handle ? `@${handle}` : '@user'}
                                            </span>

                                            {/* 右: ♥数 */}
                                            <div className="flex items-center gap-0.5 text-white">
                                                <Heart className="w-3 h-3" />
                                                <span className="text-xs font-medium">{likesCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
