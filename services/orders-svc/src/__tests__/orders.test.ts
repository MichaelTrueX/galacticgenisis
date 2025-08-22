import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('pg', () => {
  class Pool {
    static responder: (text: string, params?: any[]) => Promise<{ rows: any[] }> = async () => ({ rows: [] });
    query(text: string, params?: any[]) { return (Pool.responder)(text, params); }
    connect() { return Promise.resolve(this as any); }
    release() {}
  }
  return { default: { Pool }, Pool } as any;
});

import { buildServer } from '../index';

describe('orders-svc', () => {
  beforeEach(() => {
    const { Pool } = require('pg');
    Pool.responder = async (text: string) => {
      if (text.startsWith('select 1 from fleets')) return { rows: [{ '?column?': 1 }] } as any;
      if (text.startsWith('select 1 from systems')) return { rows: [{ '?column?': 1 }] } as any;
      if (text.startsWith('insert into orders')) return { rows: [{ id: 'o1', target_turn: 1, status: 'accepted' }] } as any;
      if (text.includes('from orders')) return { rows: [{ id: 'o1' }] } as any;
      return { rows: [] };
    };
  });

  it('POST /v1/orders validates move payload', async () => {
    const app = await buildServer();
    const bad1 = await app.inject({ method: 'POST', url: '/v1/orders', payload: { kind: 'move', payload: {} } });
    expect(bad1.statusCode).toBe(400);
    const ok = await app.inject({ method: 'POST', url: '/v1/orders', payload: { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } } });
    expect(ok.statusCode).toBe(202);
  });

  it('GET /v1/orders returns list', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/orders' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().orders)).toBe(true);
  });
});

