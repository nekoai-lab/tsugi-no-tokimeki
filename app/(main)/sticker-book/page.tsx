"use client";

import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { subscribeStickerAlbumPosts, deleteStickerAlbumPost } from '@/lib/stickerAlbumService';
import { MoreVertical, Trash2 } from 'lucide-react';
import ImageViewer from '@/components/ImageViewer';
import type { StickerAlbumPost } from '@/lib/types';

function StickerCard({ post, onTap, onMenuTap, isOwner }: {
    post: StickerAlbumPost;
    onTap: () => void;
    onMenuTap: (e: React.MouseEvent) => void;
    isOwner: boolean;
}) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className={`relative overflow-hidden shadow-md bg-white cursor-pointer transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ borderRadius: 12 }}
            onClick={onTap}
        >
            <img
                src={post.imageUrl}
                alt={post.caption || 'sticker photo'}
                className="w-full h-auto block"
                onLoad={() => setLoaded(true)}
            />
            {isOwner && (
                <button
                    onClick={onMenuTap}
                    className="absolute top-2 right-2 p-1.5 bg-black/30 rounded-full backdrop-blur-sm"
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>
            )}
            {post.caption && (
                <div className="px-3 py-2">
                    <p className="text-xs text-gray-700 line-clamp-2">{post.caption}</p>
                </div>
            )}
        </div>
    );
}

export default function StickerAlbumPage() {
    const { user } = useApp();
    const [posts, setPosts] = useState<StickerAlbumPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<StickerAlbumPost | null>(null);
    const [menuPostId, setMenuPostId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeStickerAlbumPosts((newPosts) => {
            setPosts(newPosts);
        });
        return () => unsubscribe();
    }, []);

    // メニュー外タップで閉じる
    useEffect(() => {
        if (!menuPostId) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuPostId(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [menuPostId]);

    const handleDelete = async (postId: string) => {
        if (!confirm('この写真を削除しますか？')) return;
        try {
            await deleteStickerAlbumPost(postId);
        } catch (error) {
            console.error('Delete error:', error);
        }
        setMenuPostId(null);
    };

    return (
        <div className="h-full flex flex-col">
            {posts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 text-sm">まだ写真がありません</p>
                    <p className="text-gray-400 text-xs mt-1">右下の＋ボタンから投稿しよう</p>
                </div>
            ) : (
                <div
                    className="flex-1 overflow-y-auto p-3 scrollable"
                    style={{ columnCount: 2, columnGap: 12 }}
                >
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="mb-3 relative"
                            style={{ breakInside: 'avoid' }}
                        >
                            <StickerCard
                                post={post}
                                onTap={() => setSelectedPost(post)}
                                onMenuTap={(e) => {
                                    e.stopPropagation();
                                    setMenuPostId(menuPostId === post.id ? null : post.id);
                                }}
                                isOwner={user?.uid === post.userId}
                            />
                            {/* 削除メニュー */}
                            {menuPostId === post.id && (
                                <div
                                    ref={menuRef}
                                    className="absolute top-10 right-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden"
                                >
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        削除
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* フルスクリーン表示 */}
            {selectedPost && (
                <ImageViewer
                    imageUrl={selectedPost.imageUrl}
                    caption={selectedPost.caption}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    );
}
