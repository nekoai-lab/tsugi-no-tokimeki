"use client";

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getRelativeTime } from '@/lib/utils';
import { addLike, removeLike } from '@/lib/postService';
import { Heart, MapPin, Newspaper } from 'lucide-react';
import type { Post } from '@/lib/types';

type StatusFilter = 'all' | 'seen' | 'soldout';

export default function FeedPage() {
    const { posts, user } = useApp();
    const [filter, setFilter] = useState<StatusFilter>('all');

    const filteredPosts = useMemo(() => {
        if (filter === 'all') return posts;
        // 'seen' フィルタは seen と bought を含む（= soldout以外）
        if (filter === 'seen') return posts.filter(p => p.status !== 'soldout');
        return posts.filter(p => p.status === 'soldout');
    }, [posts, filter]);

    // いいね数でソートしたトップ3
    const topPosts = useMemo(() => {
        return [...posts]
            .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
            .slice(0, 3);
    }, [posts]);

    const handleToggleLike = async (post: Post) => {
        if (!user) return;
        const liked = post.likes?.includes(user.uid);
        if (liked) {
            await removeLike(post.id, user.uid);
        } else {
            await addLike(post.id, user.uid);
        }
    };

    const formatNewsLine = (post: Post) => {
        const area = post.areaMasked || 'エリア不明';
        const shop = post.shopName || '店舗不明';
        const character = post.character;
        const stickerType = post.stickerType;
        const statusText = post.status === 'soldout' ? '売り切れ' : 'あり';
        return `${area} ${shop} ${character} ${stickerType} ${statusText}`;
    };

    return (
        <div className="pb-4">
            {/* News Card */}
            {topPosts.length > 0 && (
                <section className="p-4 animate-in fade-in duration-500">
                    <div className="rounded-3xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Newspaper className="w-5 h-5" />
                                <span className="text-sm font-bold opacity-80 uppercase tracking-wider">News</span>
                            </div>

                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-3">
                                {topPosts.map((post) => (
                                    <p key={post.id} className="text-sm font-medium leading-snug flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                        {formatNewsLine(post)}
                                    </p>
                                ))}
                            </div>
                        </div>
                        {/* Decorative Background */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                </section>
            )}

            {/* Filters */}
            <div className="px-4 py-3 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto">
                {([['all', '全て'], ['seen', 'あった'], ['soldout', '売り切れ']] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            filter === key
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Feed List */}
            <div className="divide-y divide-gray-100">
                {filteredPosts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        まだ投稿がありません。<br />最初の情報をシェアしよう！
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <div key={post.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${post.status === 'soldout' ? 'bg-red-50 border-red-200 text-red-700' :
                                                'bg-blue-50 border-blue-200 text-blue-700'
                                        }`}>
                                        {post.status === 'soldout' ? '売り切れ' : 'あった'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">{post.character}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{getRelativeTime(post.createdAt)}</span>
                            </div>

                            <p className="text-sm text-gray-800 mb-2 leading-relaxed">{post.text}</p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                {post.postDate && (
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const dt = new Date(post.postDate);
                                            const month = dt.getMonth() + 1;
                                            const day = dt.getDate();
                                            const hours = dt.getHours().toString().padStart(2, '0');
                                            const minutes = dt.getMinutes().toString().padStart(2, '0');
                                            return `${month}/${day} ${hours}:${minutes}`;
                                        })()}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {post.areaMasked || 'エリア不明'}
                                </div>
                                {post.shopName && (
                                    <div className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                        {post.shopName}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {post.stickerType}
                                </div>

                                {/* Like Button */}
                                <button
                                    onClick={() => handleToggleLike(post)}
                                    className="flex items-center gap-1 ml-auto"
                                >
                                    <Heart
                                        className={`w-4 h-4 transition-colors ${
                                            user && post.likes?.includes(user.uid)
                                                ? 'fill-pink-500 text-pink-500'
                                                : 'text-gray-300 hover:text-pink-300'
                                        }`}
                                    />
                                    {(post.likes?.length || 0) > 0 && (
                                        <span className={`text-xs ${
                                            user && post.likes?.includes(user.uid) ? 'text-pink-500' : 'text-gray-400'
                                        }`}>
                                            {post.likes?.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
