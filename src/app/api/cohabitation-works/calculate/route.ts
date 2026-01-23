import { NextRequest, NextResponse } from 'next/server';
import { calculateCohabitationRequestSchema } from '../types';
import {
  COHABITATION_WORK_TYPES,
  calculateCohabitationAmount,
  calculateCohabitationDeductibleAmount,
} from '@/lib/cohabitation-work-types';
import type { CohabitationCalculationResult } from '../types';

/**
 * POST /api/cohabitation-works/calculate
 * 同居対応改修工事の金額を計算
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = calculateCohabitationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { works, subsidyAmount } = validationResult.data;

    // 各工事の計算
    const calculatedWorks = works.map((work) => {
      const workType = COHABITATION_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateCohabitationAmount(
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

    // 控除対象額（合計 - 補助金、最大250万円、50万円超）
    const deductibleAmount = calculateCohabitationDeductibleAmount(totalAmount, subsidyAmount);

    const result: CohabitationCalculationResult = {
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
    console.error('Error calculating cohabitation works:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate',
      },
      { status: 500 }
    );
  }
}
