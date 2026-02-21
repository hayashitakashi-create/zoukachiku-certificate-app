import type { NextAuthConfig } from 'next-auth';

/**
 * Edge互換のAuth.js設定（Middleware用）
 *
 * 未認証ユーザーはログインページにリダイレクト。
 * ログインページの「ログインせずに使う」ボタンでスキップ可能。
 * jwt/sessionコールバックでroleをトークン・セッションに反映。
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Edge互換: JWTトークンにroleを保持（Prisma不使用）
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'architect';
      }
      return token;
    },
    // Edge互換: セッションにroleを反映
    session({ session, token }) {
      if (token && session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnSeed = nextUrl.pathname.startsWith('/seed');
      const isOnApi = nextUrl.pathname.startsWith('/api');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      // API ルート・seedページは常に許可
      if (isOnApi || isOnSeed) return true;

      // ログイン・登録ページは未認証でもアクセス可
      if (isOnLogin || isOnRegister) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // 管理画面: 認証済み + adminロールが必要
      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as { role?: string })?.role;
        if (role !== 'admin') {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      // ゲストモード: cookieで「ログインせずに使う」を選択済みか判定
      const guestMode = request.cookies.get('guest-mode')?.value === 'true';
      if (guestMode) return true;

      // 認証済みなら許可、未認証ならログインページへ
      return isLoggedIn;
    },
  },
  providers: [], // auth.ts で設定
};
