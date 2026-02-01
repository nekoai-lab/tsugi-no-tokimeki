import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  favorites: string[];
  area: string;
  availability: Record<string, string[]>;
  lineUserId?: string;
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

