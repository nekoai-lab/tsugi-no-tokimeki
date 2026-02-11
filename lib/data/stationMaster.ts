/**
 * 駅間移動時間マスターデータ
 * 
 * 主要9エリアの駅間電車所要時間を管理
 * - 乗車時間のみ（乗り換え待ち時間は含まない）
 * - 最短ルートを採用
 */

export interface StationInfo {
  name: string;        // 駅名
  area: string;        // 対応エリア
  lines: string[];     // 利用可能路線
}

/**
 * 主要駅マスター
 */
export const STATIONS: StationInfo[] = [
  { name: '新宿', area: '新宿', lines: ['JR山手線', 'JR中央線', '小田急線', '京王線', '都営新宿線', '丸ノ内線'] },
  { name: '新宿三丁目', area: '新宿', lines: ['丸ノ内線', '副都心線', '都営新宿線'] },
  { name: '渋谷', area: '渋谷', lines: ['JR山手線', '東急東横線', '銀座線', '半蔵門線', '副都心線'] },
  { name: '池袋', area: '池袋', lines: ['JR山手線', '丸ノ内線', '副都心線', '有楽町線', '西武池袋線', '東武東上線'] },
  { name: '東池袋', area: '池袋', lines: ['有楽町線'] },
  { name: '原宿', area: '原宿', lines: ['JR山手線'] },
  { name: '明治神宮前', area: '原宿', lines: ['千代田線', '副都心線'] },
  { name: '表参道', area: '表参道', lines: ['銀座線', '半蔵門線', '千代田線'] },
  { name: '銀座', area: '銀座', lines: ['銀座線', '丸ノ内線', '日比谷線'] },
  { name: '銀座一丁目', area: '銀座', lines: ['有楽町線'] },
  { name: '秋葉原', area: '秋葉原', lines: ['JR山手線', 'JR総武線', '日比谷線', 'つくばエクスプレス'] },
  { name: '上野', area: '上野', lines: ['JR山手線', '銀座線', '日比谷線'] },
  { name: '浅草', area: '浅草', lines: ['銀座線', '都営浅草線', '東武スカイツリーライン'] },
];

/**
 * 駅間移動時間（分）
 * キー: "出発駅-到着駅" の形式
 * 値: 乗車時間（分）
 * 
 * ※双方向対応のため、逆方向は自動的に同じ時間を適用
 */
export const STATION_TRAVEL_TIMES: Record<string, number> = {
  // ===== 山手線ベース =====
  '新宿-渋谷': 7,
  '新宿-池袋': 5,
  '新宿-原宿': 4,
  '渋谷-原宿': 3,
  '渋谷-表参道': 2,      // 銀座線/半蔵門線
  '池袋-上野': 18,       // 山手線経由
  '池袋-秋葉原': 22,     // 山手線経由
  '上野-秋葉原': 4,
  '上野-浅草': 5,        // 銀座線
  
  // ===== 銀座線・丸ノ内線 =====
  '渋谷-銀座': 15,       // 銀座線
  '表参道-銀座': 12,     // 銀座線
  '銀座-上野': 10,       // 銀座線
  '銀座-浅草': 15,       // 銀座線
  '新宿-銀座': 15,       // 丸ノ内線
  '池袋-銀座': 20,       // 丸ノ内線経由
  
  // ===== 日比谷線 =====
  '秋葉原-銀座': 5,      // 日比谷線
  '上野-銀座': 10,       // 日比谷線 or 銀座線
  
  // ===== 副都心線 =====
  '渋谷-池袋': 15,       // 副都心線（直通）
  '渋谷-新宿三丁目': 5,  // 副都心線
  '新宿三丁目-池袋': 10, // 副都心線
  
  // ===== 有楽町線 =====
  '池袋-銀座一丁目': 15, // 有楽町線
  '東池袋-銀座一丁目': 13,
  
  // ===== その他エリア間 =====
  '原宿-表参道': 3,      // 徒歩 or 千代田線
  '秋葉原-浅草': 10,     // つくばエクスプレス or 銀座線乗換
  '新宿-秋葉原': 20,     // 中央線→総武線
  '新宿-上野': 25,       // 山手線
  '渋谷-秋葉原': 25,     // 山手線
  '渋谷-上野': 28,       // 山手線
  '渋谷-浅草': 30,       // 銀座線
  '新宿-浅草': 30,       // 丸ノ内線→銀座線
  '池袋-浅草': 25,       // 丸ノ内線→銀座線
  '池袋-原宿': 10,       // 山手線
  '池袋-表参道': 15,     // 副都心線→半蔵門線
};

/**
 * 駅間移動時間を取得（双方向対応）
 * 
 * @param from 出発駅
 * @param to 到着駅
 * @returns 移動時間（分）、見つからない場合は推定値20分
 */
export function getStationTravelTime(from: string, to: string): number {
  // 同じ駅なら0分
  if (from === to) return 0;
  
  // 同じエリア内の異なる駅（徒歩5分として計算）
  const fromStation = STATIONS.find(s => s.name === from);
  const toStation = STATIONS.find(s => s.name === to);
  if (fromStation && toStation && fromStation.area === toStation.area) {
    return 5;
  }
  
  // 正方向で検索
  const key1 = `${from}-${to}`;
  if (STATION_TRAVEL_TIMES[key1] !== undefined) {
    return STATION_TRAVEL_TIMES[key1];
  }
  
  // 逆方向で検索
  const key2 = `${to}-${from}`;
  if (STATION_TRAVEL_TIMES[key2] !== undefined) {
    return STATION_TRAVEL_TIMES[key2];
  }
  
  // 見つからない場合はデフォルト20分
  console.warn(`駅間時間が見つかりません: ${from} → ${to}、デフォルト20分を使用`);
  return 20;
}

/**
 * エリア間の移動時間を取得
 * 各エリアの代表駅を使用
 * 
 * @param fromArea 出発エリア
 * @param toArea 到着エリア
 * @returns 移動時間（分）
 */
export function getAreaTravelTime(fromArea: string, toArea: string): number {
  // 同じエリアなら徒歩5分
  if (fromArea === toArea) return 5;
  
  // 代表駅を取得
  const AREA_MAIN_STATIONS: Record<string, string> = {
    '新宿': '新宿',
    '渋谷': '渋谷',
    '池袋': '池袋',
    '原宿': '原宿',
    '表参道': '表参道',
    '銀座': '銀座',
    '秋葉原': '秋葉原',
    '上野': '上野',
    '浅草': '浅草',
  };
  
  const fromStation = AREA_MAIN_STATIONS[fromArea] || fromArea;
  const toStation = AREA_MAIN_STATIONS[toArea] || toArea;
  
  return getStationTravelTime(fromStation, toStation);
}

/**
 * 2つのエリアが電車移動が必要かどうかを判定
 * 
 * @param area1 エリア1
 * @param area2 エリア2
 * @returns 電車移動が必要ならtrue
 */
export function needsTrain(area1: string, area2: string): boolean {
  if (area1 === area2) return false;
  
  // 徒歩圏内のエリアペア
  const walkableAreaPairs = [
    ['原宿', '表参道'],
    ['表参道', '渋谷'],
  ];
  
  return !walkableAreaPairs.some(
    pair => (pair[0] === area1 && pair[1] === area2) || (pair[0] === area2 && pair[1] === area1)
  );
}

/**
 * AIプロンプト用の駅間移動時間テキストを生成
 */
export function generateTravelTimePrompt(): string {
  const lines: string[] = [
    '【駅間移動時間（電車）】',
    '※以下の時間を参考にルートを組んでください',
    '',
  ];
  
  // 主要ルートをグループ化して出力
  const majorRoutes = [
    { label: '山手線（新宿起点）', routes: ['新宿-渋谷', '新宿-池袋', '新宿-原宿'] },
    { label: '山手線（渋谷起点）', routes: ['渋谷-原宿', '渋谷-表参道'] },
    { label: '山手線（池袋・上野方面）', routes: ['池袋-上野', '上野-秋葉原', '上野-浅草'] },
    { label: '銀座線', routes: ['渋谷-銀座', '銀座-上野', '銀座-浅草'] },
    { label: 'その他', routes: ['秋葉原-銀座', '新宿-銀座', '渋谷-池袋'] },
  ];
  
  for (const group of majorRoutes) {
    lines.push(`${group.label}:`);
    for (const route of group.routes) {
      const time = STATION_TRAVEL_TIMES[route];
      if (time !== undefined) {
        const [from, to] = route.split('-');
        lines.push(`  - ${from}⇔${to}: ${time}分`);
      }
    }
    lines.push('');
  }
  
  return lines.join('\n');
}


