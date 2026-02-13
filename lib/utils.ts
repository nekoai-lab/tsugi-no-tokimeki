import { Timestamp } from 'firebase/firestore';

export const formatDate = (date: Timestamp | Date | null | undefined): string => {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const getRelativeTime = (date: Timestamp | Date | null | undefined): string => {
  if (!date) return '';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return 'たった今';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
  return formatDate(d);
};

export const CHARACTERS = ['たまごっち', 'サンリオ', 'ディズニー', 'しずくちゃん', 'ちいかわ', '平成ファンシー', 'その他'];
export const STICKER_TYPES = ['ボンボンドロップシール', 'プチドロップシール', 'ウォーターシール', 'おはじきシール', 'タイルシール', '平面シール', 'その他'];
export const POST_TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', 'その他'];
export const AREAS = ['新宿', '渋谷', '池袋', '原宿', '表参道', '銀座', '秋葉原', '上野', '浅草', 'その他'];
export const PREFERRED_SHOPS = ['東急ハンズ', 'LOFT', 'ドンキホーテ', 'PLAZA', 'キデイランド', 'ビレッジバンガード', 'その他'];
export const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 旧形式（後方互換性のため残す）
export const NOTIFICATION_TIME_SLOTS = [
  { key: 'morning' as const, label: '朝', range: '6:00〜11:00' },
  { key: 'afternoon' as const, label: '昼', range: '11:00〜15:00' },
  { key: 'evening' as const, label: '夕方', range: '15:00〜19:00' },
  { key: 'night' as const, label: '夜', range: '19:00〜24:00' },
];

// 新形式: シンプルな2つの通知タイミング
export const NOTIFICATION_TIMES = {
  morning: { time: '8:00', label: '朝の通知', description: '今日のルート＋目撃情報' },
  evening: { time: '18:00', label: '夕方の通知', description: '今日の目撃情報まとめ' },
};

