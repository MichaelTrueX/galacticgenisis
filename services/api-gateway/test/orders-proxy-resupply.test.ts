import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

describe('POST /v1/orders resupply proxy', () => {
  it('forwards body and returns downstream response', async () => {
    const app = await buildServer();
    const resBody = {
      orderId: 'o1',
      target_turn: 1,
      delta: { applied: true, notes: 'resupplied (mock)' },
    };
    const spy = vi
      .spyOn(globalThis, 'fetch' as any)
      .mockResolvedValueOnce({ status: 202, text: async () => JSON.stringify(resBody) } as any);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'resupply', payload: { fleetId: 'f1', amount: 10 } },
    });
    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual(resBody);
    spy.mockRestore();
  });
});
