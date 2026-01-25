import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateEnergyRenovation,
  type WorkItem,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/energy
 * 省エネ改修工事の取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const works = await prisma.energySavingWork.findMany({
      where: { certificateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await prisma.energySavingSummary.findUnique({
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
    console.error('Energy renovation GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch energy renovation data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/:id/energy
 * 省エネ改修工事の保存・計算
 *
 * Excel参照: 省エネ改修シート J51, J53, F39
 * 上限: 太陽光有=350万円、無=250万円、50万円超要件
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
    const { works, subsidyAmount, hasSolarPanel } = body;

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
      await tx.energySavingWork.deleteMany({
        where: { certificateId: id },
      });

      const workItems: WorkItem[] = works.map((work: any) => ({
        unitPrice: parseFloat(work.unitPrice),
        quantity: parseFloat(work.quantity),
        residentRatio: work.residentRatio ? parseFloat(work.residentRatio) / 100 : undefined,
        windowAreaRatio: work.windowRatio ? parseFloat(work.windowRatio) / 100 : undefined,
      }));

      // Excel計算ロジック: 50万円超要件、太陽光有無で上限変動
      const calculation = calculateEnergyRenovation(
        workItems,
        parseFloat(subsidyAmount || 0),
        Boolean(hasSolarPanel)
      );

      const createdWorks = await Promise.all(
        works.map((work: any, index: number) => {
          const item = workItems[index];
          const calculatedAmount =
            item.unitPrice *
            item.quantity *
            (item.residentRatio ?? 1.0) *
            (item.windowAreaRatio ?? 1.0);

          return tx.energySavingWork.create({
            data: {
              certificateId: id,
              workTypeCode: work.workTypeCode,
              workName: work.workName,
              category: work.category || '窓',
              regionCode: work.regionCode || null,
              unitPrice: item.unitPrice,
              unit: work.unit,
              quantity: item.quantity,
              windowRatio: work.windowRatio ? parseFloat(work.windowRatio) : null,
              residentRatio: work.residentRatio ? parseFloat(work.residentRatio) : null,
              calculatedAmount: Math.round(calculatedAmount),
            },
          });
        })
      );

      const summary = await tx.energySavingSummary.upsert({
        where: { certificateId: id },
        create: {
          certificateId: id,
          totalAmount: calculation.totalCost,
          subsidyAmount: parseFloat(subsidyAmount || 0),
          deductibleAmount: calculation.deductibleAmount,
          hasSolarPower: Boolean(hasSolarPanel),
        },
        update: {
          totalAmount: calculation.totalCost,
          subsidyAmount: parseFloat(subsidyAmount || 0),
          deductibleAmount: calculation.deductibleAmount,
          hasSolarPower: Boolean(hasSolarPanel),
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
    console.error('Energy renovation POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save energy renovation data: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id/energy
 * 省エネ改修工事の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      await tx.energySavingWork.deleteMany({
        where: { certificateId: id },
      });

      await tx.energySavingSummary.deleteMany({
        where: { certificateId: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Energy renovation data deleted successfully',
    });
  } catch (error) {
    console.error('Energy renovation DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete energy renovation data',
      },
      { status: 500 }
    );
  }
}
