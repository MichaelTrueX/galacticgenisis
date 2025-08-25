import { describe, it, expect } from 'vitest';

describe('Gateway root index', () => {
  it('lists key endpoints for manual testing', async () => {
    const { buildServer } = await import('../src/index');
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body?.endpoints?.stream).toContain('/v1/stream');
    expect(body?.endpoints?.orders_list).toContain('/v1/orders');
    expect(body?.endpoints?.orders_get).toContain('/v1/orders/:id');
    expect(body?.endpoints?.fleets_create).toContain('/v1/fleets');
    expect(body?.endpoints?.fleets_update).toContain('/v1/fleets/:id');
    await app.close();
  });
});
