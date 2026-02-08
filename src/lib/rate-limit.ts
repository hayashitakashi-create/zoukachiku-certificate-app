/**
 * APIレートリミッター
 *
 * Vercel KV（Redis）が設定されている場合はそちらを使用。
 * 未設定の場合はインメモリにフォールバック（開発環境用）。
 *
 * Vercel KV を有効化するには:
 *   1. Vercel ダッシュボード → Storage → KV Database を作成
 *   2. 環境変数 KV_REST_API_URL, KV_REST_API_TOKEN が自動設定される
 *
 * 使い方:
 *   const result = await apiLimiter.check(identifier);
 *   if (!result.allowed) return NextResponse.json(..., { status: 429 });
 */

import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// ===== 型定義 =====

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimiterInstance {
  check(identifier: string): Promise<RateLimitResult>;
}

// ===== KV接続判定 =====

const isKvConfigured = !!(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

// ===== Vercel KV版（本番用） =====

function createKvRateLimiter(config: {
  prefix: string;
  limit: number;
  window: string;
}): RateLimiterInstance {
  const limiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(config.limit, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: `ratelimit:${config.prefix}`,
  });

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const result = await limiter.limit(identifier);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    },
  };
}

// ===== インメモリ版（開発環境フォールバック） =====

function createMemoryRateLimiter(config: {
  interval: number;
  limit: number;
}): RateLimiterInstance {
  const { interval, limit } = config;
  const store = new Map<string, { tokens: number; lastRefill: number }>();

  // 古いエントリを定期的にクリーンアップ（メモリリーク防止）
  const CLEANUP_INTERVAL = 5 * 60_000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    const expiry = now - interval * 2;
    for (const [key, entry] of store) {
      if (entry.lastRefill < expiry) {
        store.delete(key);
      }
    }
  }

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      cleanup();

      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry) {
        store.set(identifier, { tokens: limit - 1, lastRefill: now });
        return { allowed: true, remaining: limit - 1, resetAt: now + interval };
      }

      const elapsed = now - entry.lastRefill;
      const refillCount = Math.floor(elapsed / interval) * limit;

      if (refillCount > 0) {
        entry.tokens = Math.min(limit, entry.tokens + refillCount);
        entry.lastRefill = now;
      }

      if (entry.tokens > 0) {
        entry.tokens -= 1;
        return {
          allowed: true,
          remaining: entry.tokens,
          resetAt: entry.lastRefill + interval,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.lastRefill + interval,
      };
    },
  };
}

// ===== ファクトリ =====

function createRateLimiter(config: {
  prefix: string;
  limit: number;
  intervalMs: number;
  window: string;
}): RateLimiterInstance {
  if (isKvConfigured) {
    return createKvRateLimiter({
      prefix: config.prefix,
      limit: config.limit,
      window: config.window,
    });
  }

  // KV未設定時はインメモリフォールバック（開発環境）
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[rate-limit] KV未設定のためインメモリフォールバックを使用中 (${config.prefix})`
    );
  }
  return createMemoryRateLimiter({
    interval: config.intervalMs,
    limit: config.limit,
  });
}

// ===== プリセット =====

/** 一般API用: 60リクエスト/分 */
export const apiLimiter = createRateLimiter({
  prefix: 'api',
  limit: 60,
  intervalMs: 60_000,
  window: '1 m',
});

/** 認証API用: 10リクエスト/分（ブルートフォース防止） */
export const authLimiter = createRateLimiter({
  prefix: 'auth',
  limit: 10,
  intervalMs: 60_000,
  window: '1 m',
});

/** PDF生成用: 10リクエスト/分（負荷が高い処理） */
export const pdfLimiter = createRateLimiter({
  prefix: 'pdf',
  limit: 10,
  intervalMs: 60_000,
  window: '1 m',
});

// ===== ヘルパー =====

/**
 * リクエストからIPアドレスを取得
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

/**
 * レートリミットヘッダーをレスポンスに追加
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

// テスト用エクスポート
export { createMemoryRateLimiter as _createMemoryRateLimiterForTest };

// 型エクスポート
export type { RateLimitResult, RateLimiterInstance };
