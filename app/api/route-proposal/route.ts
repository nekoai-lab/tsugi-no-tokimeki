import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import type { Shop } from '@/lib/types';
import { SHOP_MASTER, getShopsByArea } from '@/lib/data/shopMaster';
import { generateTravelTimePrompt, getAreaTravelTime } from '@/lib/data/stationMaster';

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
  // 再生成用
  existingProposal?: string;
  modificationRequest?: string;
  // 初回生成かどうかのフラグ
  isInitialGeneration?: boolean;
}

// 再生成用の出力形式
const OUTPUT_FORMAT_REGENERATE = `
【出力形式】
必ず以下のマークダウン形式で出力してください：

# お待たせ！考えてみたよ！
## 📍 今日のおすすめルート

### ⏰ タイムテーブル

**10:00-10:20** 📍 渋谷LOFT
- おすすめポイントをここに書く

🚶‍♀️ 移動時間: 5分

**10:25-11:45** 📍 渋谷東急ハンズ
- おすすめポイントをここに書く`;

// 初回生成用のシステム指示（JSONのみ生成）
const SYSTEM_INSTRUCTION_INITIAL = `あなたはシールを探すユーザーのために最適なルートを効率的に生成するアシスタントです。

与えられた条件に基づいて、最適なルート提案をJSON形式で出力してください。

【店舗提案の重要ルール】
- ユーザーが「特に回りたいお店」を指定している場合、それらは優先的にルートに含めてください
- ただし、指定されたお店だけでなく、以下も積極的に提案してください：
  * そのエリアでシールを扱っている人気店・定番店（LOFT、ハンズ、ドン・キホーテ、ヴィレッジヴァンガード、アニメイト、キデイランドなど）
  * 過去に目撃情報があった店舗
  * キャラクターグッズを扱っている専門店
- 指定時間内に効率よく回れる店舗数を提案してください（目安：2時間で2-3店舗、4時間で4-6店舗）
- 移動時間を考慮して、無理のないスケジュールを組んでください

【タイムテーブルのルール】
- 一店舗あたり、約20分~30分程度の滞在で考えてください
- 12:00-13:00あたりの時間にお昼の提案、15:00-16:00あたりにお茶の提案、17:00-18:00あたりに夜ご飯の提案も考えてみてください
- その時間付近で開始時間が設定されていたら上記の提案はいらないです
- お昼・お茶・夜ご飯の提案では、そのエリアで人気のお店やおすすめのカフェ・レストランを提案してください
- 過去の情報を元に、根拠があればそれを提示できるときはしてください
  例)1月22日にたまごっちのボンボンドロップシールが発売されていたので、入荷される可能性はありますが、直近1ヶ月以内で入荷してるので確率は低いです

【移動時間のルール - 重要：以下の時間を厳守】
- 同じエリア内の移動: 徒歩 5-10分（travelMode: "walk"）
- 異なるエリア間の移動: 電車利用（travelMode: "train"）
- 駅間移動時間（電車）:
  * 新宿⇔渋谷: 7分
  * 新宿⇔池袋: 5分
  * 新宿⇔原宿: 4分
  * 渋谷⇔原宿: 3分
  * 渋谷⇔表参道: 2分
  * 渋谷⇔池袋: 15分
  * 渋谷⇔銀座: 15分
  * 池袋⇔上野: 18分
  * 上野⇔秋葉原: 4分
  * 上野⇔浅草: 5分
  * 秋葉原⇔銀座: 5分
  * 新宿⇔銀座: 15分
- 電車移動時間 + 駅から店舗までの徒歩（3-5分）を合計してtravelTimeFromPreviousに設定

【重要】
レスポンスの最後に、以下の形式でJSON部を必ず出力してください。JSONは \`\`\`json と \`\`\` で囲んでください。
このJSONはシステムが自動的にパースして保存します。

\`\`\`json
{
  "shops": [
    {
      "name": "店舗名",
      "time": "HH:MM",
      "description": "この店舗のおすすめポイント",
      "travelTimeFromPrevious": null or 数値（分）,
      "travelMode": "walk" or "train" （最初の店舗はnull、それ以降は "walk" または "train"）,
      "category": "shop" or "lunch" or "cafe" or "dinner" （シール探しの店舗は"shop"、お昼は"lunch"、お茶は"cafe"、夜ご飯は"dinner"）
    }
  ],
  "totalTravelTime": 合計移動時間（分）,
  "supplementaryInfo": "補足情報のテキスト（改行可能、簡潔に3-4行程度）"
}
\`\`\``;

// 再生成用のシステム指示（会話形式 + JSON）
const SYSTEM_INSTRUCTION_REGENERATE = `あなたはシールを探すユーザーのために最適なルートを調べてあげる明るくフレンドリーなアシスタントです。

ユーザーのシール探しの旅を全力で応援します。

【口調のルール】

- 「お待たせ！考えてみたよ！」で始める
- 「〜かな」「〜だよ」など親しみやすい口調
- 最後は必ず応援メッセージで締める

${OUTPUT_FORMAT_REGENERATE}

【店舗提案の重要ルール】
- ユーザーが「特に回りたいお店」を指定している場合、それらは優先的にルートに含めてください
- ただし、指定されたお店だけでなく、以下も積極的に提案してください：
  * そのエリアでシールを扱っている人気店・定番店（LOFT、東急ハンズ、ドン・キホーテ、ヴィレッジヴァンガード、アニメイトなど）
  * 過去に目撃情報があった店舗
  * キャラクターグッズを扱っている専門店
- 指定時間内に効率よく回れる店舗数を提案してください（目安：2時間で2-3店舗、4時間で4-6店舗）
- 移動時間を考慮して、無理のないスケジュールを組んでください

【タイムテーブルのルール】
- 一店舗あたり、約20分~30分程度の滞在で考えてください
- 12:00-13:00あたりの時間にお昼の提案、15:00-16:00あたりにお茶の提案、17:00-18:00あたりに夜ご飯の提案も考えてみてください
- その時間付近で開始時間が設定されていたら上記の提案はいらないです
- お昼・お茶・夜ご飯の提案では、そのエリアで人気のお店やおすすめのカフェ・レストランを提案してください
- 過去の情報を元に、根拠があればそれを提示できるときはしてください
  例)1月22日にたまごっちのボンボンドロップシールが発売されていたので、入荷される可能性はありますが、直近1ヶ月以内で入荷してるので確率は低いです

【移動時間のルール - 重要：以下の時間を厳守】
- 同じエリア内の移動: 徒歩 5-10分（travelMode: "walk"）
- 異なるエリア間の移動: 電車利用（travelMode: "train"）
- 駅間移動時間（電車）:
  * 新宿⇔渋谷: 7分
  * 新宿⇔池袋: 5分
  * 新宿⇔原宿: 4分
  * 渋谷⇔原宿: 3分
  * 渋谷⇔表参道: 2分
  * 渋谷⇔池袋: 15分
  * 渋谷⇔銀座: 15分
  * 池袋⇔上野: 18分
  * 上野⇔秋葉原: 4分
  * 上野⇔浅草: 5分
  * 秋葉原⇔銀座: 5分
  * 新宿⇔銀座: 15分
- 電車移動時間 + 駅から店舗までの徒歩（3-5分）を合計してtravelTimeFromPreviousに設定

### 💡 補足情報

直近の在庫情報やおすすめポイントをここに
- 混雑する時間帯の情報
- 効率的に回るためのコツ
- 在庫状況の予測
- その他役立つアドバイス

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
      "travelTimeFromPrevious": null or 数値（分）,
      "travelMode": "walk" or "train" （最初の店舗はnull、それ以降は "walk" または "train"）,
      "category": "shop" or "lunch" or "cafe" or "dinner" （シール探しの店舗は"shop"、お昼は"lunch"、お茶は"cafe"、夜ご飯は"dinner"）
    }
  ],
  "totalTravelTime": 合計移動時間（分）,
  "supplementaryInfo": "補足情報のテキスト（改行可能、簡潔に3-4行程度）"
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
  const { areas, stickerType, stickerDesign, startTime, endTime, preferredShops, userPosts, favorites, userArea, existingProposal, modificationRequest } = body;

  const recentPosts = userPosts
    .filter(p => p.status === 'seen' || p.status === 'bought')
    .slice(0, 10)
    .map(p => `- ${p.areaMasked}で${p.character}を${p.status === 'bought' ? '購入' : '目撃'}（${p.text}）`)
    .join('\n');

  // 時間枠から推奨店舗数を計算
  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };
  const durationMinutes = calculateDuration();
  const recommendedShops = Math.max(2, Math.floor(durationMinutes / 40)); // 40分/店舗（滞在30分+移動10分）

  // エリア内の利用可能な店舗リストを生成
  const availableShops = areas.flatMap(area => {
    const shops = getShopsByArea(area);
    return shops.map(s => `  - ${s.name}（${s.station}駅 徒歩${s.walkFromStation}分）`);
  });
  const shopListText = availableShops.length > 0 
    ? `【このエリアで利用可能な店舗】\n${availableShops.join('\n')}`
    : '';

  // エリア間の移動時間を計算
  const areaTravelTimes = areas.length > 1 
    ? `【エリア間の移動時間】\n${areas.slice(0, -1).map((from, i) => {
        const to = areas[i + 1];
        const time = getAreaTravelTime(from, to);
        return `  - ${from}⇔${to}: 電車${time}分`;
      }).join('\n')}`
    : '';

  // 再生成リクエストの場合
  if (existingProposal && modificationRequest) {
    return `以下の既存のルート提案を、ユーザーのリクエストに基づいて修正してください。

【既存のルート提案】
${existingProposal}

【ユーザーの修正リクエスト】
${modificationRequest}

【基本条件】
- 場所: ${areas.join('、')}
- キャラクター: ${stickerDesign || '特になし'}
- シールの種類: ${stickerType || '特になし'}
- スケジュールを組む日程: 本日
- スケジュールを組む時間: ${startTime}〜${endTime}（${Math.floor(durationMinutes / 60)}時間${durationMinutes % 60}分）
- 特に回りたいお店: ${preferredShops.length > 0 ? preferredShops.join('、') : '特になし'}
- 推奨店舗数: ${recommendedShops}店舗程度（食事・カフェ除く）

【直近の目撃情報】
${recentPosts || '（まだ目撃情報がありません）'}

修正リクエストを反映した新しいルートとタイムテーブルを提案してください！
指定されたお店だけでなく、そのエリアの人気店や過去に在庫があった店舗も積極的に提案してください。`;
  }

  return `以下の条件でシール探しのスケジュールを考えてください。

【ユーザー情報】
- お気に入りキャラ: ${favorites.join(', ') || '特になし'}
- よく行くエリア: ${userArea || '特になし'}

【リクエスト】
- 場所: ${areas.join('、')}
- キャラクター: ${stickerDesign || '特になし'}
- シールの種類: ${stickerType || '特になし'}
- スケジュールを組む日程: 本日
- スケジュールを組む時間: ${startTime}〜${endTime}（${Math.floor(durationMinutes / 60)}時間${durationMinutes % 60}分）
- 特に回りたいお店: ${preferredShops.length > 0 ? preferredShops.join('、') : '特になし'}
- 推奨店舗数: ${recommendedShops}店舗程度（食事・カフェ除く）

${shopListText}

${areaTravelTimes}

【直近の目撃情報】
${recentPosts || '（まだ目撃情報がありません）'}

【重要】
- 上記の「利用可能な店舗」から優先的に選んでください
- 「特に回りたいお店」が指定されている場合は優先的に含めてください
- 移動時間は上記の「エリア間の移動時間」を参照してください
- 時間内に無理なく回れる効率的なルートを組んでください

この情報をもとに、効率的なルートとタイムテーブルを提案してください！`;
}

function parseAIResponse(responseText: string): {
  message: string;
  shops: Shop[];
  totalTravelTime: number;
  supplementaryInfo?: string;
} {
  // Extract JSON block from the response
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

  let shops: Shop[] = [];
  let totalTravelTime = 0;
  let supplementaryInfo: string | undefined;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      shops = (parsed.shops || []).map((shop: {
        name: string;
        time: string;
        description: string;
        travelTimeFromPrevious?: number;
        travelMode?: 'walk' | 'train';
        category?: 'shop' | 'lunch' | 'cafe' | 'dinner';
      }, index: number) => ({
        id: `shop-${index}`,
        name: shop.name,
        time: shop.time || '',
        description: shop.description || '',
        location: {
          lat: 35.6938 + Math.random() * 0.01,
          lng: 139.7034 + Math.random() * 0.01,
        },
        travelTimeFromPrevious: shop.travelTimeFromPrevious || undefined,
        travelMode: shop.travelMode || (shop.travelTimeFromPrevious ? 'walk' : undefined),
        category: shop.category || 'shop',
      }));
      totalTravelTime = parsed.totalTravelTime || 0;
      supplementaryInfo = parsed.supplementaryInfo || undefined;
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', e);
    }
  }

  // Remove the JSON block from the message shown to the user
  const message = responseText
    .replace(/```json\s*[\s\S]*?\s*```/, '')
    .trim();

  return { message, shops, totalTravelTime, supplementaryInfo };
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteProposalRequest = await request.json();

    const vertexAI = initVertexAI();

    // 初回生成か再生成かでシステム指示を切り替え
    const systemInstruction = body.isInitialGeneration
      ? SYSTEM_INSTRUCTION_INITIAL
      : SYSTEM_INSTRUCTION_REGENERATE;

    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemInstruction }],
      },
    });

    const userMessage = buildUserMessage(body);

    // NOTE: Google Search Tool は開発段階ではコスト削減のため無効化
    // 本番リリース後、必要に応じて以下のように有効化できます:
    // import { type Tool } from '@google-cloud/vertexai';
    // const googleSearchTool: Tool = { googleSearch: {} } as Tool;
    // tools: [googleSearchTool],

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('') || '';

    if (!responseText) {
      throw new Error('Empty response from Vertex AI');
    }

    const { message, shops, totalTravelTime, supplementaryInfo } = parseAIResponse(responseText);

    return NextResponse.json({
      message,
      shops,
      totalTravelTime,
      supplementaryInfo,
    });
  } catch (error) {
    console.error('Route proposal API error:', error);
    return NextResponse.json(
      { error: 'ルート提案の生成に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
