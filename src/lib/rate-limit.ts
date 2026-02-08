/**
 * インメモリ型APIレートリミッター
 *
 * トークンバケットアルゴリズムを使用。
 * 本番環境でスケールする場合はRedis等の外部ストアに置き換えること。
 *
 * 使い方:
 *   const limiter = createRateLimiter({ interval: 60_000, limit: 60 });
 *   const result = limiter.check(identifier);
 *   if (!result.allowed) return NextResponse.json(..., { status: 429 });
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** リフィル間隔（ミリ秒）。デフォルト: 60秒 */
  interval: number;
  /** 間隔あたりの最大リクエスト数。デフォルト: 60 */
  limit: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  interval: 60_000,  // 1分
  limit: 60,         // 60リクエスト/分
};

/**
 * レートリミッターを作成
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const { interval, limit } = { ...DEFAULT_CONFIG, ...config };
  const store = new Map<string, RateLimitEntry>();

  // 古いエントリを定期的にクリーンアップ（メモリリーク防止）
  const CLEANUP_INTERVAL = 5 * 60_000; // 5分ごと
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

  function check(identifier: string): RateLimitResult {
    cleanup();

    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry) {
      // 新規エントリ
      store.set(identifier, { tokens: limit - 1, lastRefill: now });
      return { allowed: true, remaining: limit - 1, resetAt: now + interval };
    }

    // トークンをリフィル
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
  }

  return { check };
}

// ===== プリセット =====

/** 一般API用: 60リクエスト/分 */
export const apiLimiter = createRateLimiter({ interval: 60_000, limit: 60 });

/** 認証API用: 10リクエスト/分（ブルートフォース防止） */
export const authLimiter = createRateLimiter({ interval: 60_000, limit: 10 });

/** PDF生成用: 10リクエスト/分（負荷が高い処理） */
export const pdfLimiter = createRateLimiter({ interval: 60_000, limit: 10 });

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
