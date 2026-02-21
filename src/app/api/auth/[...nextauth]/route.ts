import { handlers } from '@/auth';
import { authLimiter, getClientIP, rateLimitHeaders } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export const { GET } = handlers;

// POSTハンドラーをラップしてcredentialsログインにレート制限を適用
export async function POST(request: NextRequest) {
  // credentials callback（ログイン試行）のみレート制限を適用
  if (request.nextUrl.pathname.includes('/callback/credentials')) {
    const ip = getClientIP(request);
    const result = await authLimiter.check(ip);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'ログイン試行回数が上限を超えました。しばらく待ってから再試行してください。' },
        { status: 429, headers: rateLimitHeaders(result) },
      );
    }
  }

  return handlers.POST(request);
}
