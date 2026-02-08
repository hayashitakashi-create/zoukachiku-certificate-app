import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import {
  calculateSeismicRenovation,
  type WorkItem,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/seismic
 * 耐震改修工事の取得（認証必須）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;

    // 証明書の所有権確認
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
    }

    const works = await prisma.seismicWork.findMany({
      where: { certificateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await prisma.seismicSummary.findUnique({
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
    console.error('Seismic renovation GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch seismic renovation data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/:id/seismic
 * 耐震改修工事の保存・計算
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

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

    // アクセス制御
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
    }

    const body = await request.json();
    const { works, subsidyAmount } = body;

    // バリデーション
    if (!Array.isArray(works)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: works must be an array',
        },
        { status: 400 }
      );
    }

    // トランザクション内で処理
    const result = await prisma.$transaction(async (tx) => {
      // 既存の工事データを削除
      await tx.seismicWork.deleteMany({
        where: { certificateId: id },
      });

      // 計算用のWorkItem配列を作成
      const workItems: WorkItem[] = works.map((work: any) => ({
        unitPrice: parseFloat(work.unitPrice),
        quantity: parseFloat(work.quantity),
        residentRatio: work.ratio ? parseFloat(work.ratio) / 100 : undefined,
      }));

      // 控除額を計算
      const calculation = calculateSeismicRenovation(
        workItems,
        parseFloat(subsidyAmount || 0)
      );

      // 工事データを保存
      const createdWorks = await Promise.all(
        works.map((work: any, index: number) => {
          const item = workItems[index];
          const calculatedAmount =
            item.unitPrice *
            item.quantity *
            (item.residentRatio ?? 1.0);

          return tx.seismicWork.create({
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

      // サマリーを保存（upsert）
      const summary = await tx.seismicSummary.upsert({
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
    console.error('Seismic renovation POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '耐震改修工事データの保存に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id/seismic
 * 耐震改修工事の削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;

    // 証明書の所有権確認
    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.seismicWork.deleteMany({
        where: { certificateId: id },
      });

      await tx.seismicSummary.deleteMany({
        where: { certificateId: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Seismic renovation data deleted successfully',
    });
  } catch (error) {
    console.error('Seismic renovation DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete seismic renovation data',
      },
      { status: 500 }
    );
  }
}
