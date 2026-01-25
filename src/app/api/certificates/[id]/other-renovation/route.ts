import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateOtherRenovation,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/other-renovation
 * その他増改築等工事の取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const works = await prisma.otherRenovationWork.findMany({
      where: { certificateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await prisma.otherRenovationSummary.findUnique({
      where: { certificateId: id },
    });

    return NextResponse.json({
      success: true,
      data: {
        works,
        summary,
      },
    });
  } catch (error) {
    console.error('Other renovation GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch other renovation data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/:id/other-renovation
 * その他増改築等工事の保存・計算
 *
 * Excel参照: その他増改築シート L39, L41
 * 注意: 単価×数量ではなく、ユーザーが直接金額を入力
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const body = await request.json();
    const { works, subsidyAmount } = body;

    if (!Array.isArray(works)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: works must be an array',
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.otherRenovationWork.deleteMany({
        where: { certificateId: id },
      });

      // 全工事の合計金額を計算（居住割合を考慮）
      let totalCost = 0;
      const createdWorks = await Promise.all(
        works.map((work: any) => {
          const amount = parseFloat(work.amount);
          const residentRatio = work.ratio ? parseFloat(work.ratio) / 100 : 1.0;
          const calculatedAmount = amount * residentRatio;

          totalCost += calculatedAmount;

          return tx.otherRenovationWork.create({
            data: {
              certificateId: id,
              categoryCode: work.categoryCode,
              categoryName: work.categoryName,
              workDescription: work.workDescription || '',
              amount: amount,
              residentRatio: work.ratio ? parseFloat(work.ratio) : null,
              calculatedAmount: Math.round(calculatedAmount),
            },
          });
        })
      );

      // Excel計算ロジック: 補助金差引のみ（上限なし）
      const calculation = calculateOtherRenovation(
        totalCost,
        parseFloat(subsidyAmount || 0)
      );

      const summary = await tx.otherRenovationSummary.upsert({
        where: { certificateId: id },
        create: {
          certificateId: id,
          totalAmount: calculation.totalCost,
          subsidyAmount: parseFloat(subsidyAmount || 0),
          deductibleAmount: calculation.deductibleAmount,
        },
        update: {
          totalAmount: calculation.totalCost,
          subsidyAmount: parseFloat(subsidyAmount || 0),
          deductibleAmount: calculation.deductibleAmount,
        },
      });

      return {
        works: createdWorks,
        summary,
        calculation,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Other renovation POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save other renovation data: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id/other-renovation
 * その他増改築等工事の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      await tx.otherRenovationWork.deleteMany({
        where: { certificateId: id },
      });

      await tx.otherRenovationSummary.deleteMany({
        where: { certificateId: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Other renovation data deleted successfully',
    });
  } catch (error) {
    console.error('Other renovation DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete other renovation data',
      },
      { status: 500 }
    );
  }
}
