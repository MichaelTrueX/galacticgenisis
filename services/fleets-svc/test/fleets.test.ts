import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('fleets-svc', () => {
  it('GET /v1/fleets returns empty list initially', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/fleets' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ fleets: [] });
  });
});

