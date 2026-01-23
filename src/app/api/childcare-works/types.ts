import { z } from 'zod';

// 子育て対応改修工事入力のバリデーションスキーマ
export const childcareWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  residentRatio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type ChildcareWorkInput = z.infer<typeof childcareWorkInputSchema>;

// 子育て対応改修計算リクエストのスキーマ
export const calculateChildcareRequestSchema = z.object({
  works: z.array(childcareWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
});

export type CalculateChildcareRequest = z.infer<typeof calculateChildcareRequestSchema>;

// 子育て対応改修計算結果のレスポンス
export interface ChildcareCalculationResult {
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
