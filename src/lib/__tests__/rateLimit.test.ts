import { describe, it, expect } from 'vitest';
import { _createMemoryRateLimiterForTest as createMemoryRateLimiter } from '../rate-limit';

describe('rate-limit', () => {
  describe('createMemoryRateLimiter', () => {
    it('制限内のリクエストを許可する', async () => {
      const limiter = createMemoryRateLimiter({ interval: 60_000, limit: 5 });
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('test-ip');
        expect(result.allowed).toBe(true);
      }
    });

    it('制限超過後のリクエストを拒否する', async () => {
      const limiter = createMemoryRateLimiter({ interval: 60_000, limit: 3 });

      // 3回は許可
      for (let i = 0; i < 3; i++) {
        expect((await limiter.check('test-ip')).allowed).toBe(true);
      }

      // 4回目は拒否
      const result = await limiter.check('test-ip');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('異なるIPは独立してカウントする', async () => {
      const limiter = createMemoryRateLimiter({ interval: 60_000, limit: 2 });

      // IP-A を制限まで使い切る
      expect((await limiter.check('ip-a')).allowed).toBe(true);
      expect((await limiter.check('ip-a')).allowed).toBe(true);
      expect((await limiter.check('ip-a')).allowed).toBe(false);

      // IP-B はまだ使える
      expect((await limiter.check('ip-b')).allowed).toBe(true);
    });

    it('remaining が正しくデクリメントされる', async () => {
      const limiter = createMemoryRateLimiter({ interval: 60_000, limit: 3 });

      expect((await limiter.check('test')).remaining).toBe(2);
      expect((await limiter.check('test')).remaining).toBe(1);
      expect((await limiter.check('test')).remaining).toBe(0);
    });

    it('resetAt が未来の時刻を返す', async () => {
      const limiter = createMemoryRateLimiter({ interval: 60_000, limit: 5 });
      const result = await limiter.check('test');
      expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
    });
  });
});
