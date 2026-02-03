import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sendPushMessage, createPostNotificationMessage } from '@/lib/line';
import type { TimeSlotKey } from '@/lib/types';

// Firebase Admin SDK initialization
const initFirebaseAdmin = () => {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6',
    });
  }
  return getFirestore();
};

interface NotifyPostRequest {
  character: string;
  stickerType: string;
  areaMasked: string;
  shopName: string;
  status: string;
  postDate: string;
  posterUid: string;
}

interface UserProfile {
  lineUserId?: string;
  notificationPreferences?: {
    enabled: boolean;
    areas: string[];
    timeSlots: TimeSlotKey[];
  };
}

function getCurrentTimeSlot(): TimeSlotKey {
  // JST で現在時刻を取得
  const now = new Date();
  const jstStr = now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false });
  const hour = parseInt(jstStr, 10);

  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'afternoon';
  if (hour >= 15 && hour < 19) return 'evening';
  return 'night';
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyPostRequest = await request.json();
    const { character, stickerType, areaMasked, shopName, status, posterUid } = body;

    if (!character || !areaMasked || !posterUid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = initFirebaseAdmin();
    const appId = 'tsugi-no-tokimeki';
    const currentTimeSlot = getCurrentTimeSlot();

    // 全ユーザーを取得
    const usersRef = db.collection('artifacts').doc(appId).collection('users');
    const usersSnapshot = await usersRef.listDocuments();

    let notifiedCount = 0;
    const errors: string[] = [];

    for (const userDoc of usersSnapshot) {
      const userId = userDoc.id;

      // 投稿者自身はスキップ
      if (userId === posterUid) continue;

      try {
        const profileDoc = await userDoc.collection('profile').doc('main').get();
        if (!profileDoc.exists) continue;

        const profile = profileDoc.data() as UserProfile;

        // フィルター条件チェック
        if (!profile.notificationPreferences?.enabled) continue;
        if (!profile.lineUserId) continue;
        if (!profile.notificationPreferences.areas.includes(areaMasked)) continue;
        if (!profile.notificationPreferences.timeSlots.includes(currentTimeSlot)) continue;

        // LINE通知を送信
        const message = createPostNotificationMessage(
          character,
          areaMasked,
          shopName || '不明',
          stickerType || '不明',
          status
        );

        const result = await sendPushMessage(profile.lineUserId, [message]);
        if (result.success) {
          notifiedCount++;
        } else {
          errors.push(`User ${userId}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`User ${userId}: ${String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      notifiedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Notify post error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: String(error) },
      { status: 500 }
    );
  }
}
