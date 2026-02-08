import { NextRequest, NextResponse } from 'next/server';
import { calculateLongTermHousingRequestSchema } from '../types';
import {
  LONG_TERM_HOUSING_WORK_TYPES,
  calculateLongTermHousingAmount,
  calculateLongTermHousingDeductibleAmount,
} from '@/lib/long-term-housing-work-types';
import { requireAuth } from '@/lib/auth-guard';
import type { LongTermHousingCalculationResult } from '../types';

/**
 * POST /api/long-term-housing-works/calculate
 * 長期優良住宅化改修工事の金額を計算（認証必須）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    // バリデーション
    const validationResult = calculateLongTermHousingRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { works, subsidyAmount, isExcellentHousing } = validationResult.data;

    // 各工事の計算
    const calculatedWorks = works.map((work) => {
      const workType = LONG_TERM_HOUSING_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateLongTermHousingAmount(
        workType.unitPrice,
        work.quantity,
        work.residentRatio
      );

      return {
        workTypeCode: workType.code,
        workName: workType.name,
        category: workType.category,
        unitPrice: workType.unitPrice,
        unit: workType.unit,
        quantity: work.quantity,
        residentRatio: work.residentRatio,
        calculatedAmount,
      };
    });

    // 合計金額
    const totalAmount = calculatedWorks.reduce((sum, work) => sum + work.calculatedAmount, 0);

    // 控除対象額（合計 - 補助金、最大250万円 or 500万円、50万円超）
    const deductibleAmount = calculateLongTermHousingDeductibleAmount(
      totalAmount,
      subsidyAmount,
      isExcellentHousing
    );

    const result: LongTermHousingCalculationResult = {
      works: calculatedWorks,
      totalAmount,
      subsidyAmount,
      deductibleAmount,
      isExcellentHousing,
      isEligible: (totalAmount - subsidyAmount) > 500000, // 50万円超かどうか
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating long-term housing works:', error);
    return NextResponse.json(
      {
        success: false,
        error: '計算処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
