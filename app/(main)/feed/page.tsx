"use client";

import { useState, useMemo, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { getRelativeTime } from '@/lib/utils';
import { addLike, removeLike } from '@/lib/postService';
import { Heart, MapPin, Newspaper } from 'lucide-react';
import type { Post, UserProfile } from '@/lib/types';

type StatusFilter = 'all' | 'seen' | 'soldout';

interface UserProfileMap {
    [uid: string]: { displayName: string; handle: string };
}

export default function FeedPage() {
    const { posts, user, userProfile } = useApp();
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
    const [userMap, setUserMap] = useState<UserProfileMap>({});

    // 投稿者プロフィールを取得
    useEffect(() => {
        const fetchUserProfiles = async () => {
            // authorUidを持つ投稿からユニークなuidを抽出
            const authorUids = [...new Set(
                posts
                    .filter(p => p.authorUid)
                    .map(p => p.authorUid!)
            )];

            if (authorUids.length === 0) return;

            // 並列取得
            const profilePromises = authorUids.map(async (uid) => {
                try {
                    const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
                    const profileSnap = await getDoc(profileRef);
                    
                    if (profileSnap.exists()) {
                        const data = profileSnap.data() as UserProfile;
                        return {
                            uid,
                            displayName: data.displayName || '名無しさん',
                            handle: data.handle || '',
                        };
                    }
                } catch (error) {
                    console.error(`Failed to fetch profile for ${uid}:`, error);
                }
                return { uid, displayName: '名無しさん', handle: '' };
            });

            const profiles = await Promise.all(profilePromises);
            
            // userMapを作成
            const newUserMap: UserProfileMap = {};
            profiles.forEach(profile => {
                newUserMap[profile.uid] = {
                    displayName: profile.displayName,
                    handle: profile.handle,
                };
            });
            
            setUserMap(newUserMap);
        };

        fetchUserProfiles();
    }, [posts]);

    // FOR YOU用: 直近48時間 + お気に入りキャラの投稿
    // NOTE: 将来的に投稿数が増えたらFirestoreクエリ（複合インデックス必要）に変更を検討
    // query(where('createdAt', '>=', timestamp), where('character', 'in', favorites))
    const basePosts = useMemo(() => {
        if (!userProfile?.favorites || userProfile.favorites.length === 0) {
            return [];
        }

        const now = new Date();
        const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        return posts.filter(post => {
            if (!post.createdAt) return false;
            
            const postDate = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
            const is48h = postDate >= hours48Ago;
            const isFavorite = userProfile.favorites.includes(post.character);
            
            return is48h && isFavorite;
        });
    }, [posts, userProfile]);

    // キャラ別集計
    const characterSummary = useMemo(() => {
        const counts: Record<string, number> = {};
        basePosts.forEach(post => {
            counts[post.character] = (counts[post.character] || 0) + 1;
        });
        
        // 件数でソートして上位3つ
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    }, [basePosts]);

    const filteredPosts = useMemo(() => {
        let result = posts;
        
        // ステータスフィルタ
        if (filter === 'seen') result = result.filter(p => p.status !== 'soldout');
        if (filter === 'soldout') result = result.filter(p => p.status === 'soldout');
        
        // キャラフィルタ（selectedCharacterがある場合）
        if (selectedCharacter) {
            result = result.filter(p => p.character === selectedCharacter);
        }
        
        // 日時順にソート（新しい順）
        result = [...result].sort((a, b) => {
            // postDate + postTime の組み合わせで比較
            const getDateTime = (post: Post) => {
                if (!post.postDate) return 0;
                
                const dateStr = post.postDate;
                const timeStr = post.postTime || '00:00';
                
                // "その他"は00:00として扱う
                const time = timeStr === 'その他' ? '00:00' : timeStr;
                
                return new Date(`${dateStr}T${time}`).getTime();
            };
            
            return getDateTime(b) - getDateTime(a); // 降順（新しい順）
        });
        
        return result;
    }, [posts, filter, selectedCharacter]);

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
            {/* FOR YOU Card */}
            {basePosts.length > 0 && (
                <section className="p-4 animate-in fade-in duration-500">
                    <div className="rounded-3xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold opacity-80 uppercase tracking-wider">FOR YOU（2日以内）</span>
                            </div>

                            {/* サマリ行 */}
                            <p className="text-base font-bold mb-3">
                                {characterSummary.map(([char, count], idx) => (
                                    <span key={char}>
                                        {char} {count}件{idx < characterSummary.length - 1 ? ' / ' : ''}
                                    </span>
                                ))}
                            </p>

                            {/* キャラチップ */}
                            <div className="flex flex-wrap gap-2">
                                {characterSummary.map(([char, count]) => (
                                    <button
                                        key={char}
                                        onClick={() => setSelectedCharacter(selectedCharacter === char ? null : char)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                            selectedCharacter === char
                                                ? 'bg-white text-pink-600 shadow-md'
                                                : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                                        }`}
                                    >
                                        {char} {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Decorative Background */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                </section>
            )}

            {/* HIT LIST Card */}
            {topPosts.length > 0 && (
                <section className="px-4 pb-4 animate-in fade-in duration-500">
                    <div className="rounded-3xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Newspaper className="w-5 h-5" />
                                <span className="text-sm font-bold opacity-80 uppercase tracking-wider">HIT LIST</span>
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
                    filteredPosts.map(post => {
                        // 投稿者情報を取得
                        const authorInfo = post.authorUid ? userMap[post.authorUid] : null;
                        const displayName = authorInfo?.displayName || '不明';
                        const handle = authorInfo?.handle || '';

                        return (
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
                                            // postTimeがあればそれを使用、なければpostDateから時間を抽出
                                            const timeDisplay = post.postTime || 
                                                `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
                                            return `${month}/${day} ${timeDisplay}`;
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

                            {/* 投稿者情報（小さく表示） */}
                            {post.authorUid && (
                                <div className="mt-1 text-xs text-gray-400">
                                    <span className="font-medium">{displayName}</span>
                                    {handle && (
                                        <span className="ml-2">{handle}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                    })
                )}
            </div>
        </div>
    );
}
