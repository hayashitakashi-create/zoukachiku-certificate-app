import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../rate-limit';

describe('rate-limit', () => {
  describe('createRateLimiter', () => {
    it('制限内のリクエストを許可する', () => {
      const limiter = createRateLimiter({ interval: 60_000, limit: 5 });
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('test-ip');
        expect(result.allowed).toBe(true);
      }
    });

    it('制限超過後のリクエストを拒否する', () => {
      const limiter = createRateLimiter({ interval: 60_000, limit: 3 });

      // 3回は許可
      for (let i = 0; i < 3; i++) {
        expect(limiter.check('test-ip').allowed).toBe(true);
      }

      // 4回目は拒否
      const result = limiter.check('test-ip');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('異なるIPは独立してカウントする', () => {
      const limiter = createRateLimiter({ interval: 60_000, limit: 2 });

      // IP-A を制限まで使い切る
      expect(limiter.check('ip-a').allowed).toBe(true);
      expect(limiter.check('ip-a').allowed).toBe(true);
      expect(limiter.check('ip-a').allowed).toBe(false);

      // IP-B はまだ使える
      expect(limiter.check('ip-b').allowed).toBe(true);
    });

    it('remaining が正しくデクリメントされる', () => {
      const limiter = createRateLimiter({ interval: 60_000, limit: 3 });

      expect(limiter.check('test').remaining).toBe(2);
      expect(limiter.check('test').remaining).toBe(1);
      expect(limiter.check('test').remaining).toBe(0);
    });

    it('resetAt が未来の時刻を返す', () => {
      const limiter = createRateLimiter({ interval: 60_000, limit: 5 });
      const result = limiter.check('test');
      expect(result.resetAt).toBeGreaterThan(Date.now() - 1000);
    });
  });
});
