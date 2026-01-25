import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateOptimalCombination,
  type CombinedRenovations,
  type RenovationCalculation,
  decimalToNumber,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/calculate-combined
 * 複数の改修種別を統合計算し、最適な組み合わせを返す
 *
 * Excel参照: メイン証明書シート Row 442-460
 * - 各改修種別の結果を集約
 * - 複数パターンの組み合わせを計算
 * - 最大控除額を選択（1,000万円上限）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 証明書の存在確認
    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // 各改修種別のサマリーを取得
    const [
      seismicSummary,
      barrierFreeSummary,
      energySummary,
      cohabitationSummary,
      childcareSummary,
      otherRenovationSummary,
    ] = await Promise.all([
      prisma.seismicSummary.findUnique({ where: { certificateId: id } }),
      prisma.barrierFreeSummary.findUnique({ where: { certificateId: id } }),
      prisma.energySavingSummary.findUnique({ where: { certificateId: id } }),
      prisma.cohabitationSummary.findUnique({ where: { certificateId: id } }),
      prisma.childcareSummary.findUnique({ where: { certificateId: id } }),
      prisma.otherRenovationSummary.findUnique({ where: { certificateId: id } }),
    ]);

    // 各改修種別の計算結果をRenovationCalculation形式に変換
    const renovations: CombinedRenovations = {};

    if (seismicSummary) {
      const totalCost = decimalToNumber(seismicSummary.totalAmount);
      const subsidyAmount = decimalToNumber(seismicSummary.subsidyAmount);
      const deductibleAmount = decimalToNumber(seismicSummary.deductibleAmount);

      // Excel: エ = MIN(ウ, 2,500,000)
      const maxDeduction = Math.min(deductibleAmount, 2_500_000);

      renovations.seismic = {
        totalCost,
        afterSubsidy: totalCost - subsidyAmount,
        deductibleAmount,
        maxDeduction,
        excessAmount: Math.max(0, deductibleAmount - maxDeduction),
      };
    }

    if (barrierFreeSummary) {
      const totalCost = decimalToNumber(barrierFreeSummary.totalAmount);
      const subsidyAmount = decimalToNumber(barrierFreeSummary.subsidyAmount);
      const afterSubsidy = totalCost - subsidyAmount;

      // Excel: ウ = (ア-イ > 500,000) ? ア-イ : 0
      const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

      // Excel: エ = MIN(ウ, 2,000,000)
      const maxDeduction = Math.min(deductibleAmount, 2_000_000);

      renovations.barrierFree = {
        totalCost,
        afterSubsidy,
        deductibleAmount,
        maxDeduction,
        excessAmount: Math.max(0, deductibleAmount - maxDeduction),
      };
    }

    if (energySummary) {
      const totalCost = decimalToNumber(energySummary.totalAmount);
      const subsidyAmount = decimalToNumber(energySummary.subsidyAmount);
      const afterSubsidy = totalCost - subsidyAmount;
      const hasSolarPower = energySummary.hasSolarPower;

      // Excel: ウ = (ア-イ > 500,000) ? ア-イ : 0
      const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

      // Excel: エ = 太陽光有 ? MIN(ウ, 3,500,000) : MIN(ウ, 2,500,000)
      const limit = hasSolarPower ? 3_500_000 : 2_500_000;
      const maxDeduction = Math.min(deductibleAmount, limit);

      renovations.energy = {
        totalCost,
        afterSubsidy,
        deductibleAmount,
        maxDeduction,
        excessAmount: Math.max(0, deductibleAmount - maxDeduction),
      };
    }

    if (cohabitationSummary) {
      const totalCost = decimalToNumber(cohabitationSummary.totalAmount);
      const subsidyAmount = decimalToNumber(cohabitationSummary.subsidyAmount);
      const afterSubsidy = totalCost - subsidyAmount;

      // Excel: ウ = (ア-イ > 500,000) ? ア-イ : 0
      const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

      // Excel: エ = MIN(ウ, 2,500,000)
      const maxDeduction = Math.min(deductibleAmount, 2_500_000);

      renovations.cohabitation = {
        totalCost,
        afterSubsidy,
        deductibleAmount,
        maxDeduction,
        excessAmount: Math.max(0, deductibleAmount - maxDeduction),
      };
    }

    if (childcareSummary) {
      const totalCost = decimalToNumber(childcareSummary.totalAmount);
      const subsidyAmount = decimalToNumber(childcareSummary.subsidyAmount);
      const afterSubsidy = totalCost - subsidyAmount;

      // Excel: ウ = (ア-イ > 500,000) ? ア-イ : 0
      const deductibleAmount = afterSubsidy > 500_000 ? afterSubsidy : 0;

      // Excel: エ = MIN(ウ, 2,500,000)
      const maxDeduction = Math.min(deductibleAmount, 2_500_000);

      renovations.childcare = {
        totalCost,
        afterSubsidy,
        deductibleAmount,
        maxDeduction,
        excessAmount: Math.max(0, deductibleAmount - maxDeduction),
      };
    }

    if (otherRenovationSummary) {
      const totalCost = decimalToNumber(otherRenovationSummary.totalAmount);
      const subsidyAmount = decimalToNumber(otherRenovationSummary.subsidyAmount);
      const deductibleAmount = decimalToNumber(otherRenovationSummary.deductibleAmount);

      renovations.other = {
        totalCost,
        afterSubsidy: totalCost - subsidyAmount,
        deductibleAmount,
        maxDeduction: deductibleAmount, // その他増改築は個別上限なし
        excessAmount: 0,
      };
    }

    // Excel Row 442-460: 最適な組み合わせを計算
    const optimalCombination = calculateOptimalCombination(renovations);

    // レスポンス
    return NextResponse.json({
      success: true,
      data: {
        // 各改修種別の詳細
        renovations,

        // 統合計算結果
        combined: {
          // ⑱ 最大工事費（補助金差引後）
          totalDeductible: optimalCombination.totalDeductible,

          // ⑰ 最大控除額（10%控除分、1,000万円上限適用済み）
          maxControlAmount: optimalCombination.maxControlAmount,

          // ⑲ 超過額
          excessAmount: optimalCombination.excessAmount,

          // ㉑ 最終控除対象額（⑱とその他増改築の合算）
          finalDeductible: optimalCombination.finalDeductible,

          // ㉒ 残り控除可能額（1,000万円 - ⑰）
          remaining: optimalCombination.remaining,
        },

        // サマリー（わかりやすく整形）
        summary: {
          hasRenovations: Object.keys(renovations).length > 0,
          renovationTypes: Object.keys(renovations),
          totalWorkCost: optimalCombination.totalDeductible,
          maxTaxDeduction: optimalCombination.maxControlAmount,
          remainingLimit: optimalCombination.remaining,
        },
      },
    });
  } catch (error) {
    console.error('Combined calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate combined renovations: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
