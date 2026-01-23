import { z } from 'zod';

// バリアフリー改修工事入力のバリデーションスキーマ
export const barrierFreeWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  ratio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type BarrierFreeWorkInput = z.infer<typeof barrierFreeWorkInputSchema>;

// バリアフリー改修計算リクエストのスキーマ
export const calculateBarrierFreeRequestSchema = z.object({
  works: z.array(barrierFreeWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
});

export type CalculateBarrierFreeRequest = z.infer<typeof calculateBarrierFreeRequestSchema>;

// バリアフリー改修計算結果のレスポンス
export interface BarrierFreeCalculationResult {
  works: Array<{
    workTypeCode: string;
    workName: string;
    category: string;
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
