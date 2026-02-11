/**
 * Google Maps Directions URL生成ユーティリティ
 * 
 * スポット配列からGoogle Maps Directions URLを生成する
 * - スポット名の正規化（"渋谷×ロフト" → "渋谷 ロフト, Japan"）
 * - 8件超は先頭8件に丸める（URLの安定性のため）
 * - travelmode=walking固定
 */

interface SpotLike {
  name: string;
}

/**
 * スポット名を正規化
 * "渋谷×ロフト" → "渋谷 ロフト, Japan"
 */
function normalizeSpotName(name: string): string {
  return name
    .replace(/[×xX*＊]/g, ' ')  // ×, x, X, *, ＊ をスペースに
    .replace(/\s+/g, ' ')       // 連続する空白を1つに
    .trim() + ', Japan';
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
 * // => "https://www.google.com/maps/dir/?api=1&destination=池袋 サンシャイン, Japan&waypoints=渋谷 ロフト, Japan|新宿 東急ハンズ, Japan&travelmode=walking"
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

  // URL組み立て
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;

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

