/**
 * Google Maps Directions URL生成ユーティリティ
 * 
 * スポット配列からGoogle Maps Directions URLを生成する
 * - スポット名の正規化（"渋谷×ロフト" → "渋谷 ロフト, Japan"）
 * - 8件超は先頭8件に丸める（URLの安定性のため）
 * - 電車移動がある場合は transit モード、なければ walking モード
 */

import { findShopByName, getShopGoogleQuery } from './data/shopMaster';
import { needsTrain } from './data/stationMaster';

interface SpotLike {
  name: string;
  travelMode?: 'walk' | 'train';  // 移動手段（AIが出力）
}

/**
 * スポット名を正規化
 * "渋谷×ロフト" → "渋谷 ロフト, Japan"
 * 
 * 店舗マスターにある場合はGoogle検索用クエリを使用
 */
function normalizeSpotName(name: string): string {
  // 店舗マスターから検索用クエリを取得
  const masterQuery = getShopGoogleQuery(name);
  if (masterQuery !== `${name}, Japan`) {
    return masterQuery;
  }
  
  // マスターにない場合は従来の正規化
  return name
    .replace(/[×xX*＊]/g, ' ')  // ×, x, X, *, ＊ をスペースに
    .replace(/\s+/g, ' ')       // 連続する空白を1つに
    .trim() + ', Japan';
}

/**
 * ルートに電車移動が含まれるかどうかを判定
 */
function hasTrainTransit(shops: SpotLike[]): boolean {
  // 明示的にtrainが指定されている場合
  if (shops.some(s => s.travelMode === 'train')) {
    return true;
  }
  
  // 店舗マスターからエリアを取得して判定
  for (let i = 0; i < shops.length - 1; i++) {
    const shop1 = findShopByName(shops[i].name);
    const shop2 = findShopByName(shops[i + 1].name);
    
    if (shop1 && shop2 && needsTrain(shop1.area, shop2.area)) {
      return true;
    }
  }
  
  return false;
}

/**
 * スポット配列からGoogle Maps Directions URLを生成
 * 
 * @param shops スポット配列（nameプロパティを持つオブジェクト）
 * @returns Google Maps Directions URL（スポットがない場合は空文字列）
 * 
 * @example
 * const url = generateGoogleMapsUrl([
 *   { name: '渋谷×ロフト' },
 *   { name: '新宿×東急ハンズ' },
 *   { name: '池袋×サンシャイン' }
 * ]);
 * // => "https://www.google.com/maps/dir/?api=1&destination=池袋 サンシャイン, Japan&waypoints=渋谷 ロフト, Japan|新宿 東急ハンズ, Japan&travelmode=transit"
 */
export function generateGoogleMapsUrl(shops: SpotLike[]): string {
  if (!shops || shops.length === 0) {
    return '';
  }

  // スポット名を正規化
  const normalized = shops.map(s => normalizeSpotName(s.name));

  // 8件超は先頭8件に丸める（Google Maps URLの安定性のため）
  const limited = normalized.slice(0, 8);

  // 最後のスポットがdestination
  const destination = encodeURIComponent(limited[limited.length - 1]);

  // 最後以外がwaypoints
  const waypoints = limited
    .slice(0, -1)
    .map(w => encodeURIComponent(w))
    .join('|');

  // 電車移動があるかどうかで travelmode を切り替え
  const travelMode = hasTrainTransit(shops) ? 'transit' : 'walking';

  // URL組み立て
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${travelMode}`;

  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  return url;
}

/**
 * ルート概要テキストを生成
 * "A → B → C" 形式（長ければ省略）
 * 
 * @param shops スポット配列
 * @param maxLength 最大表示件数（デフォルト3）
 * @returns ルート概要文字列
 */
export function generateRouteOverview(shops: SpotLike[], maxLength = 3): string {
  if (!shops || shops.length === 0) {
    return 'ルートがありません';
  }

  // 店舗名から「エリア×」を除去して短くする
  const shortNames = shops.map(s => {
    const name = s.name;
    // "渋谷×ロフト" → "ロフト"
    const parts = name.split(/[×xX*＊]/);
    return parts.length > 1 ? parts[1].trim() : name;
  });

  if (shortNames.length <= maxLength) {
    return shortNames.join(' → ');
  }

  // 省略表示
  const displayed = shortNames.slice(0, maxLength);
  const remaining = shortNames.length - maxLength;
  return `${displayed.join(' → ')} 他${remaining}件`;
}


