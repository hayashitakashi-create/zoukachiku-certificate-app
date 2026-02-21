import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const VALID_ORG_TYPES = [
  'registered_architect_office',
  'designated_inspection_agency',
  'registered_evaluation_agency',
  'warranty_insurance_corporation',
] as const;

const issuerInfoSchema = z.object({
  organizationType: z.enum(VALID_ORG_TYPES),
  architectName: z.string().max(200).optional(),
  architectQualification: z.string().max(50).optional(),
  architectRegistrationNumber: z.string().max(100).optional(),
  architectRegistrationPrefecture: z.string().max(50).optional(),
  officeName: z.string().max(200).optional(),
  officeAddress: z.string().max(500).optional(),
  officeType: z.string().max(50).optional(),
  officeRegistrationDate: z.string().max(20).optional(),
  officeRegistrationNumber: z.string().max(100).optional(),
  agencyName: z.string().max(200).optional(),
  agencyAddress: z.string().max(500).optional(),
  agencyDesignationDate: z.string().max(20).optional(),
  agencyDesignationNumber: z.string().max(100).optional(),
  agencyDesignator: z.string().max(200).optional(),
  agencyRegistrationDate: z.string().max(20).optional(),
  agencyRegistrationNumber: z.string().max(100).optional(),
  agencyRegistrar: z.string().max(200).optional(),
  corporationName: z.string().max(200).optional(),
  corporationAddress: z.string().max(500).optional(),
  corporationDesignationDate: z.string().max(20).optional(),
  buildingStandardCertifier: z.string().max(50).optional(),
  certifierRegistrationNumber: z.string().max(100).optional(),
  certifierRegistrationAuthority: z.string().max(200).optional(),
}).strict();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { issuerInfo: true },
    });

    return NextResponse.json({ issuerInfo: user?.issuerInfo ?? null });
  } catch (error) {
    console.error('証明者情報取得エラー:', error);
    return NextResponse.json(
      { error: '証明者情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { issuerInfo } = body;

    // null の場合はクリア、それ以外はバリデーション
    if (issuerInfo !== null && issuerInfo !== undefined) {
      const parsed = issuerInfoSchema.safeParse(issuerInfo);
      if (!parsed.success) {
        return NextResponse.json(
          { error: '入力データが不正です', details: parsed.error.flatten() },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { issuerInfo: issuerInfo ?? null },
      select: { issuerInfo: true },
    });

    return NextResponse.json({ issuerInfo: user.issuerInfo });
  } catch (error) {
    console.error('証明者情報更新エラー:', error);
    return NextResponse.json(
      { error: '証明者情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}
