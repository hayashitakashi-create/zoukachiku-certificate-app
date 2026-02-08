import { NextRequest, NextResponse } from 'next/server';
import { calculateChildcareRequestSchema } from '../types';
import {
  CHILDCARE_WORK_TYPES,
  calculateChildcareAmount,
  calculateChildcareDeductibleAmount,
} from '@/lib/childcare-work-types';
import { requireAuth } from '@/lib/auth-guard';
import type { ChildcareCalculationResult } from '../types';

/**
 * POST /api/childcare-works/calculate
 * 子育て対応改修工事の金額を計算（認証必須）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    // バリデーション
    const validationResult = calculateChildcareRequestSchema.safeParse(body);
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
      const workType = CHILDCARE_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateChildcareAmount(
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
    const deductibleAmount = calculateChildcareDeductibleAmount(totalAmount, subsidyAmount);

    const result: ChildcareCalculationResult = {
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
    console.error('Error calculating childcare works:', error);
    return NextResponse.json(
      {
        success: false,
        error: '計算処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
