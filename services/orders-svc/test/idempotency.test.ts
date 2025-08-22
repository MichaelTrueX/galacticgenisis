import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('Idempotency stub', () => {
  it('returns same orderId for same Idempotency-Key', async () => {
    const app = await buildServer();

    const payload = { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } };
    const headers = { 'idempotency-key': 'same-key-1' };

    const r1 = await app.inject({ method: 'POST', url: '/v1/orders', payload, headers });
    const r2 = await app.inject({ method: 'POST', url: '/v1/orders', payload, headers });

    expect(r1.statusCode).toBe(202);
    expect(r2.statusCode).toBe(202);
    const j1 = r1.json();
    const j2 = r2.json();
    expect(j1.orderId).toBe(j2.orderId);
  });
});

