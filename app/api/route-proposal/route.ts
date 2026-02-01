import { NextRequest, NextResponse } from 'next/server';
import type { Shop } from '@/lib/types';

interface RouteProposalRequest {
  userId: string;
  areas: string[];
  stickerType: string;
  stickerDesign: string;
  startTime: string;
  endTime: string;
  preferredShops: string[];
  userPosts: Array<{
    text: string;
    status: 'seen' | 'bought' | 'soldout';
    character: string;
    areaMasked: string;
    createdAt?: { seconds: number; nanoseconds: number };
  }>;
  favorites: string[];
  userArea: string;
}

/**
 * Google Vertex AIを使用してルート提案を生成するAPI
 * 
 * TODO: Vertex AIの実装方法
 * 1. @google-cloud/vertexai パッケージをインポート
 * 2. Vertex AIクライアントを初期化
 * 3. プロンプトを構築してgenerateContentを呼び出し
 * 4. レスポンスをパースしてShop[]形式に変換
 * 
 * 例:
 * import { VertexAI } from '@google-cloud/vertexai';
 * const vertexAI = new VertexAI({ project: 'your-project-id', location: 'us-central1' });
 * const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
 * const result = await model.generateContent(prompt);
 */
export async function POST(request: NextRequest) {
  try {
    const body: RouteProposalRequest = await request.json();
    const { areas, stickerType, stickerDesign, startTime, endTime, preferredShops, userPosts, favorites, userArea } = body;

    // TODO: Vertex AI実装
    // const vertexAI = new VertexAI({ 
    //   project: process.env.GOOGLE_CLOUD_PROJECT_ID,
    //   location: 'us-central1'
    // });
    // const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    // 
    // const prompt = buildPrompt(areas, stickerType, stickerDesign, startTime, endTime, preferredShops, userPosts, favorites, userArea);
    // const result = await model.generateContent(prompt);
    // const shops = parseAIResponse(result.response.text());

    // モックデータを返す（開発用）
    const shops: Shop[] = generateMockShops(areas, stickerType, stickerDesign, startTime, endTime, preferredShops, favorites);

    const totalTravelTime = shops.reduce((sum, shop, index) => {
      if (index === 0) return sum;
      return sum + (shop.travelTimeFromPrevious || 0);
    }, 0);

    return NextResponse.json({
      shops,
      totalTravelTime,
    });
  } catch (error) {
    console.error('Route proposal API error:', error);
    return NextResponse.json(
      { error: 'ルート提案の生成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * モックデータ生成（開発用）
 * TODO: Vertex AI実装後は削除
 */
function generateMockShops(
  areas: string[],
  stickerType: string,
  stickerDesign: string,
  startTime: string,
  endTime: string,
  preferredShops: string[],
  favorites: string[]
): Shop[] {
  const area = areas[0] || '新宿';
  const favoriteChar = stickerDesign || favorites[0] || 'メゾピアノ';
  
  // 時間帯から店舗訪問時刻を計算
  const startHour = parseInt(startTime.split(':')[0]) || 10;
  const endHour = parseInt(endTime.split(':')[0]) || 16;
  const shopCount = Math.min(3, Math.floor((endHour - startHour) / 2));
  
  const times: string[] = [];
  for (let i = 0; i < shopCount; i++) {
    const hour = startHour + i * 2;
    times.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  // 希望店舗があればそれを使用、なければデフォルト
  const shopNames = preferredShops.length > 0 
    ? preferredShops.slice(0, shopCount)
    : [
        `${area}・東急ハンズ`,
        `${area}LOFT`,
        '紀伊国屋書店' + (area === '新宿' ? '新宿本店' : ''),
      ].slice(0, shopCount);

  return shopNames.map((name, index) => ({
    id: `shop-${index}`,
    name: name.includes(area) ? name : `${area}・${name}`,
    time: times[index] || `${(startHour + index * 2).toString().padStart(2, '0')}:00`,
    description: index === 0
      ? `${favoriteChar}の${stickerType}が過去に入荷していました`
      : index === 1
      ? `${stickerType}の新作がある可能性が高いです`
      : '文房具コーナーにシール充実',
    location: {
      lat: 35.6938 + Math.random() * 0.01,
      lng: 139.7034 + Math.random() * 0.01,
    },
    travelTimeFromPrevious: index === 0 ? undefined : index === 1 ? 3 : 8,
  }));
}

/**
 * AIプロンプト構築（将来の実装用）
 */
function buildPrompt(
  areas: string[],
  stickerType: string,
  stickerDesign: string,
  startTime: string,
  endTime: string,
  preferredShops: string[],
  userPosts: RouteProposalRequest['userPosts'],
  favorites: string[],
  userArea: string
): string {
  const recentPosts = userPosts
    .filter(p => p.status === 'seen' || p.status === 'bought')
    .slice(0, 10)
    .map(p => `- ${p.areaMasked}で${p.character}を${p.status === 'bought' ? '購入' : '目撃'}`)
    .join('\n');

  return `あなたはシール収集家のためのルート提案AIです。

ユーザー情報：
- お気に入りキャラ: ${favorites.join(', ')}
- よく行くエリア: ${userArea}
- 過去の投稿:
${recentPosts || 'まだ投稿がありません'}

リクエスト：
- エリア: ${areas.join('、')}
- シールの種類: ${stickerType}
- シールの柄: ${stickerDesign}
- 時間: ${startTime}〜${endTime}
- 希望店舗: ${preferredShops.length > 0 ? preferredShops.join('、') : '特になし'}

${areas.join('、')}エリアで効率的に${stickerDesign}の${stickerType}を探せる店舗のルートを提案してください。
以下の形式でJSONを返してください：

{
  "shops": [
    {
      "name": "店舗名",
      "time": "10:00",
      "description": "この店舗の特徴やシールの情報",
      "location": {"lat": 35.6938, "lng": 139.7034},
      "travelTimeFromPrevious": 5
    }
  ],
  "totalTravelTime": 20
}

各店舗は移動時間を考慮して効率的な順序で並べてください。`;
}

