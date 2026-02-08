import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * APIルート用の認証ガード
 * 認証されていない場合は401を返す
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: '認証が必要です。ログインしてください。' },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true as const,
    session,
    userId: session.user.id,
    role: (session.user as { role?: string }).role ?? 'architect',
  };
}

/**
 * 管理者権限チェック
 */
export async function requireAdmin() {
  const result = await requireAuth();

  if (!result.authorized) {
    return result;
  }

  if (result.role !== 'admin') {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: '管理者権限が必要です。' },
        { status: 403 }
      ),
    };
  }

  return result;
}
