import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import {
  calculateChildcareRenovation,
  type WorkItem,
} from '@/lib/renovationCalculator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/childcare
 * 子育て対応改修工事の取得（認証必須）
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

    const works = await prisma.childcareWork.findMany({
      where: { certificateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const summary = await prisma.childcareSummary.findUnique({
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
    console.error('Childcare renovation GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch childcare renovation data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/:id/childcare
 * 子育て対応改修工事の保存・計算
 *
 * Excel参照: 子育て対応シート I59, I61
 * 上限: 250万円、50万円超要件
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

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

    // アクセス制御
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
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
      await tx.childcareWork.deleteMany({
        where: { certificateId: id },
      });

      const workItems: WorkItem[] = works.map((work: any) => ({
        unitPrice: parseFloat(work.unitPrice),
        quantity: parseFloat(work.quantity),
        residentRatio: work.ratio ? parseFloat(work.ratio) / 100 : undefined,
      }));

      // Excel計算ロジック: 50万円超要件、上限250万円
      const calculation = calculateChildcareRenovation(
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

          return tx.childcareWork.create({
            data: {
              certificateId: id,
              workTypeCode: work.workTypeCode,
              workName: work.workName,
              category: work.category || '家事負担軽減',
              unitPrice: item.unitPrice,
              unit: work.unit,
              quantity: item.quantity,
              residentRatio: work.ratio ? parseFloat(work.ratio) : null,
              calculatedAmount: Math.round(calculatedAmount),
            },
          });
        })
      );

      const summary = await tx.childcareSummary.upsert({
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
    console.error('Childcare renovation POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '子育て対応改修工事データの保存に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id/childcare
 * 子育て対応改修工事の削除
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
      await tx.childcareWork.deleteMany({
        where: { certificateId: id },
      });

      await tx.childcareSummary.deleteMany({
        where: { certificateId: id },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Childcare renovation data deleted successfully',
    });
  } catch (error) {
    console.error('Childcare renovation DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete childcare renovation data',
      },
      { status: 500 }
    );
  }
}
