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

export const CHARACTERS = ['たまごっち', 'サンリオ', 'ディズニー', 'しずくちゃん', '平成ファンシー', 'メゾピアノ'];
export const STICKER_TYPES = ['ボンボンドロップシール', 'プチドロップシール', 'ウォーターシール', 'おはじきシール', 'タイルシール', '平面シール'];
export const DEFAULT_POST_CHARACTERS = ['たまごっち', 'サンリオ', 'ディズニー', 'しずくちゃん', '平成ファンシー', 'メゾピアノ'];
export const POST_SHOPS = ['東急ハンズ', 'LOFT', 'ドンキホーテ', '雑貨屋', 'イオン', 'ビレッジバンガード'];
export const STICKER_DESIGNS = ['たまごっち', 'サンリオ', 'ディズニー', 'しずくちゃん', '平成ファンシー', 'メゾピアノ'];
export const AREAS = ['新宿', '渋谷', '池袋', '原宿', '表参道', '六本木', '銀座', '秋葉原', '上野', '浅草'];
export const PREFERRED_SHOPS = ['東急ハンズ', 'LOFT', 'ドンキホーテ', '雑貨屋', 'イオン', 'ビレッジバンガード'];
export const TIME_SLOTS = [
  '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export const PROFILE_AREAS = ['新宿', '渋谷', '池袋', '原宿', '表参道', '六本木', '銀座', '秋葉原', '上野', '浅草'];
export const PROFILE_CHARACTERS = ['たまごっち', 'サンリオ', 'ディズニー', 'しずくちゃん', '平成ファンシー', 'メゾピアノ'];

export const NOTIFICATION_TIME_SLOTS = [
  { key: 'morning' as const,   label: '朝',   range: '6:00〜11:00' },
  { key: 'afternoon' as const, label: '昼',   range: '11:00〜15:00' },
  { key: 'evening' as const,   label: '夕方', range: '15:00〜19:00' },
  { key: 'night' as const,     label: '夜',   range: '19:00〜24:00' },
];

