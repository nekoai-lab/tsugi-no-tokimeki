"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { subscribeStickerAlbumPosts, deleteStickerAlbumPost, addLikeToStickerPost, removeLikeFromStickerPost } from '@/lib/stickerAlbumService';
import { getUserProfile } from '@/lib/userService';
import { MoreVertical, Trash2, Heart, MessageCircle } from 'lucide-react';
import ImageViewer from '@/components/ImageViewer';
import type { StickerAlbumPost, UserProfile } from '@/lib/types';

function StickerCard({ 
    post, 
    onTap, 
    onMenuTap, 
    onToggleLike,
    isOwner, 
    isHighlighted,
    isLiked,
    userProfile
}: {
    post: StickerAlbumPost;
    onTap: () => void;
    onMenuTap: (e: React.MouseEvent) => void;
    onToggleLike: (e: React.MouseEvent) => void;
    isOwner: boolean;
    isHighlighted?: boolean;
    isLiked: boolean;
    userProfile?: UserProfile | null;
}) {
    const [loaded, setLoaded] = useState(false);
    const [showCaption, setShowCaption] = useState(false);

    const likesCount = post.likes?.length || 0;
    const displayName = userProfile?.displayName || '名無しさん';
    const handle = userProfile?.handle;

    return (
        <div
            className={`relative overflow-hidden shadow-lg cursor-pointer transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${isHighlighted ? 'ring-4 ring-pink-500 ring-offset-2' : ''}`}
            style={{ borderRadius: 16 }}
            onClick={() => {
                if (post.caption) {
                    setShowCaption(!showCaption);
                }
            }}
        >
            {/* 写真 */}
            <img
                src={post.imageUrl}
                alt={post.caption || 'sticker photo'}
                className="w-full h-auto block"
                onLoad={() => setLoaded(true)}
            />

            {/* 左下: 投稿者情報オーバーレイ */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-16 pb-3 px-3">
                <p className="text-white font-bold text-sm drop-shadow-lg line-clamp-1">{displayName}</p>
                {handle && (
                    <p className="text-white/80 text-xs drop-shadow-lg line-clamp-1">@{handle}</p>
                )}
            </div>

            {/* 右側: アクションボタン（縦配置） */}
            <div className="absolute right-3 bottom-20 flex flex-col gap-4 items-center">
                {/* ❤️ お気に入り */}
                <button
                    onClick={onToggleLike}
                    className="flex flex-col items-center gap-0.5 drop-shadow-lg"
                >
                    <Heart
                        className={`w-7 h-7 ${isLiked ? 'fill-pink-500 text-pink-500' : 'text-white'}`}
                    />
                    {likesCount > 0 && (
                        <span className="text-white text-xs font-bold">{likesCount}</span>
                    )}
                </button>

                {/* 💬 コメント（将来用） */}
                <button
                    className="flex flex-col items-center gap-0.5 opacity-50 cursor-not-allowed drop-shadow-lg"
                    disabled
                >
                    <MessageCircle className="w-7 h-7 text-white" />
                </button>
            </div>

            {/* 右上: 削除メニュー（自分の投稿のみ） */}
            {isOwner && (
                <button
                    onClick={onMenuTap}
                    className="absolute top-3 right-3 p-1.5 bg-black/30 rounded-full backdrop-blur-sm drop-shadow-lg"
                >
                    <MoreVertical className="w-4 h-4 text-white" />
                </button>
            )}

            {/* キャプション（タップで表示） */}
            {post.caption && showCaption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3 animate-in slide-in-from-bottom-2 duration-200">
                    <p className="text-white text-sm line-clamp-2">{post.caption}</p>
                </div>
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
    const [userMap, setUserMap] = useState<Record<string, UserProfile>>({});
    const menuRef = useRef<HTMLDivElement>(null);
    const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        const unsubscribe = subscribeStickerAlbumPosts((newPosts) => {
            setPosts(newPosts);
        });
        return () => unsubscribe();
    }, []);

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
                    {posts.map((post) => {
                        const isLiked = post.likes?.includes(user?.uid || '') || false;
                        const authorProfile = post.authorUid ? userMap[post.authorUid] : null;

                        return (
                            <div
                                key={post.id}
                                ref={(el) => { postRefs.current[post.id] = el; }}
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
                                    onToggleLike={(e) => handleToggleLike(post.id, e)}
                                    isOwner={user?.uid === post.userId}
                                    isHighlighted={highlightedPostId === post.id}
                                    isLiked={isLiked}
                                    userProfile={authorProfile}
                                />
                                {/* 削除メニュー */}
                                {menuPostId === post.id && (
                                    <div
                                        ref={menuRef}
                                        className="absolute top-14 right-2 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden"
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
