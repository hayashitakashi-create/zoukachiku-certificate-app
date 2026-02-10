import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
