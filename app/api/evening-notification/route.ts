import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendPushMessage, createEveningNotificationMessage } from '@/lib/line';

// Firebase Admin SDK initialization
const initFirebaseAdmin = () => {
    if (getApps().length === 0) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            initializeApp({
                credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
                projectId: process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6',
            });
        } else {
            initializeApp({
                projectId: process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6',
            });
        }
    }
    return getFirestore();
};

interface UserProfile {
    displayName?: string;
    lineUserId?: string;
    areas?: string[];
    area?: string;
    notificationPreferences?: {
        enabled: boolean;
        areas: string[];
        morningNotification?: boolean;
        eveningNotification?: boolean;
    };
}

interface Post {
    character: string;
    areaMasked: string;
    shopName?: string;
    status: string;
    createdAt?: Timestamp;
}

/**
 * 夕方18時のまとめ通知API
 * Cloud Schedulerから毎日18:00 JSTに呼び出される
 * 
 * 処理内容:
 * 1. eveningNotification が true のユーザーを取得
 * 2. 今日の目撃情報を取得
 * 3. LINE送信
 */
export async function POST(request: NextRequest) {
    try {
        // 認証チェック
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = initFirebaseAdmin();
        const appId = 'tsugi-no-tokimeki';

        // 今日の0時（JST）を計算
        const now = new Date();
        const jstOffset = 9 * 60 * 60 * 1000; // 9時間
        const jstNow = new Date(now.getTime() + jstOffset);
        const todayStart = new Date(jstNow.getFullYear(), jstNow.getMonth(), jstNow.getDate());
        const todayStartUTC = new Date(todayStart.getTime() - jstOffset);

        const results: { userId: string; success: boolean; error?: string }[] = [];

        // 全ユーザーを取得
        const usersRef = db.collection('artifacts').doc(appId).collection('users');
        const usersSnapshot = await usersRef.listDocuments();

        // 今日の投稿を取得
        const postsRef = db.collection('artifacts').doc(appId).collection('posts');
        const todayPostsSnapshot = await postsRef
            .where('createdAt', '>=', Timestamp.fromDate(todayStartUTC))
            .orderBy('createdAt', 'desc')
            .get();

        const todayAllPosts = todayPostsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (Post & { id: string })[];

        for (const userDoc of usersSnapshot) {
            const userId = userDoc.id;

            try {
                const profileDoc = await userDoc.collection('profile').doc('main').get();
                if (!profileDoc.exists) {
                    results.push({ userId, success: false, error: 'No profile' });
                    continue;
                }

                const profile = profileDoc.data() as UserProfile;

                // 通知条件チェック
                if (!profile.notificationPreferences?.enabled) {
                    results.push({ userId, success: false, error: 'Notifications disabled' });
                    continue;
                }
                if (!profile.notificationPreferences.eveningNotification) {
                    results.push({ userId, success: false, error: 'Evening notification disabled' });
                    continue;
                }
                if (!profile.lineUserId) {
                    results.push({ userId, success: false, error: 'No LINE user ID' });
                    continue;
                }

                const userAreas = profile.notificationPreferences.areas ||
                    profile.areas ||
                    (profile.area ? [profile.area] : []);

                // ユーザーのエリアに関連する今日の投稿を抽出
                const todayPosts = todayAllPosts
                    .filter(p => userAreas.length === 0 || userAreas.includes(p.areaMasked))
                    .map(p => ({
                        character: p.character,
                        area: p.areaMasked,
                        shopName: p.shopName || '不明',
                        status: p.status,
                    }));

                // 投稿がない場合もお知らせ（オプション：スキップも可）
                const userName = profile.displayName || 'ゲスト';
                const message = createEveningNotificationMessage(userName, todayPosts);

                const sendResult = await sendPushMessage(profile.lineUserId, [message]);

                if (sendResult.success) {
                    results.push({ userId, success: true });
                } else {
                    results.push({ userId, success: false, error: sendResult.error });
                }
            } catch (error) {
                console.error(`Error processing user ${userId}:`, error);
                results.push({
                    userId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: 'Evening notification completed',
            totalUsers: results.length,
            successful: successCount,
            failed: failureCount,
            results,
        });
    } catch (error) {
        console.error('Evening notification error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send evening notifications',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

