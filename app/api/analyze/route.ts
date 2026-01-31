import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
}

interface AnalysisResult {
  decision: 'go' | 'gather' | 'wait';
  score: number;
  reasons: string[];
  candidates: { area: string; time: string; prob: number }[];
  analyzedAt: FirebaseFirestore.Timestamp;
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
const parseAIResponse = (response: string): Partial<AnalysisResult> => {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const db = initFirebaseAdmin();
    const vertexAI = initVertexAI();
    const appId = 'tsugi-no-tokimeki';

    // Fetch user profile
    const profileDoc = await db
      .collection('artifacts')
      .doc(appId)
      .collection('users')
      .doc(userId)
      .collection('profile')
      .doc('main')
      .get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userProfile = profileDoc.data() as UserProfile;

    // Fetch recent posts
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

    // Build prompt and call Vertex AI
    const prompt = buildPrompt(posts, userProfile);
    
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-001',
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const analysisResult = parseAIResponse(responseText);

    // Save result to Firestore
    const { Timestamp } = await import('firebase-admin/firestore');
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

    return NextResponse.json({
      success: true,
      suggestion: suggestionData,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch latest suggestion
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = initFirebaseAdmin();
    const appId = 'tsugi-no-tokimeki';

    const suggestionDoc = await db
      .collection('artifacts')
      .doc(appId)
      .collection('users')
      .doc(userId)
      .collection('suggestions')
      .doc('latest')
      .get();

    if (!suggestionDoc.exists) {
      return NextResponse.json({
        suggestion: null,
        message: 'No analysis found. Run POST to analyze.',
      });
    }

    return NextResponse.json({
      suggestion: suggestionDoc.data(),
    });

  } catch (error) {
    console.error('Fetch suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestion', details: String(error) },
      { status: 500 }
    );
  }
}

