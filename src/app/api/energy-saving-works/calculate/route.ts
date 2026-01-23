import { NextRequest, NextResponse } from 'next/server';
import { calculateEnergySavingRequestSchema } from '../types';
import {
  ENERGY_SAVING_WORK_TYPES,
  calculateEnergySavingAmount,
  calculateEnergySavingDeductibleAmount,
  hasSolarPowerWork,
} from '@/lib/energy-saving-work-types';
import type { EnergySavingCalculationResult } from '../types';

/**
 * POST /api/energy-saving-works/calculate
 * 省エネ改修工事の金額を計算
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = calculateEnergySavingRequestSchema.safeParse(body);
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
      const workType = ENERGY_SAVING_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);

      if (!workType) {
        throw new Error(`Invalid work type code: ${work.workTypeCode}`);
      }

      const calculatedAmount = calculateEnergySavingAmount(
        workType.unitPrice,
        work.quantity,
        work.windowRatio,
        work.residentRatio
      );

      return {
        workTypeCode: workType.code,
        workName: workType.name,
        category: workType.category,
        regionCode: workType.regionCode,
        unitPrice: workType.unitPrice,
        unit: workType.unit,
        quantity: work.quantity,
        windowRatio: work.windowRatio,
        residentRatio: work.residentRatio,
        calculatedAmount,
      };
    });

    // 合計金額
    const totalAmount = calculatedWorks.reduce((sum, work) => sum + work.calculatedAmount, 0);

    // 太陽光発電が含まれているかチェック
    const workCodes = works.map((w) => w.workTypeCode);
    const hasSolarPower = hasSolarPowerWork(workCodes);

    // 控除対象額（合計 - 補助金、最大250万円 or 350万円、50万円超）
    const deductibleAmount = calculateEnergySavingDeductibleAmount(
      totalAmount,
      subsidyAmount,
      hasSolarPower
    );

    const result: EnergySavingCalculationResult = {
      works: calculatedWorks,
      totalAmount,
      subsidyAmount,
      deductibleAmount,
      hasSolarPower,
      isEligible: (totalAmount - subsidyAmount) > 500000, // 50万円超かどうか
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error calculating energy-saving works:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate',
      },
      { status: 500 }
    );
  }
}
