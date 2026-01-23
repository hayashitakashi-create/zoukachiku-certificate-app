import { NextRequest, NextResponse } from 'next/server';
import { calculateOtherRenovationRequestSchema } from '../types';
import {
  OTHER_RENOVATION_CATEGORIES,
  calculateOtherRenovationAmount,
  calculateOtherRenovationDeductibleAmount,
} from '@/lib/other-renovation-work-types';
import type { OtherRenovationCalculationResult } from '../types';

/**
 * POST /api/other-renovation-works/calculate
 * その他増改築工事の金額を計算
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = calculateOtherRenovationRequestSchema.safeParse(body);
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
      const category = OTHER_RENOVATION_CATEGORIES.find((cat) => cat.code === work.categoryCode);

      if (!category) {
        throw new Error(`Invalid category code: ${work.categoryCode}`);
      }

      const calculatedAmount = calculateOtherRenovationAmount(
        work.amount,
        work.residentRatio
      );

      return {
        categoryCode: category.code,
        categoryName: category.name,
        workDescription: work.workDescription,
        amount: work.amount,
        residentRatio: work.residentRatio,
        calculatedAmount,
      };
    });

    // 合計金額
    const totalAmount = calculatedWorks.reduce((sum, work) => sum + work.calculatedAmount, 0);

    // 控除対象額（合計 - 補助金）
    const deductibleAmount = calculateOtherRenovationDeductibleAmount(totalAmount, subsidyAmount);

    const result: OtherRenovationCalculationResult = {
      works: calculatedWorks,
      totalAmount,
      subsidyAmount,
      deductibleAmount,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating other renovation works:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate',
      },
      { status: 500 }
    );
  }
}
