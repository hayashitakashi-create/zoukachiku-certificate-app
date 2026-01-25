import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateBarrierFreeRenovation,
  type WorkItem,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/barrier-free
 * バリアフリー改修工事の取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const works = await prisma.barrierFreeWork.findMany({
      where: { certificateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await prisma.barrierFreeSummary.findUnique({
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
    console.error('Barrier-free renovation GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch barrier-free renovation data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/:id/barrier-free
 * バリアフリー改修工事の保存・計算
 *
 * Excel参照: バリアフリー改修シート H51, H53
 * 上限: 200万円、50万円超要件
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
      await tx.barrierFreeWork.deleteMany({
        where: { certificateId: id },
      });

      const workItems: WorkItem[] = works.map((work: any) => ({
        unitPrice: parseFloat(work.unitPrice),
        quantity: parseFloat(work.quantity),
        residentRatio: work.ratio ? parseFloat(work.ratio) / 100 : undefined,
      }));

      // Excel計算ロジック: 50万円超要件、上限200万円
      const calculation = calculateBarrierFreeRenovation(
        workItems,
        parseFloat(subsidyAmount || 0)
      );

      const createdWorks = await Promise.all(
        works.map((work: any, index: number) => {
          const item = workItems[index];
          const calculatedAmount =
            item.unitPrice *
            item.quantity *
            (item.residentRatio ?? 1.0);

          return tx.barrierFreeWork.create({
            data: {
              certificateId: id,
              workTypeCode: work.workTypeCode,
              workName: work.workName,
              unitPrice: item.unitPrice,
              unit: work.unit,
              quantity: item.quantity,
              ratio: work.ratio ? parseFloat(work.ratio) : null,
              calculatedAmount: Math.round(calculatedAmount),
            },
          });
        })
      );

      const summary = await tx.barrierFreeSummary.upsert({
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
    console.error('Barrier-free renovation POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save barrier-free renovation data: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id/barrier-free
 * バリアフリー改修工事の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      await tx.barrierFreeWork.deleteMany({
        where: { certificateId: id },
      });

      await tx.barrierFreeSummary.deleteMany({
        where: { certificateId: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Barrier-free renovation data deleted successfully',
    });
  } catch (error) {
    console.error('Barrier-free renovation DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete barrier-free renovation data',
      },
      { status: 500 }
    );
  }
}
