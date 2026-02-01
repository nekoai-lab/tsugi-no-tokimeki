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

export const CHARACTERS = ['エンジェルブルー', 'メゾピアノ', 'デイジーラバーズ', 'ポンポネット', 'ブルークロス'];
export const STICKER_TYPES = ['ボンボンドロップ', 'プチドロップ', 'タイルシール', 'ノーマル'];
export const AREAS = ['新宿', '渋谷', '池袋', '東京', '横浜', '大宮'];
export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

