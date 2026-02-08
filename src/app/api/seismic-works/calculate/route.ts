import { NextRequest, NextResponse } from 'next/server';
import { calculateSeismicRequestSchema } from '../types';
import { SEISMIC_WORK_TYPES, calculateSeismicAmount, calculateDeductibleAmount } from '@/lib/seismic-work-types';
import type { SeismicCalculationResult } from '../types';

/**
 * POST /api/seismic-works/calculate
 * 耐震改修工事の金額を計算
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = calculateSeismicRequestSchema.safeParse(body);
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
      const workType = SEISMIC_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateSeismicAmount(
        workType.unitPrice,
        work.quantity,
        work.ratio
      );

      return {
        workTypeCode: workType.code,
        workName: workType.name,
        unitPrice: workType.unitPrice,
        unit: workType.unit,
        quantity: work.quantity,
        ratio: work.ratio,
        calculatedAmount,
      };
    });

    // 合計金額
    const totalAmount = calculatedWorks.reduce((sum, work) => sum + work.calculatedAmount, 0);

    // 控除対象額（合計 - 補助金、最大250万円、50万円超）
    const deductibleAmount = calculateDeductibleAmount(totalAmount, subsidyAmount);

    const result: SeismicCalculationResult = {
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
    console.error('Error calculating seismic works:', error);
    return NextResponse.json(
      {
        success: false,
        error: '計算処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
