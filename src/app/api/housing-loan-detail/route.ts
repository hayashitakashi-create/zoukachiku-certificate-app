import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// 住宅借入金等特別控除の詳細保存スキーマ
const saveHousingLoanDetailSchema = z.object({
  certificateId: z.string().min(1, '証明書IDが必要です'),
  workTypes: z.object({}).passthrough(), // JSON形式で保存（任意のプロパティを許可）
  workDescription: z.string().optional(),
  totalCost: z.number().min(0),
  hasSubsidy: z.boolean(),
  subsidyAmount: z.number().min(0),
  deductibleAmount: z.number(),
});

/**
 * POST /api/housing-loan-detail
 * 住宅借入金等特別控除の詳細情報を証明書に保存（認証必須）
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();

    // バリデーション
    const validationResult = saveHousingLoanDetailSchema.safeParse(body);
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

    const {
      certificateId,
      workTypes,
      workDescription,
      totalCost,
      hasSubsidy,
      subsidyAmount,
      deductibleAmount,
    } = validationResult.data;

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

    // アクセス制御
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
    }

    // 既存の住宅借入金等詳細データを確認
    const existingDetail = await prisma.housingLoanDetail.findUnique({
      where: { certificateId },
    });

    let savedDetail;

    if (existingDetail) {
      // 既存データを更新
      savedDetail = await prisma.housingLoanDetail.update({
        where: { certificateId },
        data: {
          workTypes: workTypes as Prisma.InputJsonValue,
          workDescription: workDescription || null,
          totalCost,
          hasSubsidy,
          subsidyAmount,
          deductibleAmount,
        },
      });
    } else {
      // 新規作成
      savedDetail = await prisma.housingLoanDetail.create({
        data: {
          certificateId,
          workTypes: workTypes as Prisma.InputJsonValue,
          workDescription: workDescription || null,
          totalCost,
          hasSubsidy,
          subsidyAmount,
          deductibleAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: '住宅借入金等特別控除の詳細を保存しました',
      data: {
        id: savedDetail.id,
        certificateId: savedDetail.certificateId,
        deductibleAmount: savedDetail.deductibleAmount,
      },
    });
  } catch (error) {
    console.error('Error saving housing loan detail:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          '住宅借入金等特別控除の詳細保存に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/housing-loan-detail?certificateId=xxx
 * 住宅借入金等特別控除の詳細情報を取得（認証必須）
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');

    if (!certificateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate ID is required',
        },
        { status: 400 }
      );
    }

    // 証明書の所有権確認
    const certificate = await prisma.certificate.findUnique({ where: { id: certificateId } });
    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: 'この証明書へのアクセス権がありません' }, { status: 403 });
    }

    const detail = await prisma.housingLoanDetail.findUnique({
      where: { certificateId },
    });

    if (!detail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Housing loan detail not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error('Error fetching housing loan detail:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          '住宅借入金等特別控除の詳細取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
