"use client";

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { getRelativeTime } from '@/lib/utils';
import { Heart, MapPin, Map } from 'lucide-react';

export default function FeedScreen() {
    const { posts, userProfile } = useApp();

    return (
        <div className="pb-4">
            {/* Filters (Mock) */}
            <div className="px-4 py-3 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto">
                <button className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium whitespace-nowrap">全て</button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1">
                    <Heart className="w-3 h-3" /> お気に入り
                </button>
                <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1">
                    <Map className="w-3 h-3" /> {userProfile?.area || 'エリア'}
                </button>
            </div>

            {/* Feed List */}
            <div className="divide-y divide-gray-100">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        まだ投稿がありません。<br />最初の情報をシェアしよう！
                    </div>
                ) : (
                    posts.map(post => (
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
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
