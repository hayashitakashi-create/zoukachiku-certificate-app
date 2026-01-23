import { z } from 'zod';

// 省エネ改修工事入力のバリデーションスキーマ
export const energySavingWorkInputSchema = z.object({
  workTypeCode: z.string().min(1, '工事種別は必須です'),
  quantity: z.number().positive('数量は正の数である必要があります'),
  windowRatio: z.number().min(0).max(100).optional(), // 0-100%（窓面積割合、窓工事の場合のみ）
  residentRatio: z.number().min(0).max(100).optional(), // 0-100%（居住用部分の割合）
});

export type EnergySavingWorkInput = z.infer<typeof energySavingWorkInputSchema>;

// 省エネ改修計算リクエストのスキーマ
export const calculateEnergySavingRequestSchema = z.object({
  works: z.array(energySavingWorkInputSchema),
  subsidyAmount: z.number().min(0).default(0),
  floorArea: z.number().positive().optional(), // 家屋の床面積（窓工事の計算に必要な場合）
});

export type CalculateEnergySavingRequest = z.infer<typeof calculateEnergySavingRequestSchema>;

// 省エネ改修計算結果のレスポンス
export interface EnergySavingCalculationResult {
  works: Array<{
    workTypeCode: string;
    workName: string;
    category: string;
    regionCode?: string;
    unitPrice: number;
    unit: string;
    quantity: number;
    windowRatio?: number;
    residentRatio?: number;
    calculatedAmount: number;
  }>;
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  hasSolarPower: boolean; // 太陽光発電併設か（上限350万円か250万円か）
  isEligible: boolean; // 50万円超かどうか
}
