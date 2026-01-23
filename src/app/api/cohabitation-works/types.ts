import { z } from 'zod';

// 同居対応改修工事入力のバリデーションスキーマ
export const cohabitationWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  residentRatio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type CohabitationWorkInput = z.infer<typeof cohabitationWorkInputSchema>;

// 同居対応改修計算リクエストのスキーマ
export const calculateCohabitationRequestSchema = z.object({
  works: z.array(cohabitationWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
});

export type CalculateCohabitationRequest = z.infer<typeof calculateCohabitationRequestSchema>;

// 同居対応改修計算結果のレスポンス
export interface CohabitationCalculationResult {
  works: Array<{
    workTypeCode: string;
    workName: string;
    category: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    residentRatio?: number;
    calculatedAmount: number;
  }>;
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  isEligible: boolean; // 50万円超かどうか
}
