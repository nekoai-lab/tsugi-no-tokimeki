import { z } from 'zod';

export interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
}

export type Step = 'areas' | 'date' | 'stickerType' | 'stickerDesign' | 'time' | 'shops' | 'complete';

// Zodスキーマ定義
export const routeProposalSchema = z.object({
    areas: z.array(z.string()),
    customArea: z.string(),
    selectedDate: z.string(), // "today" | "tomorrow" | ISO date string
    customDate: z.string(),
    stickerType: z.string(),
    customStickerType: z.string(),
    stickerDesign: z.string(),
    customStickerDesign: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    customTime: z.string(),
    preferredShops: z.array(z.string()),
    customShop: z.string(),
}).refine(
    (data) => data.areas.length > 0 || data.customArea.trim().length > 0,
    { message: 'エリアを選択するか、カスタム入力してください', path: ['areas'] }
).refine(
    (data) => data.selectedDate.length > 0 || data.customDate.trim().length > 0,
    { message: '日付を選択してください', path: ['selectedDate'] }
).refine(
    (data) => data.stickerType.length > 0 || data.customStickerType.trim().length > 0,
    { message: 'シールの種類を選択するか、カスタム入力してください', path: ['stickerType'] }
).refine(
    (data) => data.stickerDesign.length > 0 || data.customStickerDesign.trim().length > 0,
    { message: 'シールの柄を選択するか、カスタム入力してください', path: ['stickerDesign'] }
).refine(
    (data) => {
        if (data.customTime.trim().length > 0) return true;
        return data.startTime.length > 0 && data.endTime.length > 0;
    },
    { message: '時間を選択するか、カスタム入力してください', path: ['startTime'] }
);

export type RouteProposalFormData = z.infer<typeof routeProposalSchema>;

export interface RouteProposalModalProps {
    onClose: () => void;
    onConfirm?: () => void;
    selectedDate?: string; // "2026-02-01"
}

