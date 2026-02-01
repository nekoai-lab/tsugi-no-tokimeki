import type { Shop } from './types';
import type { RouteProposalFormData } from './routeProposalTypes';

/**
 * 時間の比較関数
 */
export const compareTimes = (time1: string, time2: string): number => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes1 - minutes2;
};

/**
 * 時間のバリデーション
 */
export const validateTimeRange = (
    formValues: RouteProposalFormData
): { isValid: boolean; errorMessage?: string } => {
    if (formValues.customTime.trim()) {
        return { isValid: true };
    }

    if (!formValues.startTime || !formValues.endTime) {
        return { isValid: false, errorMessage: '開始時刻と終了時刻を選択してください' };
    }

    if (compareTimes(formValues.startTime, formValues.endTime) >= 0) {
        return { isValid: false, errorMessage: '終了時刻は開始時刻より後の時間を選択してください' };
    }

    const [h1, m1] = (formValues.startTime || '').split(':').map(Number);
    const [h2, m2] = (formValues.endTime || '').split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    const diffMinutes = minutes2 - minutes1;

    if (diffMinutes < 60) {
        return { isValid: false, errorMessage: '開始時刻と終了時刻の差は1時間以上必要です' };
    }

    return { isValid: true };
};

/**
 * ルート提案をフォーマット
 */
export const formatRouteProposal = (
    shops: Shop[],
    totalTime: number,
    areas: string,
    start: string,
    end: string,
    date?: string
): string => {
    const finalDate = date || '';
    const dateLabel = finalDate
        ? new Date(finalDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })
        : '今日';

    let message = `📍 ${dateLabel} ${start}〜${end}のおすすめルート\n\n`;

    shops.forEach((shop, index) => {
        message += `🏪 ${shop.time} ${shop.name}\n`;
        message += `${shop.description}\n`;
        if (shop.travelTimeFromPrevious) {
            message += `📍 前の店から徒歩${shop.travelTimeFromPrevious}分\n`;
        } else {
            message += `📍 ${areas}エリア\n`;
        }
        if (index < shops.length - 1) {
            message += '\n';
        }
    });

    message += `\n💡 合計移動時間：約${totalTime}分\n`;
    message += `💡 効率的に${shops.length}店舗回れます！`;

    return message;
};

/**
 * 日付をISO文字列に変換
 */
export const dateToISOString = (dateType: 'today' | 'tomorrow' | string): string => {
    if (dateType === 'today') {
        return new Date().toISOString().split('T')[0];
    } else if (dateType === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    } else {
        return dateType; // ISO date string
    }
};

/**
 * 日付を日本語形式にフォーマット
 */
export const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
};

