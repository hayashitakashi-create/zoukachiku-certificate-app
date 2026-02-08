import type { NextAuthConfig } from 'next-auth';

/**
 * Edge互換のAuth.js設定（Middleware用）
 * DB接続を含まないため、Edge Runtimeで安全に使用できる
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnApi = nextUrl.pathname.startsWith('/api');

      // API ルートは個別に認証ガードを行う（api/auth は NextAuth が処理）
      if (isOnApi) {
        return true;
      }

      // ログイン・登録ページは未認証でもアクセス可
      if (isOnLogin || isOnRegister) {
        if (isLoggedIn) {
          // 認証済みならトップにリダイレクト
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // それ以外のページは認証必須
      return isLoggedIn;
    },
  },
  providers: [], // auth.ts で設定
} satisfies NextAuthConfig;
