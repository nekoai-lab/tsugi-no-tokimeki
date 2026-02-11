/**
 * 発見確率計算ユーティリティ
 * 
 * 過去の目撃情報を分析し、ユーザーごとにパーソナライズされた
 * 発見確率を算出する
 */

import type { Post, Shop } from './types';

export interface ProbabilityInput {
  shops: Shop[];               // ルートの店舗
  posts: Post[];               // 全投稿データ
  favoriteCharacters: string[]; // お気に入りキャラ
  targetAreas: string[];       // 訪問エリア
}

export interface ProbabilityResult {
  probability: number;         // 発見確率（0-100）
  level: 'hot' | 'high' | 'medium' | 'low'; // レベル
  emoji: string;               // 表示絵文字
  factors: ProbabilityFactor[]; // 計算要因（デバッグ用）
}

export interface ProbabilityFactor {
  name: string;
  value: number;
  description: string;
}

/**
 * 投稿日からの経過日数を計算
 */
function getDaysDiff(post: Post): number {
  const now = new Date();
  let postDate: Date;
  
  if (post.postDate) {
    postDate = new Date(post.postDate);
  } else if (post.createdAt) {
    // Firestore Timestamp の場合
    postDate = typeof post.createdAt.toDate === 'function' 
      ? post.createdAt.toDate() 
      : new Date(post.createdAt as unknown as string);
  } else {
    return 999; // 日付不明は古いものとして扱う
  }
  
  return Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 発見確率を計算
 * 
 * 計算要素:
 * - 直近の目撃情報（2日以内: +25〜40%, 7日以内: +15%）
 * - 売り切れ情報（-5〜15%）
 * - お気に入りキャラの目撃（+10〜20%）
 * - 店舗数ボーナス（+3%/店舗、最大+15%）
 * - 曜日ボーナス（月〜水: +5%）
 */
export function calculateDiscoveryProbability(input: ProbabilityInput): ProbabilityResult {
  const { shops, posts, favoriteCharacters, targetAreas } = input;
  
  const factors: ProbabilityFactor[] = [];
  
  // 基準確率（何もなくても一定の確率）
  let probability = 30;
  factors.push({ name: '基準確率', value: 30, description: 'ベース値' });
  
  // ルートの店舗名リストを取得
  const shopNames = shops.map(s => s.name.toLowerCase());
  
  // 1. 対象エリアの直近の投稿をフィルタリング
  const relevantPosts = posts.filter(post => {
    // エリアが一致
    if (!targetAreas.some(area => 
      post.areaMasked?.includes(area) || area.includes(post.areaMasked || '')
    )) {
      return false;
    }
    // 7日以内
    return getDaysDiff(post) <= 7;
  });
  
  // 2. 直近2日以内の「目撃」（seen）があれば大幅UP
  const veryRecentSeen = relevantPosts.filter(p => 
    getDaysDiff(p) <= 2 && p.status === 'seen'
  );
  
  if (veryRecentSeen.length > 0) {
    const bonus = 25 + Math.min(veryRecentSeen.length * 5, 15);
    probability += bonus;
    factors.push({ 
      name: '直近目撃', 
      value: bonus, 
      description: `2日以内に${veryRecentSeen.length}件の目撃情報` 
    });
  } else {
    // 3-7日前の目撃
    const recentSeen = relevantPosts.filter(p => 
      getDaysDiff(p) > 2 && getDaysDiff(p) <= 7 && p.status === 'seen'
    );
    if (recentSeen.length > 0) {
      probability += 15;
      factors.push({ 
        name: '週内目撃', 
        value: 15, 
        description: `7日以内に${recentSeen.length}件の目撃情報` 
      });
    }
  }
  
  // 3. 売り切れ情報があれば減点
  const recentSoldout = relevantPosts.filter(p => 
    getDaysDiff(p) <= 3 && p.status === 'soldout'
  );
  if (recentSoldout.length > 0) {
    const penalty = Math.min(recentSoldout.length * 5, 15);
    probability -= penalty;
    factors.push({ 
      name: '売り切れ情報', 
      value: -penalty, 
      description: `${recentSoldout.length}件の売り切れ報告` 
    });
  }
  
  // 4. お気に入りキャラの目撃
  if (favoriteCharacters.length > 0) {
    const favoriteMatches = relevantPosts.filter(p => 
      favoriteCharacters.some(fav => 
        p.character?.includes(fav) || fav.includes(p.character || '')
      ) && p.status === 'seen'
    );
    if (favoriteMatches.length > 0) {
      const bonus = 10 + Math.min(favoriteMatches.length * 5, 10);
      probability += bonus;
      factors.push({ 
        name: 'お気に入り目撃', 
        value: bonus, 
        description: `${favoriteMatches[0]?.character}など${favoriteMatches.length}件` 
      });
    }
  }
  
  // 5. 店舗数ボーナス（多く回れば発見率UP）
  const shopBonus = Math.min(shops.length * 3, 15);
  if (shopBonus > 0) {
    probability += shopBonus;
    factors.push({ 
      name: '店舗数ボーナス', 
      value: shopBonus, 
      description: `${shops.length}店舗を巡回` 
    });
  }
  
  // 6. 曜日ボーナス（月〜水は入荷しやすい傾向）
  const dayOfWeek = new Date().getDay();
  if ([1, 2, 3].includes(dayOfWeek)) { // 月火水
    probability += 5;
    factors.push({ 
      name: '曜日ボーナス', 
      value: 5, 
      description: '入荷しやすい曜日（月〜水）' 
    });
  }
  
  // 7. ルート内の店舗での直近目撃があればさらにボーナス
  const shopSpecificSeen = relevantPosts.filter(p => {
    if (p.status !== 'seen') return false;
    const postShop = p.shopName?.toLowerCase() || '';
    return shopNames.some(name => 
      postShop.includes(name) || name.includes(postShop)
    );
  });
  if (shopSpecificSeen.length > 0 && getDaysDiff(shopSpecificSeen[0]) <= 3) {
    const bonus = 10;
    probability += bonus;
    factors.push({ 
      name: '店舗ピンポイント', 
      value: bonus, 
      description: `${shopSpecificSeen[0].shopName}で目撃情報` 
    });
  }
  
  // 範囲を 10〜95% に制限
  probability = Math.max(10, Math.min(95, Math.round(probability)));
  
  // レベル判定
  let level: ProbabilityResult['level'];
  let emoji: string;
  
  if (probability >= 80) {
    level = 'hot';
    emoji = '🔥';
  } else if (probability >= 60) {
    level = 'high';
    emoji = '✨';
  } else if (probability >= 40) {
    level = 'medium';
    emoji = '👀';
  } else {
    level = 'low';
    emoji = '🍀';
  }
  
  return { probability, level, emoji, factors };
}

/**
 * 確率レベルに応じたグラデーション色を返す
 */
export function getProbabilityGradient(level: ProbabilityResult['level']): string {
  switch (level) {
    case 'hot':
      return 'from-red-500 to-orange-500';
    case 'high':
      return 'from-pink-500 to-rose-500';
    case 'medium':
      return 'from-amber-500 to-orange-400';
    case 'low':
      return 'from-gray-400 to-gray-500';
  }
}

/**
 * 確率レベルに応じたテキスト色を返す
 */
export function getProbabilityTextColor(level: ProbabilityResult['level']): string {
  switch (level) {
    case 'hot':
      return 'text-red-600';
    case 'high':
      return 'text-pink-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-gray-500';
  }
}

