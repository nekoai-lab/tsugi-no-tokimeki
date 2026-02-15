"use client";

import { useState, useMemo, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { useApp } from '@/contexts/AppContext';
import { getRelativeTime } from '@/lib/utils';
import { pinPost, unpinPost } from '@/lib/postService';
import { Pin, MapPin } from 'lucide-react';
import type { Post, UserProfile } from '@/lib/types';
import PostDetailModal from '@/components/PostDetailModal';

type StatusFilter = 'all' | 'seen' | 'soldout' | 'pinned';

// 短縮表示用マップ（投稿一覧カードのみで使用）
const STORE_SHORT_LABEL_MAP: Record<string, string> = {
    "東急ハンズ": "ハンズ",
    "ドンキホーテ": "ドンキ",
    "LOFT": "ロフト",
    "PLAZA": "プラザ",
    "キデイランド": "キディ",
    "ビレッジバンガード": "ヴィレヴァン",
    "その他": "その他",
};

const TYPE_SHORT_LABEL_MAP: Record<string, string> = {
    "ボンボンドロップシール": "ボンドロ",
    "プチドロップシール": "プチドロ",
    "ウォーターシール": "ウォーター",
    "おはじきシール": "おはじき",
    "タイルシール": "タイル",
    "平面シール": "平面",
    "その他": "その他",
};

// 短縮表示用ヘルパー関数（マップ優先 → 末尾省略）
const getShortLabel = (value: string, map: Record<string, string>, maxLen = 10): string => {
    const label = map[value] ?? value;
    return label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;
};

interface UserProfileMap {
    [uid: string]: { displayName: string; handle: string };
}

export default function FeedPage() {
    const { posts, user, userProfile, pinnedPostIds, setIsModalOpen } = useApp();
    const [filter, setFilter] = useState<StatusFilter>('all');
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
    const [userMap, setUserMap] = useState<UserProfileMap>({});
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    // 投稿詳細モーダルを開く
    const openPostDetail = (post: Post) => {
        setSelectedPost(post);
        setIsModalOpen(true);
    };

    // 投稿詳細モーダルを閉じる
    const closePostDetail = () => {
        setSelectedPost(null);
        setIsModalOpen(false);
    };

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
            
            // Timestamp型の場合はtoDate()を使用
            const postDate = 'toDate' in post.createdAt && typeof post.createdAt.toDate === 'function'
                ? post.createdAt.toDate()
                : new Date(post.createdAt as any);
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
        if (filter === 'pinned') result = result.filter(p => pinnedPostIds.includes(p.id));
        
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
    }, [posts, filter, selectedCharacter, pinnedPostIds]);

    // basePostsの最新3件（TOPカードのリスト表示用）
    const topBasePosts = useMemo(() => {
        return basePosts.slice(0, 3);
    }, [basePosts]);

    // ムード文生成（1-3件の時のみ）
    const moodText = useMemo(() => {
        if (basePosts.length === 0 || basePosts.length > 3) return '';

        // 最頻キャラを取得
        const charCounts: Record<string, number> = {};
        basePosts.forEach(post => {
            charCounts[post.character] = (charCounts[post.character] || 0) + 1;
        });
        
        const topChar = Object.entries(charCounts).sort(([, a], [, b]) => b - a)[0];
        if (!topChar) return '';
        
        const [char, count] = topChar;
        
        // 1種類のみの場合
        if (Object.keys(charCounts).length === 1) {
            return `${char}の報告が続いてるよ`;
        }
        
        // 複数種類の場合
        return `${char}の報告が${count}件あるよ`;
    }, [basePosts]);

    const handleTogglePin = async (post: Post) => {
        if (!user) return;
        const isPinned = pinnedPostIds.includes(post.id);
        if (isPinned) {
            await unpinPost(user.uid, post.id);
        } else {
            await pinPost(user.uid, post.id);
        }
    };

    const formatNewsLine = (post: Post) => {
        const area = post.areaMasked || 'エリア不明';
        const shop = post.shopName ? getShortLabel(post.shopName, STORE_SHORT_LABEL_MAP) : '店舗不明';
        const character = post.character;
        const stickerType = getShortLabel(post.stickerType, TYPE_SHORT_LABEL_MAP);
        const statusText = post.status === 'soldout' ? '売り切れ' : 'あり';
        return `${area} ${shop} ${character} ${stickerType} ${statusText}`;
    };

    return (
        <div className="pb-4">
            {/* FOR YOU Card（統合版） */}
            <section className="p-4 animate-in fade-in duration-500">
                <div className="rounded-3xl p-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                    <div className="relative z-10">
                        {/* 見出し行 */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold opacity-80 uppercase tracking-wider">FOR YOU（2日以内）</span>
                            {/* 4件以上の場合のみ合計件数を表示 */}
                            {basePosts.length >= 4 && (
                                <span className="text-lg font-bold">{basePosts.length}件</span>
                            )}
                        </div>

                        {/* パターンA: 0件 */}
                        {basePosts.length === 0 && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-sm font-medium text-center">
                                    まだヒットがないよ。<br />見つけたら投稿してね
                                </p>
                            </div>
                        )}

                        {/* パターンB: 1-3件（少数） */}
                        {basePosts.length > 0 && basePosts.length <= 3 && (
                            <>
                                {/* ムード文 */}
                                {moodText && (
                                    <p className="text-base font-bold mb-3">{moodText}</p>
                                )}

                                {/* リスト表示 */}
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-3">
                                    {topBasePosts.map((post) => (
                                        <p key={post.id} className="text-sm font-medium leading-snug flex items-start gap-2">
                                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                            {formatNewsLine(post)}
                                        </p>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* パターンC: 4件以上（多数） */}
                        {basePosts.length >= 4 && (
                            <>
                                {/* キャラチップ */}
                                <div className="flex flex-wrap gap-2 mb-4">
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

                                {/* リスト表示 */}
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-3">
                                    {topBasePosts.map((post) => (
                                        <p key={post.id} className="text-sm font-medium leading-snug flex items-start gap-2">
                                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                            {formatNewsLine(post)}
                                        </p>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </section>

            {/* Filters */}
            <div className="px-4 py-3 bg-white border-b border-gray-50 flex gap-2 overflow-x-auto">
                {([['all', '全て'], ['seen', 'あった'], ['soldout', '売り切れ'], ['pinned', 'ピン']] as const).map(([key, label]) => (
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
                        const handle = authorInfo?.handle || '';

                        return (
                            <div 
                                key={post.id} 
                                onClick={() => openPostDetail(post)}
                                className="px-4 py-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                {/* 1行目: ステータス+キャラ vs @handle */}
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${post.status === 'soldout' ? 'bg-red-50 border-red-200 text-red-700' :
                                                    'bg-blue-50 border-blue-200 text-blue-700'
                                            }`}>
                                            {post.status === 'soldout' ? '売り切れ' : 'あった'}
                                        </span>
                                        <span className="text-sm font-bold text-gray-800">{post.character}</span>
                                    </div>
                                    {handle && (
                                        <span className="text-xs text-gray-400">{handle}</span>
                                    )}
                                </div>

                                {/* 2行目: メタ情報 vs 相対時刻 */}
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0 flex-1">
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <MapPin className="w-3 h-3" />
                                            <span>{post.areaMasked || '不明'}</span>
                                        </div>
                                        {post.shopName && (
                                            <>
                                                <span className="text-gray-300">/</span>
                                                <span className="truncate">{getShortLabel(post.shopName, STORE_SHORT_LABEL_MAP)}</span>
                                            </>
                                        )}
                                        <span className="text-gray-300">/</span>
                                        <span className="truncate">{getShortLabel(post.stickerType, TYPE_SHORT_LABEL_MAP)}</span>
                                        {post.text && (
                                            <>
                                                <span className="text-gray-300">・</span>
                                                <span className="truncate">{post.text}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {getRelativeTime(post.createdAt)}
                                        </span>
                                        {/* Pin Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTogglePin(post);
                                            }}
                                            className="flex items-center gap-1"
                                        >
                                            <Pin
                                                className={`w-3.5 h-3.5 transition-colors ${
                                                    pinnedPostIds.includes(post.id)
                                                        ? 'fill-pink-500 text-pink-500'
                                                        : 'text-gray-300 hover:text-pink-300'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                        </div>
                    );
                    })
                )}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    authorHandle={selectedPost.authorUid ? userMap[selectedPost.authorUid]?.handle : undefined}
                    onClose={closePostDetail}
                />
            )}
        </div>
    );
}
