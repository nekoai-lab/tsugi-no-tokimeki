/**
 * LINE Messaging API クライアント
 * サーバーサイドでのみ使用
 */

const LINE_API_ENDPOINT = "https://api.line.me/v2/bot/message/push";

interface LineMessage {
  type: "text";
  text: string;
}

interface FlexMessage {
  type: "flex";
  altText: string;
  contents: FlexContainer;
}

interface FlexContainer {
  type: "bubble";
  hero?: FlexImage;
  body: FlexBox;
  footer?: FlexBox;
}

interface FlexImage {
  type: "image";
  url: string;
  size: string;
  aspectRatio: string;
  aspectMode: string;
}

interface FlexBox {
  type: "box";
  layout: "vertical" | "horizontal" | "baseline";
  contents: FlexComponent[];
  spacing?: string;
  margin?: string;
}

type FlexComponent = FlexText | FlexButton | FlexSeparator | FlexBox;

interface FlexText {
  type: "text";
  text: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  margin?: string;
}

interface FlexButton {
  type: "button";
  action: {
    type: "uri" | "message";
    label: string;
    uri?: string;
    text?: string;
  };
  style?: "primary" | "secondary" | "link";
  color?: string;
  margin?: string;
}

interface FlexSeparator {
  type: "separator";
  margin?: string;
}

/**
 * LINE にプッシュメッセージを送信
 */
export async function sendPushMessage(
  lineUserId: string,
  messages: (LineMessage | FlexMessage)[]
): Promise<{ success: boolean; error?: string }> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
    return { success: false, error: "Channel access token not configured" };
  }

  try {
    const response = await fetch(LINE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LINE API エラー:", response.status, errorBody);
      return { success: false, error: `LINE API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("LINE メッセージ送信エラー:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 「行動しよう！」通知メッセージを作成
 */
export function createGoNotificationMessage(
  character: string,
  area: string,
  reasons: string[]
): FlexMessage {
  return {
    type: "flex",
    altText: `🎯 ${character}を狙うチャンス！`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🎯 いま動こう！",
            size: "xl",
            weight: "bold",
            color: "#EC4899",
          },
          {
            type: "text",
            text: `${character}を狙うチャンスです`,
            size: "md",
            margin: "md",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: reasons.map((reason) => ({
              type: "text" as const,
              text: `• ${reason}`,
              size: "sm",
              color: "#666666",
              wrap: true,
              margin: "sm",
            })),
          },
          {
            type: "text",
            text: `📍 おすすめエリア: ${area}`,
            size: "sm",
            color: "#06C755",
            margin: "lg",
            weight: "bold",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "アプリで詳細を見る",
              uri: process.env.NEXT_PUBLIC_APP_URL || "https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app",
            },
            style: "primary",
            color: "#EC4899",
          },
        ],
      },
    },
  };
}

/**
 * 投稿通知メッセージを作成
 */
export function createPostNotificationMessage(
  character: string,
  area: string,
  shopName: string,
  stickerType: string,
  status: string
): FlexMessage {
  const statusText = status === 'seen' ? 'あった' : '売り切れ';
  const statusEmoji = status === 'seen' ? '✨' : '😢';
  const headerColor = status === 'seen' ? '#EC4899' : '#9CA3AF';

  return {
    type: "flex",
    altText: `${statusEmoji} ${area}で${character}の目撃情報！`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${statusEmoji} 新しい目撃情報`,
            size: "xl",
            weight: "bold",
            color: headerColor,
          },
          {
            type: "text",
            text: `${character}が${area}で「${statusText}」`,
            size: "md",
            margin: "md",
            wrap: true,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              { type: "text" as const, text: `📍 場所: ${area}`, size: "sm", color: "#666666", margin: "sm", wrap: true },
              { type: "text" as const, text: `🏪 店名: ${shopName}`, size: "sm", color: "#666666", margin: "sm", wrap: true },
              { type: "text" as const, text: `🏷️ 種類: ${stickerType}`, size: "sm", color: "#666666", margin: "sm", wrap: true },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "アプリで詳細を見る",
              uri: process.env.NEXT_PUBLIC_APP_URL || "https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app",
            },
            style: "primary",
            color: "#EC4899",
          },
        ],
      },
    },
  };
}

/**
 * シンプルなテキストメッセージを作成
 */
export function createTextMessage(text: string): LineMessage {
  return {
    type: "text",
    text: text,
  };
}

/**
 * 朝の統合通知メッセージを作成（ルート＋目撃情報）
 */
export function createMorningNotificationMessage(
  userName: string,
  route: {
    areas: string[];
    shops: Array<{ name: string; time: string }>;
    totalTravelTime: number;
  } | null,
  recentPosts: Array<{
    character: string;
    area: string;
    shopName: string;
    status: string;
    timeAgo: string;
  }>
): FlexMessage {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app";

  // ルート情報のテキスト
  const routeText = route && route.shops.length > 0
    ? route.shops.map(s => `${s.time} ${s.name}`).join(' → ')
    : 'まだルートがありません';

  // 目撃情報のテキスト
  const postsContents: FlexComponent[] = recentPosts.length > 0
    ? recentPosts.slice(0, 3).map(post => ({
        type: "text" as const,
        text: `• ${post.character} @${post.shopName}（${post.timeAgo}）`,
        size: "sm" as const,
        color: post.status === 'seen' ? "#333333" : "#9CA3AF",
        wrap: true,
        margin: "sm" as const,
      }))
    : [{
        type: "text" as const,
        text: "直近の目撃情報はありません",
        size: "sm" as const,
        color: "#9CA3AF",
        margin: "sm" as const,
      }];

  return {
    type: "flex",
    altText: `🌅 おはよう！今日のシール情報`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `🌅 おはよう、${userName}さん！`,
            size: "lg",
            weight: "bold",
            color: "#EC4899",
          },
          {
            type: "text",
            text: "今日のシール情報をお届け",
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          // 今日のルート
          {
            type: "text",
            text: "🗺️ 今日のおすすめルート",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "lg",
          },
          {
            type: "text",
            text: route?.areas?.join('・') || 'エリア未設定',
            size: "sm",
            color: "#06C755",
            margin: "sm",
          },
          {
            type: "text",
            text: routeText,
            size: "sm",
            color: "#666666",
            wrap: true,
            margin: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          // 目撃情報
          {
            type: "text",
            text: "📍 直近の目撃情報",
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            contents: postsContents,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "詳しく見る",
              uri: appUrl,
            },
            style: "primary",
            color: "#EC4899",
          },
        ],
      },
    },
  };
}

/**
 * 夕方のまとめ通知メッセージを作成
 */
export function createEveningNotificationMessage(
  userName: string,
  todayPosts: Array<{
    character: string;
    area: string;
    shopName: string;
    status: string;
  }>
): FlexMessage {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tsugi-no-tokimeki-265901745615.asia-northeast1.run.app";

  const postsContents: FlexComponent[] = todayPosts.length > 0
    ? todayPosts.slice(0, 5).map(post => ({
        type: "text" as const,
        text: `• ${post.character} @${post.area}/${post.shopName}`,
        size: "sm" as const,
        color: post.status === 'seen' ? "#333333" : "#9CA3AF",
        wrap: true,
        margin: "sm" as const,
      }))
    : [{
        type: "text" as const,
        text: "今日は目撃情報がありませんでした",
        size: "sm" as const,
        color: "#9CA3AF",
        margin: "sm" as const,
      }];

  return {
    type: "flex",
    altText: `🌆 今日のシール情報まとめ`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `🌆 ${userName}さん、お疲れさま！`,
            size: "lg",
            weight: "bold",
            color: "#8B5CF6",
          },
          {
            type: "text",
            text: "今日の目撃情報まとめ",
            size: "sm",
            color: "#666666",
            margin: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "text",
            text: `📊 今日の投稿: ${todayPosts.length}件`,
            size: "md",
            weight: "bold",
            color: "#333333",
            margin: "lg",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: postsContents,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "もっと見る",
              uri: appUrl,
            },
            style: "primary",
            color: "#8B5CF6",
          },
        ],
      },
    },
  };
}

