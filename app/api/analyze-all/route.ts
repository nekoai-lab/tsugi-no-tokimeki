import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { sendPushMessage, createGoNotificationMessage } from '@/lib/line';

// Firebase Admin SDK initialization
const initFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Cloud Run環境では自動的に認証される
    initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6',
    });
  }
  return getFirestore();
};

// Vertex AI initialization
const initVertexAI = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6';
  const location = 'asia-northeast1';
  
  return new VertexAI({
    project: projectId,
    location: location,
  });
};

// Types
interface Post {
  id: string;
  character: string;
  status: 'seen' | 'bought' | 'soldout';
  areaMasked: string;
  text: string;
  createdAt: FirebaseFirestore.Timestamp;
}

interface UserProfile {
  favorites: string[];
  area: string;
  availability: Record<string, string[]>;
  lineUserId?: string;
}

interface AnalysisResult {
  userId: string;
  success: boolean;
  decision?: string;
  reasons?: string[];
  userProfile?: UserProfile;
  error?: string;
}

// Prompt template for AI analysis
const buildPrompt = (posts: Post[], userProfile: UserProfile): string => {
  const favoritesStr = userProfile.favorites.join(', ');
  const userArea = userProfile.area;
  
  const recentPosts = posts.slice(0, 20).map(p => 
    `- [${p.status}] ${p.character} @ ${p.areaMasked}: ${p.text}`
  ).join('\n');

  return `あなたは「推しグッズ購入アドバイザー」です。
ユーザーの推しキャラ: ${favoritesStr}
ユーザーの活動エリア: ${userArea}

直近の目撃情報:
${recentPosts || '（まだ目撃情報がありません）'}

上記の情報を分析して、ユーザーが「今動くべきか」を判断してください。

以下のJSON形式で回答してください:
{
  "decision": "go" | "gather" | "wait",
  "score": 0.0〜1.0（行動すべき確信度）,
  "reasons": ["理由1", "理由2", "理由3"],
  "candidates": [
    {"area": "エリア名", "time": "推奨時間帯", "prob": 確率(0-100)}
  ]
}

判断基準:
- "go": 推しキャラの目撃情報があり、在庫がありそう（score 0.7以上）
- "gather": 動きはあるが確定情報が不足（score 0.4-0.7）
- "wait": 情報が少ない、または売り切れ報告が多い（score 0.4未満）

JSON形式のみで回答し、他の説明は不要です。`;
};

// Parse AI response
const parseAIResponse = (response: string) => {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return {
      decision: 'wait',
      score: 0.3,
      reasons: ['AI分析に失敗しました。再試行してください。'],
      candidates: [],
    };
  }
};

// Analyze a single user
const analyzeUser = async (
  userId: string,
  userProfile: UserProfile,
  posts: Post[],
  vertexAI: VertexAI,
  db: FirebaseFirestore.Firestore,
  appId: string
): Promise<AnalysisResult> => {
  try {
    // Build prompt and call Vertex AI
    const prompt = buildPrompt(posts, userProfile);
    
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const analysisResult = parseAIResponse(responseText);

    // Save result to Firestore
    const suggestionData = {
      decision: analysisResult.decision || 'wait',
      score: analysisResult.score || 0.3,
      reasons: analysisResult.reasons || [],
      candidates: analysisResult.candidates || [],
      analyzedAt: Timestamp.now(),
    };

    // Save to user's suggestions
    await db
      .collection('artifacts')
      .doc(appId)
      .collection('users')
      .doc(userId)
      .collection('suggestions')
      .doc('latest')
      .set(suggestionData);

    return {
      userId,
      success: true,
      decision: suggestionData.decision,
      reasons: suggestionData.reasons,
      userProfile,
    };
  } catch (error) {
    console.error(`Error analyzing user ${userId}:`, error);
    return {
      userId,
      success: false,
      error: String(error),
      userProfile,
    };
  }
};

// Cloud Scheduler用エンドポイント（全ユーザー一括処理）
export async function POST() {
  const startTime = Date.now();
  
  try {
    // Initialize services
    const db = initFirebaseAdmin();
    const vertexAI = initVertexAI();
    const appId = 'tsugi-no-tokimeki';

    // Fetch all users with profiles
    const usersSnapshot = await db
      .collection('artifacts')
      .doc(appId)
      .collection('users')
      .listDocuments();

    if (usersSnapshot.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found to analyze',
        processedCount: 0,
        duration: Date.now() - startTime,
      });
    }

    // Fetch recent posts (shared across all users)
    const postsSnapshot = await db
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .doc('data')
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Process each user
    const results: AnalysisResult[] = [];
    let successCount = 0;
    let goCount = 0;

    for (const userRef of usersSnapshot) {
      const userId = userRef.id;
      
      // Get user profile
      const profileDoc = await db
        .collection('artifacts')
        .doc(appId)
        .collection('users')
        .doc(userId)
        .collection('profile')
        .doc('main')
        .get();

      if (!profileDoc.exists) {
        results.push({
          userId,
          success: false,
          error: 'Profile not found',
        });
        continue;
      }

      const userProfile = profileDoc.data() as UserProfile;
      
      // Analyze this user
      const result = await analyzeUser(
        userId,
        userProfile,
        posts,
        vertexAI,
        db,
        appId
      );
      
      results.push(result);
      
      if (result.success) {
        successCount++;
        if (result.decision === 'go') {
          goCount++;
        }
      }
    }

    // LINE プッシュ通知を送信（"go" 判定 かつ lineUserId がある場合）
    let notificationsSent = 0;
    const notificationResults = [];

    for (const result of results) {
      if (
        result.success &&
        result.decision === 'go' &&
        result.userProfile?.lineUserId
      ) {
        const character = result.userProfile.favorites[0] || 'お気に入りのキャラ';
        const area = result.userProfile.area || '近くのエリア';
        const reasons = result.reasons || ['目撃情報があります！'];

        const message = createGoNotificationMessage(character, area, reasons);
        const pushResult = await sendPushMessage(
          result.userProfile.lineUserId,
          [message]
        );

        notificationResults.push({
          userId: result.userId,
          lineUserId: result.userProfile.lineUserId,
          sent: pushResult.success,
          error: pushResult.error,
        });

        if (pushResult.success) {
          notificationsSent++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Analyzed ${successCount}/${usersSnapshot.length} users, sent ${notificationsSent} notifications`,
      processedCount: successCount,
      goCount,
      notificationsSent,
      duration: Date.now() - startTime,
      results: results.map(r => ({
        userId: r.userId,
        success: r.success,
        decision: r.decision,
        error: r.error,
      })),
      notificationResults,
    });

  } catch (error) {
    console.error('Analyze-all error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Analysis failed', 
        details: String(error),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/analyze-all',
    description: 'Cloud Scheduler endpoint for batch user analysis',
  });
}

