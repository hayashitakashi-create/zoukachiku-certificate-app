import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Edge Runtime互換のmiddleware
// auth.config.ts のみを使用（DBアダプタを含まない）
export default NextAuth(authConfig).auth;

export const config = {
  // 認証チェック対象のルート（静的ファイル・画像・faviconを除外）
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
