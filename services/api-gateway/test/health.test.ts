import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('GET /v1/health', () => {
  it('returns ok', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });
});

