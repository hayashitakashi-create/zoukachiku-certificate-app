import { z } from 'zod';

// その他増改築工事入力のバリデーションスキーマ
export const otherRenovationWorkInputSchema = z.object({
  categoryCode: z.string().min(1, 'カテゴリは必須です'),
  workDescription: z.string().min(1, '工事の説明は必須です'),
  amount: z.number().positive('金額は正の数である必要があります'),
  residentRatio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type OtherRenovationWorkInput = z.infer<typeof otherRenovationWorkInputSchema>;

// その他増改築計算リクエストのスキーマ
export const calculateOtherRenovationRequestSchema = z.object({
  works: z.array(otherRenovationWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
});

export type CalculateOtherRenovationRequest = z.infer<typeof calculateOtherRenovationRequestSchema>;

// その他増改築計算結果のレスポンス
export interface OtherRenovationCalculationResult {
  works: Array<{
    categoryCode: string;
    categoryName: string;
    workDescription: string;
    amount: number;
    residentRatio?: number;
    calculatedAmount: number;
  }>;
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
}
