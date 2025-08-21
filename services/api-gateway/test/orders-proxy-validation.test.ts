import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('Gateway validation for /v1/orders', () => {
  it('rejects invalid body before forwarding', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'POST', url: '/v1/orders', payload: { nope: true } });
    expect(res.statusCode).toBe(400);
  });
});

