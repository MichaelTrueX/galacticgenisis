import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('POST /v1/orders', () => {
  it('validates body and returns 202', async () => {
    const app = await buildServer();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } },
    });

    expect(res.statusCode).toBe(202);
    const json = res.json();
    expect(json.orderId).toBeTruthy();
    expect(json.target_turn).toBeTypeOf('number');
  });

  it('rejects invalid body', async () => {
    const app = await buildServer();

    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 1 },
    });

    expect(res.statusCode).toBe(400);
  });
});

