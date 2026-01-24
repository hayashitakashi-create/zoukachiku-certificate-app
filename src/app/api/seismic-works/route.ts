import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 工事データの保存スキーマ
const saveSeismicWorksSchema = z.object({
  certificateId: z.string().min(1, '証明書IDが必要です'),
  works: z.array(
    z.object({
      workTypeCode: z.string(),
      workName: z.string(),
      unitPrice: z.number(),
      unit: z.string(),
      quantity: z.number(),
      ratio: z.number().optional(),
      calculatedAmount: z.number(),
    })
  ).min(1, '少なくとも1つの工事が必要です'),
});

/**
 * POST /api/seismic-works
 * 耐震改修工事データを証明書に保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = saveSeismicWorksSchema.safeParse(body);
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

    const { certificateId, works } = validationResult.data;

    // 証明書が存在するか確認
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
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

    // 既存の耐震改修工事データを削除（上書き保存）
    await prisma.seismicWork.deleteMany({
      where: { certificateId },
    });

    // 新しい工事データを保存
    const createdWorks = await prisma.seismicWork.createMany({
      data: works.map((work) => ({
        certificateId,
        workTypeCode: work.workTypeCode,
        workName: work.workName,
        unitPrice: work.unitPrice,
        unit: work.unit,
        quantity: work.quantity,
        ratio: work.ratio || null,
        calculatedAmount: work.calculatedAmount,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `${createdWorks.count}件の工事データを保存しました`,
      data: {
        certificateId,
        count: createdWorks.count,
      },
    });
  } catch (error) {
    console.error('Error saving seismic works:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save seismic works',
      },
      { status: 500 }
    );
  }
}
