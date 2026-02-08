import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { saveRouteProposal, getRouteProposalByDate } from '@/lib/routeProposalService';
import type { UserProfile } from '@/lib/types';

/**
 * Daily route generation endpoint
 * This should be called by Cloud Scheduler daily at 9 AM JST
 */
export async function POST(request: NextRequest) {
    try {
        // Verify the request is from Cloud Scheduler (optional but recommended)
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET;

        if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const today = new Date().toISOString().split('T')[0];
        const results: { userId: string; success: boolean; error?: string }[] = [];

        // Get all users
        const usersRef = collection(db, 'artifacts', appId, 'users');
        const usersSnapshot = await getDocs(usersRef);

        // Process each user
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            try {
                // Get user profile
                const profileRef = collection(db, 'artifacts', appId, 'users', userId, 'profile');
                const profileSnapshot = await getDocs(profileRef);

                if (profileSnapshot.empty) {
                    results.push({ userId, success: false, error: 'No profile found' });
                    continue;
                }

                const profileData = profileSnapshot.docs[0].data() as UserProfile;

                // Check if user has required settings
                const areas = profileData.areas || (profileData.area ? [profileData.area] : []);
                if (areas.length === 0 || !profileData.startTime || !profileData.endTime) {
                    results.push({ userId, success: false, error: 'Incomplete profile settings' });
                    continue;
                }

                // Skip if today's route already exists
                const existingRoute = await getRouteProposalByDate(userId, today);
                if (existingRoute) {
                    results.push({ userId, success: true, error: 'Already generated' });
                    continue;
                }

                // Get user posts for context
                const postsRef = collection(db, 'artifacts', appId, 'posts');
                const postsSnapshot = await getDocs(postsRef);
                const userPosts = postsSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((post: any) => post.uid === userId)
                    .slice(0, 10)
                    .map((post: any) => ({
                        text: post.text || '',
                        status: post.status || 'seen',
                        character: post.character || '',
                        areaMasked: post.areaMasked || '',
                        createdAt: post.createdAt,
                    }));

                // Call route proposal API
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/route-proposal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        areas,
                        stickerType: profileData.preferredStickerTypes?.[0] || '',
                        stickerDesign: profileData.favorites?.[0] || '',
                        startTime: profileData.startTime,
                        endTime: profileData.endTime,
                        preferredShops: profileData.preferredShops || [],
                        userPosts,
                        favorites: profileData.favorites || [],
                        userArea: profileData.area || '',
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API call failed: ${response.statusText}`);
                }

                const data = await response.json();

                // Save the route proposal
                await saveRouteProposal(userId, {
                    date: today,
                    areas,
                    stickerType: profileData.preferredStickerTypes?.[0] || '',
                    stickerDesign: profileData.favorites?.[0] || '',
                    startTime: profileData.startTime,
                    endTime: profileData.endTime,
                    preferredShops: profileData.preferredShops || [],
                    shops: data.shops || [],
                    totalTravelTime: data.totalTravelTime || 0,
                    supplementaryInfo: data.supplementaryInfo,
                });

                results.push({ userId, success: true });
            } catch (error) {
                console.error(`Error generating route for user ${userId}:`, error);
                results.push({
                    userId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            message: 'Daily route generation completed',
            date: today,
            totalUsers: results.length,
            successful: successCount,
            failed: failureCount,
            results,
        });
    } catch (error) {
        console.error('Daily route generation error:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate daily routes',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
