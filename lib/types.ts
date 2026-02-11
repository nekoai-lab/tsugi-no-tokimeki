import { Timestamp } from 'firebase/firestore';

// 旧形式（後方互換性のため残す）
export type TimeSlotKey = 'morning' | 'afternoon' | 'evening' | 'night';

export interface NotificationPreferences {
    enabled: boolean;
    areas: string[];
    // 新形式: 朝8時・夕方18時のトグル
    morningNotification?: boolean;  // 朝8時（ルート＋目撃情報）
    eveningNotification?: boolean;  // 夕方18時（まとめ）
    // 旧形式（後方互換性のため残す）
    timeSlots?: TimeSlotKey[];
}

export interface UserProfile {
    favorites: string[];
    area: string;
    areas?: string[];
    customAreas?: string[];
    customCharacters?: string[];
    preferredShops?: string[];
    customShops?: string[];
    preferredStickerTypes?: string[];
    customStickerTypes?: string[];
    startTime?: string; // "10:00"
    endTime?: string;   // "18:00"
    availability: Record<string, string[]>;
    lineUserId?: string;
    notificationPreferences?: NotificationPreferences;
    updatedAt?: Timestamp;
    // プロフィール情報（新規追加）
    displayName?: string; // 表示名（例：あや）
    photoUrl?: string; // アイコン画像URL
    handle?: string; // ハンドルネーム（例：@youjougaw_ws1）
    supportId?: string; // ユーザーID（サポート用、固定）
    notificationsEnabled?: boolean; // LINE通知ON/OFF
}

export interface Post {
    id: string;
    uid: string; // 旧フィールド（後方互換性のため残す）
    authorUid?: string; // canonicalUid（安定したユーザーID）
    authorLineUserId?: string; // バックフィル用（任意）
    text: string;
    status: 'seen' | 'bought' | 'soldout';
    character: string;
    stickerType: string;
    areaMasked: string;
    shopName?: string;
    postDate?: string; // "2026-02-02" (日付のみ)
    postTime?: string; // "14:00" or "その他" (見つけた時間)
    likes?: string[]; // いいねしたユーザーのUID配列
    createdAt?: Timestamp;
}

export interface StoreEvent {
    id: string;
    [key: string]: unknown;
}

export interface Suggestion {
    decision: 'go' | 'gather' | 'wait';
    score: number;
    reasons: string[];
    candidates: { area: string; time: string; prob: number }[];
}

export interface FirebaseUser {
    uid: string;
}

export interface Shop {
    id: string;
    name: string;
    time: string; // "10:00"
    description: string;
    location: {
        lat: number;
        lng: number;
    };
    travelTimeFromPrevious?: number; // 前の店からの移動時間（分）
    travelMode?: 'walk' | 'train'; // 移動手段（徒歩 or 電車）
    category?: 'shop' | 'lunch' | 'cafe' | 'dinner'; // 店舗カテゴリー
}

export interface RouteProposal {
    id: string;
    userId: string;
    date: string; // "2026-02-01"
    // 新しい構造
    areas?: string[]; // 複数の場所 ["新宿", "渋谷"]
    stickerType?: string; // "ボンボンドロップ" など
    stickerDesign?: string; // "メゾピアノ" など
    startTime?: string; // "10:00"
    endTime?: string; // "16:00"
    preferredShops?: string[]; // ["東急ハンズ", "LOFT"] など
    supplementaryInfo?: string; // AIが生成した補足情報・アドバイス
    // 古い構造（後方互換性のため）
    area?: string; // 単一の場所（古いデータ用）
    timeSlot?: 'morning' | 'afternoon' | 'allday'; // 古いデータ用
    shops: Shop[];
    totalTravelTime: number; // 分
    confirmed: boolean; // 「このルートで行く！」を押したかどうか
    createdAt?: Timestamp;
}

export interface StickerAlbumPost {
    id: string;
    userId: string;
    authorUid?: string; // canonicalUid（安定したユーザーID）
    imageUrl: string;
    caption?: string;
    characterName?: string;
    stickerType?: string;
    likes?: string[]; // お気に入りしたユーザーのUID配列
    createdAt?: Timestamp;
}

