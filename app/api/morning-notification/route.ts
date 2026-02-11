import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sendPushMessage, createMorningNotificationMessage } from '@/lib/line';

// Firebase Admin SDK initialization
const initFirebaseAdmin = () => {
    if (getApps().length === 0) {
        // Cloud Run環境ではデフォルト認証を使用
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
    startTime?: string;
    endTime?: string;
    preferredShops?: string[];
    favorites?: string[];
    preferredStickerTypes?: string[];
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
    createdAt?: { seconds: number; nanoseconds: number };
}

interface Shop {
    name: string;
    time: string;
    description: string;
}

function getTimeAgo(createdAt: { seconds: number; nanoseconds: number } | undefined): string {
    if (!createdAt) return '不明';
    const now = Date.now();
    const postTime = createdAt.seconds * 1000;
    const diffMs = now - postTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'たった今';
    if (diffHours < 24) return `${diffHours}時間前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}日前`;
}

/**
 * 朝8時の統合通知API
 * Cloud Schedulerから毎日8:00 JSTに呼び出される
 * 
 * 処理内容:
 * 1. morningNotification が true のユーザーを取得
 * 2. 各ユーザーのルートを生成
 * 3. エリアの直近目撃情報を取得
 * 4. まとめてLINE送信
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
        const today = new Date().toISOString().split('T')[0];

        const results: { userId: string; success: boolean; error?: string }[] = [];

        // 全ユーザーを取得
        const usersRef = db.collection('artifacts').doc(appId).collection('users');
        const usersSnapshot = await usersRef.listDocuments();

        // 全投稿を取得（直近の目撃情報用）
        // パス: artifacts/{appId}/public/data/posts
        const postsRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('posts');
        const postsSnapshot = await postsRef
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        
        const allPosts = postsSnapshot.docs.map(doc => ({
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
                if (!profile.notificationPreferences.morningNotification) {
                    results.push({ userId, success: false, error: 'Morning notification disabled' });
                    continue;
                }
                if (!profile.lineUserId) {
                    results.push({ userId, success: false, error: 'No LINE user ID' });
                    continue;
                }

                // エリア情報を取得（複数のソースから優先順位で取得）
                const userAreas = (
                    (profile.notificationPreferences?.areas && profile.notificationPreferences.areas.length > 0 
                        ? profile.notificationPreferences.areas : null) ||
                    (profile.areas && profile.areas.length > 0 ? profile.areas : null) ||
                    (profile.area ? [profile.area] : [])
                );
                
                console.log(`User ${userId} areas:`, userAreas);

                // 1. ルート生成
                let routeData: { areas: string[]; shops: Shop[]; totalTravelTime: number } | null = null;
                
                if (userAreas.length > 0 && profile.startTime && profile.endTime) {
                    try {
                        // ルート提案APIを呼び出し
                        const routeResponse = await fetch(
                            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/route-proposal`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    userId,
                                    areas: userAreas,
                                    stickerType: profile.preferredStickerTypes?.[0] || '',
                                    stickerDesign: profile.favorites?.[0] || '',
                                    startTime: profile.startTime,
                                    endTime: profile.endTime,
                                    preferredShops: profile.preferredShops || [],
                                    userPosts: allPosts
                                        .filter(p => p.areaMasked && userAreas.includes(p.areaMasked))
                                        .slice(0, 10)
                                        .map(p => ({
                                            text: '',
                                            status: p.status as 'seen' | 'bought' | 'soldout',
                                            character: p.character,
                                            areaMasked: p.areaMasked,
                                            createdAt: p.createdAt,
                                        })),
                                    favorites: profile.favorites || [],
                                    userArea: profile.area || '',
                                }),
                            }
                        );

                        if (routeResponse.ok) {
                            const routeResult = await routeResponse.json();
                            routeData = {
                                areas: userAreas,
                                shops: routeResult.shops || [],
                                totalTravelTime: routeResult.totalTravelTime || 0,
                            };

                            // ルートを保存
                            await userDoc.collection('routeProposals').doc(today).set({
                                date: today,
                                areas: userAreas,
                                shops: routeResult.shops || [],
                                totalTravelTime: routeResult.totalTravelTime || 0,
                                supplementaryInfo: routeResult.supplementaryInfo,
                                stickerType: profile.preferredStickerTypes?.[0] || '',
                                stickerDesign: profile.favorites?.[0] || '',
                                startTime: profile.startTime,
                                endTime: profile.endTime,
                                preferredShops: profile.preferredShops || [],
                                confirmed: false,
                                createdAt: new Date(),
                            });
                        }
                    } catch (routeError) {
                        console.error(`Route generation failed for ${userId}:`, routeError);
                        // ルート生成に失敗しても通知は続行
                    }
                }

                // 2. エリアの直近目撃情報を取得
                const recentPosts = allPosts
                    .filter(p => userAreas.includes(p.areaMasked))
                    .slice(0, 5)
                    .map(p => ({
                        character: p.character,
                        area: p.areaMasked,
                        shopName: p.shopName || '不明',
                        status: p.status,
                        timeAgo: getTimeAgo(p.createdAt),
                    }));

                // 3. LINE通知を送信
                const userName = profile.displayName || 'ゲスト';
                const message = createMorningNotificationMessage(userName, routeData, recentPosts);
                
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
            message: 'Morning notification completed',
            date: today,
            totalUsers: results.length,
            successful: successCount,
            failed: failureCount,
            results,
        });
    } catch (error) {
        console.error('Morning notification error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send morning notifications',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

