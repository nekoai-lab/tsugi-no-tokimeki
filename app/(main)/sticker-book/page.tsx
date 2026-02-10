"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { subscribeStickerAlbumPosts, deleteStickerAlbumPost, addLikeToStickerPost, removeLikeFromStickerPost } from '@/lib/stickerAlbumService';
import { MoreVertical, Trash2, Heart } from 'lucide-react';
import ImageViewer from '@/components/ImageViewer';
import type { StickerAlbumPost } from '@/lib/types';

function StickerCard({ 
    post, 
    onTap, 
    onMenuTap, 
    onToggleLike,
    isOwner, 
    isHighlighted,
    isLiked
}: {
    post: StickerAlbumPost;
    onTap: () => void;
    onMenuTap: (e: React.MouseEvent) => void;
    onToggleLike: (e: React.MouseEvent) => void;
    isOwner: boolean;
    isHighlighted?: boolean;
    isLiked: boolean;
}) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className={`relative overflow-hidden cursor-pointer transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${isHighlighted ? 'ring-4 ring-pink-500 ring-offset-2' : ''}`}
            style={{ borderRadius: 12 }}
            onClick={onTap}
        >
            {/* 写真（1:1比率、object-fit: cover） */}
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                <img
                    src={post.imageUrl}
                    alt={post.caption || 'sticker photo'}
                    className="w-full h-full object-cover"
                    onLoad={() => setLoaded(true)}
                />
            </div>

            {/* 右上: ♡ボタン */}
            <button
                onClick={onToggleLike}
                className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm drop-shadow-md active:scale-95 transition-transform"
            >
                <Heart
                    className={`w-5 h-5 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
                />
            </button>

            {/* 左上: 削除メニュー（自分の投稿のみ） */}
            {isOwner && (
                <button
                    onClick={onMenuTap}
                    className="absolute top-2 left-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm drop-shadow-md"
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>
            )}
        </div>
    );
}

export default function StickerAlbumPage() {
    const { user } = useApp();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<StickerAlbumPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<StickerAlbumPost | null>(null);
    const [menuPostId, setMenuPostId] = useState<string | null>(null);
    const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        const unsubscribe = subscribeStickerAlbumPosts((newPosts) => {
            setPosts(newPosts);
        });
        return () => unsubscribe();
    }, []);

    // postIdクエリパラメータから該当投稿をハイライト
    useEffect(() => {
        const postId = searchParams.get('postId');
        if (postId && posts.length > 0) {
            const targetPost = posts.find(p => p.id === postId);
            if (targetPost) {
                setHighlightedPostId(postId);
                setSelectedPost(targetPost);

                // 該当投稿までスクロール
                setTimeout(() => {
                    const element = postRefs.current[postId];
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // 3秒後にハイライトを解除
                        setTimeout(() => {
                            setHighlightedPostId(null);
                        }, 3000);
                    }
                }, 100);
            }
        }
    }, [searchParams, posts]);

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

    const handleToggleLike = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isLiked = post.likes?.includes(user.uid);
        try {
            if (isLiked) {
                await removeLikeFromStickerPost(postId, user.uid);
            } else {
                await addLikeToStickerPost(postId, user.uid);
            }
        } catch (error) {
            console.error('Like toggle error:', error);
        }
    };

    return (
        <div className="min-h-full">
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-gray-500 text-sm">まだ写真がありません</p>
                    <p className="text-gray-400 text-xs mt-1">右下の＋ボタンから投稿しよう</p>
                </div>
            ) : (
                <div className="p-2">
                    <div className="grid grid-cols-2 gap-2">
                        {posts.map((post) => {
                            const isLiked = post.likes?.includes(user?.uid || '') || false;

                            return (
                                <div
                                    key={post.id}
                                    ref={(el) => { postRefs.current[post.id] = el; }}
                                    className="relative"
                                >
                                    <StickerCard
                                        post={post}
                                        onTap={() => setSelectedPost(post)}
                                        onMenuTap={(e) => {
                                            e.stopPropagation();
                                            setMenuPostId(menuPostId === post.id ? null : post.id);
                                        }}
                                        onToggleLike={(e) => handleToggleLike(post.id, e)}
                                        isOwner={user?.uid === post.userId}
                                        isHighlighted={highlightedPostId === post.id}
                                        isLiked={isLiked}
                                    />
                                    {/* 削除メニュー */}
                                    {menuPostId === post.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute top-12 left-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden"
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
                            );
                        })}
                    </div>
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
