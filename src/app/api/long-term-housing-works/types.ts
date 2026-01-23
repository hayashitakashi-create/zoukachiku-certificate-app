import { z } from 'zod';

// 長期優良住宅化改修工事入力のバリデーションスキーマ
export const longTermHousingWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  residentRatio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type LongTermHousingWorkInput = z.infer<typeof longTermHousingWorkInputSchema>;

// 長期優良住宅化改修計算リクエストのスキーマ
export const calculateLongTermHousingRequestSchema = z.object({
  works: z.array(longTermHousingWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
  isExcellentHousing: z.boolean().default(false), // 長期優良住宅認定取得
});

export type CalculateLongTermHousingRequest = z.infer<typeof calculateLongTermHousingRequestSchema>;

// 長期優良住宅化改修計算結果のレスポンス
export interface LongTermHousingCalculationResult {
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
  isExcellentHousing: boolean; // 長期優良住宅認定取得か（上限500万円か250万円か）
  isEligible: boolean; // 50万円超かどうか
}
