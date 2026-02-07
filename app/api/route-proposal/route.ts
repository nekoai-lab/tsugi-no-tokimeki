import { NextRequest, NextResponse } from 'next/server';
import { VertexAI, type Tool } from '@google-cloud/vertexai';
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

const SYSTEM_INSTRUCTION = `あなたはシールを探すユーザーのために最適なルートを調べてあげる明るくフレンドリーなアシスタントです。

ユーザーのシール探しの旅を全力で応援します。

【口調のルール】

- 「お待たせ！考えてみたよ！」で始める
- 「〜かな」「〜だよ」など親しみやすい口調
- 最後は必ず応援メッセージで締める

【出力形式】
必ず以下のマークダウン形式で出力してください：

# お待たせ！考えてみたよ！
## 📍 今日のおすすめルート

### ⏰ タイムテーブル

**10:00-10:20** 📍 渋谷LOFT
- おすすめポイントをここに書く

🚶‍♀️ 移動時間: 5分

**10:25-11:45** 📍 渋谷東急ハンズ
- おすすめポイントをここに書く

ポイント
- 一店舗あたり、約20分~30分程度の滞在で考えてください
- 12:00-13:00あたりの時間にお昼の提案、17:00-18:00あたりに夜ご飯の提案も考えてみてください。
- その時間付近で開始時間が設定されていたら上記の提案はいらないです。
- 過去の情報を元に、根拠があればそれを提示できるときはしてください。
  例)1月22日にたまごっちの母ンボンドロップシールが発売されていたので、入荷される可能性はありますが、直近1ヶ月以内で入荷してるので確率は低いです。
- 駅を跨ぐ場合は電車の利用をしてください。駅間の分数も書いてください。

### 💡 補足情報

直近の在庫情報やおすすめポイントをここに

### 🎉 応援メッセージ

自分のトキメクシールに出会えることを願ってるよ！

【重要】
レスポンスの最後に、以下の形式でJSON部を必ず出力してください。JSONは \`\`\`json と \`\`\` で囲んでください。
このJSONはシステムが自動的にパースして保存します。ユーザーには見えません。

\`\`\`json
{
  "shops": [
    {
      "name": "店舗名",
      "time": "HH:MM",
      "description": "この店舗のおすすめポイント",
      "travelTimeFromPrevious": null or 数値（分）
    }
  ],
  "totalTravelTime": 合計移動時間（分）
}
\`\`\``;

// Vertex AI initialization
// Cloud Run上ではサービスアカウント認証が自動で行われる
const initVertexAI = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'carbon-zone-485401-e6';
  const location = 'asia-northeast1';
  
  return new VertexAI({
    project: projectId,
    location: location,
  });
};

function buildUserMessage(body: RouteProposalRequest): string {
  const { areas, stickerType, stickerDesign, startTime, endTime, preferredShops, userPosts, favorites, userArea } = body;

  const recentPosts = userPosts
    .filter(p => p.status === 'seen' || p.status === 'bought')
    .slice(0, 10)
    .map(p => `- ${p.areaMasked}で${p.character}を${p.status === 'bought' ? '購入' : '目撃'}`)
    .join('\n');

  return `以下の条件でシール探しのスケジュールを考えてください。Google検索で最新の店舗情報も調べてね！

【ユーザー情報】
- お気に入りキャラ: ${favorites.join(', ') || '特になし'}
- よく行くエリア: ${userArea || '特になし'}

【リクエスト】
- 場所: ${areas.join('、')}
- キャラクター: ${stickerDesign || '特になし'}
- シールの種類: ${stickerType || '特になし'}
- スケジュールを組む日程: 本日
- スケジュールを組む時間: ${startTime}〜${endTime}
- 特に回りたいお店: ${preferredShops.length > 0 ? preferredShops.join('、') : '特になし'}

【直近の目撃情報】
${recentPosts || '（まだ目撃情報がありません）'}

この情報をもとに、効率的なルートとタイムテーブルを提案してください！`;
}

function parseAIResponse(responseText: string): {
  message: string;
  shops: Shop[];
  totalTravelTime: number;
} {
  // Extract JSON block from the response
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

  let shops: Shop[] = [];
  let totalTravelTime = 0;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      shops = (parsed.shops || []).map((shop: { name: string; time: string; description: string; travelTimeFromPrevious?: number }, index: number) => ({
        id: `shop-${index}`,
        name: shop.name,
        time: shop.time || '',
        description: shop.description || '',
        location: {
          lat: 35.6938 + Math.random() * 0.01,
          lng: 139.7034 + Math.random() * 0.01,
        },
        travelTimeFromPrevious: shop.travelTimeFromPrevious || undefined,
      }));
      totalTravelTime = parsed.totalTravelTime || 0;
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', e);
    }
  }

  // Remove the JSON block from the message shown to the user
  const message = responseText
    .replace(/```json\s*[\s\S]*?\s*```/, '')
    .trim();

  return { message, shops, totalTravelTime };
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteProposalRequest = await request.json();

    const vertexAI = initVertexAI();

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
    });

    const userMessage = buildUserMessage(body);

    const googleSearchTool: Tool = {
      googleSearch: {},
    } as Tool;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      tools: [googleSearchTool],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('') || '';

    if (!responseText) {
      throw new Error('Empty response from Vertex AI');
    }

    const { message, shops, totalTravelTime } = parseAIResponse(responseText);

    return NextResponse.json({
      message,
      shops,
      totalTravelTime,
    });
  } catch (error) {
    console.error('Route proposal API error:', error);
    return NextResponse.json(
      { error: 'ルート提案の生成に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
