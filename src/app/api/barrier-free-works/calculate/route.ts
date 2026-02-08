import { NextRequest, NextResponse } from 'next/server';
import { calculateBarrierFreeRequestSchema } from '../types';
import {
  BARRIER_FREE_WORK_TYPES,
  calculateBarrierFreeAmount,
  calculateBarrierFreeDeductibleAmount,
} from '@/lib/barrier-free-work-types';
import type { BarrierFreeCalculationResult } from '../types';

/**
 * POST /api/barrier-free-works/calculate
 * バリアフリー改修工事の金額を計算
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = calculateBarrierFreeRequestSchema.safeParse(body);
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

    const { works, subsidyAmount } = validationResult.data;

    // 各工事の計算
    const calculatedWorks = works.map((work) => {
      const workType = BARRIER_FREE_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateBarrierFreeAmount(
        workType.unitPrice,
        work.quantity,
        work.ratio
      );

      return {
        workTypeCode: workType.code,
        workName: workType.name,
        category: workType.category,
        unitPrice: workType.unitPrice,
        unit: workType.unit,
        quantity: work.quantity,
        ratio: work.ratio,
        calculatedAmount,
      };
    });

    // 合計金額
    const totalAmount = calculatedWorks.reduce((sum, work) => sum + work.calculatedAmount, 0);

    // 控除対象額（合計 - 補助金、最大200万円、50万円超）
    const deductibleAmount = calculateBarrierFreeDeductibleAmount(totalAmount, subsidyAmount);

    const result: BarrierFreeCalculationResult = {
      works: calculatedWorks,
      totalAmount,
      subsidyAmount,
      deductibleAmount,
      isEligible: (totalAmount - subsidyAmount) > 500000, // 50万円超かどうか
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating barrier-free works:', error);
    return NextResponse.json(
      {
        success: false,
        error: '計算処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
