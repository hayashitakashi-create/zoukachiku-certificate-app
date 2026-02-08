import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンス監視（本番のみサンプリング）
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // セッションリプレイ（本番のみ）
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

  // DSN未設定時はSentryを無効化
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // デバッグモード（開発時のみ）
  debug: false,
});
