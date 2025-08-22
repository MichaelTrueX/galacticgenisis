import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

// Contract expectations from apis/space4x/openapi-v1.yaml
// POST /v1/orders expects { kind: string, payload: object }
// Responds 202 with { orderId: string, target_turn: integer }

describe('OpenAPI-aligned validation', () => {
  it('rejects when body is missing fields', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'POST', url: '/v1/orders', payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('accepts valid shape', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } },
    });
    expect(res.statusCode).toBe(202);
    const json = res.json();
    expect(typeof json.orderId).toBe('string');
    expect(Number.isInteger(json.target_turn)).toBe(true);
  });
});

