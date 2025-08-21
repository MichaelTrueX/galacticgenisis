import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

describe('GET /v1/fleets proxy', () => {
  it('forwards to fleets-svc and returns JSON', async () => {
    const app = await buildServer();
    // Mock global fetch for fleets route only
    const resBody = { fleets: [] };
    const spy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValueOnce({
      status: 200,
      text: async () => JSON.stringify(resBody),
    } as any);

    const res = await app.inject({ method: 'GET', url: '/v1/fleets' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(resBody);
    spy.mockRestore();
  });
});

