import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

describe('GET /v1/fleets/:id proxy', () => {
  it('forwards to fleets-svc and returns JSON', async () => {
    const app = await buildServer();
    const resBody = {
      id: 'f1',
      empire_id: 'emp-1',
      system_id: 'sys-1',
      stance: 'neutral',
      supply: 100,
    };
    const spy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({ status: 200, text: async () => JSON.stringify(resBody) } as any);
    const res = await app.inject({ method: 'GET', url: '/v1/fleets/f1' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(resBody);
    spy.mockRestore();
  });
});
