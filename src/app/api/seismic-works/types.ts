import { z } from 'zod';

// 耐震改修工事入力のバリデーションスキーマ
export const seismicWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  ratio: z.number().min(0).max(100).optional(), // 0-100%
});

export type SeismicWorkInput = z.infer<typeof seismicWorkInputSchema>;

// 耐震改修計算リクエストのスキーマ
export const calculateSeismicRequestSchema = z.object({
  works: z.array(seismicWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
});

export type CalculateSeismicRequest = z.infer<typeof calculateSeismicRequestSchema>;

// 耐震改修計算結果のレスポンス
export interface SeismicCalculationResult {
  works: Array<{
    workTypeCode: string;
    workName: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    ratio?: number;
    calculatedAmount: number;
  }>;
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  isEligible: boolean; // 50万円超かどうか
}
