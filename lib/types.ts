import { Timestamp } from 'firebase/firestore';

export type TimeSlotKey = 'morning' | 'afternoon' | 'evening' | 'night';

export interface NotificationPreferences {
    enabled: boolean;
    areas: string[];
    timeSlots: TimeSlotKey[];
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
}

export interface Post {
    id: string;
    uid: string;
    text: string;
    status: 'seen' | 'bought' | 'soldout';
    character: string;
    stickerType: string;
    areaMasked: string;
    shopName?: string;
    postDate?: string; // "2026-02-02T14:30"
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
    imageUrl: string;
    caption?: string;
    createdAt?: Timestamp;
}

