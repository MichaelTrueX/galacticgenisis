import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

const pub = { publish: vi.fn() };

describe('resupply order', () => {
  it('validates payload', async () => {
    const app = await buildServer(pub as any);
    let res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'resupply', payload: { fleetId: '', amount: 10 } },
    });
    expect(res.statusCode).toBe(400);
    res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'resupply', payload: { fleetId: 'f1', amount: 0 } },
    });
    expect(res.statusCode).toBe(400);
  });

  it('accepts valid resupply and publishes receipt', async () => {
    const app = await buildServer(pub as any);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'resupply', payload: { fleetId: 'fleet-1', amount: 20 } },
    });
    expect(res.statusCode).toBe(202);
    expect(pub.publish).toHaveBeenCalledWith(
      'order.receipt',
      expect.objectContaining({ status: 'accepted', orderId: expect.any(String) }),
    );
  });
});
