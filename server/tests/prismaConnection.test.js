import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isConnectionError, withConnectionRetry } from '../src/lib/prisma.js';
import { invalidateUserCache } from '../src/middleware/auth.middleware.js';

describe('Prisma Connection & Pool Resiliency', () => {
  it('correctly identifies P2024 connection pool timeout as retryable', () => {
    const poolTimeoutError = {
      code: 'P2024',
      name: 'PrismaClientKnownRequestError',
      message: 'Timed out fetching a new connection from the connection pool. (Current connection pool timeout: 10, connection limit: 5)',
    };
    assert.strictEqual(isConnectionError(poolTimeoutError), true);
  });

  it('correctly identifies P1001, P1002, P1008, P1017 as retryable', () => {
    for (const code of ['P1001', 'P1002', 'P1008', 'P1017']) {
      assert.strictEqual(isConnectionError({ code }), true, `Expected ${code} to be retryable`);
    }
  });

  it('identifies transient network / socket errors as retryable', () => {
    assert.strictEqual(isConnectionError(new Error('Connection lost to database')), true);
    assert.strictEqual(isConnectionError(new Error('read ECONNRESET')), true);
    assert.strictEqual(isConnectionError(new Error('connect ETIMEDOUT')), true);
    assert.strictEqual(isConnectionError(new Error('socket hang up')), true);
  });

  it('does NOT treat business/validation errors as connection errors', () => {
    assert.strictEqual(isConnectionError({ code: 'P2002', message: 'Unique constraint failed' }), false);
    assert.strictEqual(isConnectionError({ code: 'P2025', message: 'Record not found' }), false);
    assert.strictEqual(isConnectionError(new Error('Invalid email or password')), false);
  });

  it('withConnectionRetry retries on transient P2024 and succeeds', async () => {
    let callCount = 0;
    const result = await withConnectionRetry(
      async () => {
        callCount += 1;
        if (callCount < 2) {
          const err = new Error('Timed out fetching a new connection from the connection pool');
          err.code = 'P2024';
          throw err;
        }
        return 'success';
      },
      2
    );

    assert.strictEqual(result, 'success');
    assert.strictEqual(callCount, 2);
  });

  it('withConnectionRetry immediately re-throws non-retryable errors', async () => {
    let callCount = 0;
    await assert.rejects(
      async () => {
        await withConnectionRetry(async () => {
          callCount += 1;
          const err = new Error('Invalid input');
          err.code = 'P2002';
          throw err;
        });
      },
      { code: 'P2002' }
    );
    assert.strictEqual(callCount, 1);
  });

  it('invalidateUserCache clears cached session', () => {
    assert.doesNotThrow(() => {
      invalidateUserCache('user-123');
      invalidateUserCache();
    });
  });
});
