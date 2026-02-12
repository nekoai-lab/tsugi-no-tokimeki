/**
 * 店舗マスターデータ
 * 
 * シール探しで訪問する店舗の情報を管理
 * - 店舗名、エリア、最寄り駅、駅からの徒歩時間
 * - Google Maps検索用クエリ
 */

export interface ShopMaster {
  id: string;
  name: string;           // 店舗名（表示用）
  shortName: string;      // 短縮名（ルート表示用）
  area: string;           // エリア（新宿、渋谷など）
  station: string;        // 最寄り駅
  walkFromStation: number; // 駅からの徒歩（分）
  googlePlaceQuery: string; // Google Maps検索用クエリ
  category: 'variety' | 'character' | 'discount'; // 店舗種別
  brands?: string[];      // 扱っているシールブランド（任意）
}

/**
 * 店舗マスターデータ
 * 9エリア × 主要店舗
 */
export const SHOP_MASTER: ShopMaster[] = [
  // ========== 新宿エリア ==========
  {
    id: 'shinjuku-loft',
    name: 'ロフト新宿',
    shortName: 'ロフト',
    area: '新宿',
    station: '新宿',
    walkFromStation: 3,
    googlePlaceQuery: 'ロフト新宿, Japan',
    category: 'variety',
  },
  {
    id: 'shinjuku-hands',
    name: 'ハンズ新宿',
    shortName: 'ハンズ',
    area: '新宿',
    station: '新宿',
    walkFromStation: 5,
    googlePlaceQuery: 'ハンズ新宿店, Japan',
    category: 'variety',
  },
  {
    id: 'shinjuku-donki',
    name: 'ドン・キホーテ新宿歌舞伎町',
    shortName: 'ドンキ',
    area: '新宿',
    station: '新宿',
    walkFromStation: 7,
    googlePlaceQuery: 'ドンキホーテ新宿歌舞伎町, Japan',
    category: 'discount',
  },
  {
    id: 'shinjuku-vv',
    name: 'ヴィレッジヴァンガード新宿マルイアネックス',
    shortName: 'ヴィレヴァン',
    area: '新宿',
    station: '新宿三丁目',
    walkFromStation: 2,
    googlePlaceQuery: 'ヴィレッジヴァンガード新宿マルイアネックス, Japan',
    category: 'variety',
  },

  // ========== 渋谷エリア ==========
  {
    id: 'shibuya-loft',
    name: 'ロフト渋谷',
    shortName: 'ロフト',
    area: '渋谷',
    station: '渋谷',
    walkFromStation: 5,
    googlePlaceQuery: '渋谷ロフト, Japan',
    category: 'variety',
  },
  {
    id: 'shibuya-donki',
    name: 'ドン・キホーテ渋谷',
    shortName: 'ドンキ',
    area: '渋谷',
    station: '渋谷',
    walkFromStation: 5,
    googlePlaceQuery: 'ドンキホーテ渋谷, Japan',
    category: 'discount',
  },
  {
    id: 'shibuya-vv',
    name: 'ヴィレッジヴァンガード渋谷本店',
    shortName: 'ヴィレヴァン',
    area: '渋谷',
    station: '渋谷',
    walkFromStation: 5,
    googlePlaceQuery: 'ヴィレッジヴァンガード渋谷PARCO, Japan',
    category: 'variety',
  },
  {
    id: 'shibuya-plaza',
    name: 'PLAZA渋谷109',
    shortName: 'PLAZA',
    area: '渋谷',
    station: '渋谷',
    walkFromStation: 3,
    googlePlaceQuery: 'PLAZA 渋谷109, Japan',
    category: 'variety',
  },

  // ========== 池袋エリア ==========
  {
    id: 'ikebukuro-loft',
    name: 'ロフト池袋',
    shortName: 'ロフト',
    area: '池袋',
    station: '池袋',
    walkFromStation: 3,
    googlePlaceQuery: '池袋ロフト, Japan',
    category: 'variety',
  },
  {
    id: 'ikebukuro-hands',
    name: 'ハンズ池袋店',
    shortName: 'ハンズ',
    area: '池袋',
    station: '池袋',
    walkFromStation: 5,
    googlePlaceQuery: 'ハンズ池袋店, Japan',
    category: 'variety',
  },
  {
    id: 'ikebukuro-sunshine',
    name: 'サンシャインシティ',
    shortName: 'サンシャイン',
    area: '池袋',
    station: '東池袋',
    walkFromStation: 3,
    googlePlaceQuery: 'サンシャインシティ池袋, Japan',
    category: 'variety',
  },
  {
    id: 'ikebukuro-animate',
    name: 'アニメイト池袋本店',
    shortName: 'アニメイト',
    area: '池袋',
    station: '池袋',
    walkFromStation: 5,
    googlePlaceQuery: 'アニメイト池袋本店, Japan',
    category: 'character',
  },

  // ========== 原宿エリア ==========
  {
    id: 'harajuku-kiddyland',
    name: 'キデイランド原宿',
    shortName: 'キデイランド',
    area: '原宿',
    station: '原宿',
    walkFromStation: 5,
    googlePlaceQuery: 'キデイランド原宿, Japan',
    category: 'character',
  },
  {
    id: 'harajuku-loft',
    name: 'ロフト原宿',
    shortName: 'ロフト',
    area: '原宿',
    station: '原宿',
    walkFromStation: 3,
    googlePlaceQuery: '原宿ロフト, Japan',
    category: 'variety',
  },
  {
    id: 'harajuku-plaza',
    name: 'PLAZA原宿',
    shortName: 'PLAZA',
    area: '原宿',
    station: '原宿',
    walkFromStation: 5,
    googlePlaceQuery: 'PLAZA原宿, Japan',
    category: 'variety',
  },

  // ========== 表参道エリア ==========
  {
    id: 'omotesando-plaza',
    name: 'PLAZA表参道',
    shortName: 'PLAZA',
    area: '表参道',
    station: '表参道',
    walkFromStation: 2,
    googlePlaceQuery: 'PLAZA表参道, Japan',
    category: 'variety',
  },
  {
    id: 'omotesando-kiddyland',
    name: 'キデイランド原宿店',
    shortName: 'キデイランド',
    area: '表参道',
    station: '明治神宮前',
    walkFromStation: 5,
    googlePlaceQuery: 'キデイランド原宿, Japan',
    category: 'character',
  },

  // ========== 銀座エリア ==========
  {
    id: 'ginza-loft',
    name: 'ロフト銀座',
    shortName: 'ロフト',
    area: '銀座',
    station: '銀座一丁目',
    walkFromStation: 2,
    googlePlaceQuery: '銀座ロフト, Japan',
    category: 'variety',
  },
  {
    id: 'ginza-plaza',
    name: 'PLAZA銀座',
    shortName: 'PLAZA',
    area: '銀座',
    station: '銀座',
    walkFromStation: 3,
    googlePlaceQuery: 'PLAZA銀座, Japan',
    category: 'variety',
  },

  // ========== 秋葉原エリア ==========
  {
    id: 'akihabara-donki',
    name: 'ドン・キホーテ秋葉原',
    shortName: 'ドンキ',
    area: '秋葉原',
    station: '秋葉原',
    walkFromStation: 3,
    googlePlaceQuery: 'ドンキホーテ秋葉原, Japan',
    category: 'discount',
  },
  {
    id: 'akihabara-animate',
    name: 'アニメイト秋葉原',
    shortName: 'アニメイト',
    area: '秋葉原',
    station: '秋葉原',
    walkFromStation: 5,
    googlePlaceQuery: 'アニメイト秋葉原, Japan',
    category: 'character',
  },
  {
    id: 'akihabara-vv',
    name: 'ヴィレッジヴァンガード秋葉原',
    shortName: 'ヴィレヴァン',
    area: '秋葉原',
    station: '秋葉原',
    walkFromStation: 5,
    googlePlaceQuery: 'ヴィレッジヴァンガード秋葉原, Japan',
    category: 'variety',
  },

  // ========== 上野エリア ==========
  {
    id: 'ueno-loft',
    name: 'ロフト上野',
    shortName: 'ロフト',
    area: '上野',
    station: '上野',
    walkFromStation: 3,
    googlePlaceQuery: '上野ロフト, Japan',
    category: 'variety',
  },
  {
    id: 'ueno-plaza',
    name: 'PLAZA上野',
    shortName: 'PLAZA',
    area: '上野',
    station: '上野',
    walkFromStation: 5,
    googlePlaceQuery: 'PLAZA上野, Japan',
    category: 'variety',
  },

  // ========== 浅草エリア ==========
  {
    id: 'asakusa-donki',
    name: 'ドン・キホーテ浅草',
    shortName: 'ドンキ',
    area: '浅草',
    station: '浅草',
    walkFromStation: 3,
    googlePlaceQuery: 'ドンキホーテ浅草, Japan',
    category: 'discount',
  },
];

/**
 * エリアから店舗を取得
 */
export function getShopsByArea(area: string): ShopMaster[] {
  return SHOP_MASTER.filter(shop => shop.area === area);
}

/**
 * 店舗名から店舗情報を取得（部分一致）
 */
export function findShopByName(name: string): ShopMaster | undefined {
  // 完全一致
  const exactMatch = SHOP_MASTER.find(shop => 
    shop.name === name || shop.shortName === name
  );
  if (exactMatch) return exactMatch;
  
  // 部分一致
  return SHOP_MASTER.find(shop => 
    name.includes(shop.shortName) || 
    name.includes(shop.name) ||
    shop.name.includes(name)
  );
}

/**
 * 2つの店舗が同じ駅かどうかを判定
 */
export function isSameStation(shop1: ShopMaster, shop2: ShopMaster): boolean {
  return shop1.station === shop2.station;
}

/**
 * 店舗のGoogle Maps検索用クエリを取得
 */
export function getShopGoogleQuery(shopName: string): string {
  const shop = findShopByName(shopName);
  return shop?.googlePlaceQuery ?? `${shopName}, Japan`;
}



