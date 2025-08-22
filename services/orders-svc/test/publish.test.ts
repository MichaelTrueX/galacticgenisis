import { describe, it, expect, vi } from 'vitest';
import { buildServer } from '../src/index';

const pub = { publish: vi.fn() };

describe('orders-svc publisher hook', () => {
  it('publishes order.receipt on accepted order', async () => {
    const app = await buildServer(pub);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      headers: { 'idempotency-key': 'p1' },
      payload: { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } },
    });

    expect(res.statusCode).toBe(202);
    expect(pub.publish).toHaveBeenCalledWith(
      'order.receipt',
      expect.objectContaining({ status: 'accepted', orderId: expect.any(String) })
    );
  });
});

