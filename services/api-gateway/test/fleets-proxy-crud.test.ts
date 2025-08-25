import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

describe('fleets proxy CRUD', () => {
  it('POST /v1/fleets forwards to fleets-svc', async () => {
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
      .mockResolvedValueOnce({ status: 201, text: async () => JSON.stringify(resBody) } as any);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/fleets',
      payload: { empire_id: 'emp-1', system_id: 'sys-1' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual(resBody);
    spy.mockRestore();
  });

  it('PATCH /v1/fleets/:id forwards to fleets-svc', async () => {
    const app = await buildServer();
    const resBody = {
      id: 'f1',
      empire_id: 'emp-1',
      system_id: 'sys-1',
      stance: 'defensive',
      supply: 120,
    };
    const spy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({ status: 200, text: async () => JSON.stringify(resBody) } as any);
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/fleets/f1',
      payload: { stance: 'defensive', supply: 120 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual(resBody);
    spy.mockRestore();
  });
});
