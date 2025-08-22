import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('pg', () => {
  class Pool {
    // simple programmable responder
    static responder: (text: string, params?: any[]) => Promise<{ rows: any[] }> = async () => ({ rows: [] });
    query(text: string, params?: any[]) {
      return (Pool.responder)(text, params);
    }
    connect() { return Promise.resolve(this as any); }
    release() {}
  }
  return { default: { Pool }, Pool } as any;
});

import { buildServer } from '../index';

describe('fleets-svc', () => {
  beforeEach(() => {
    const { Pool } = require('pg');
    Pool.responder = async (text: string) => {
      if (text.includes('from fleets')) {
        return { rows: [{ id: 'fleet-1', system_id: 'sys-1', stance: 'neutral', supply: 100 }] };
      }
      if (text.startsWith('select 1 from systems')) {
        return { rows: [{ '?column?': 1 }] } as any;
      }
      return { rows: [] };
    };
  });

  it('GET /v1/fleets returns list', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/fleets' });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(Array.isArray(json.fleets)).toBe(true);
  });

  it('POST /v1/fleets validates system exists', async () => {
    const { Pool } = require('pg');
    Pool.responder = async (text: string) => {
      if (text.startsWith('select 1 from systems')) return { rows: [] }; // not found
      return { rows: [] };
    };
    const app = await buildServer();
    const res = await app.inject({ method: 'POST', url: '/v1/fleets', payload: { empire_id: 'emp-1', system_id: 'bad' } });
    expect(res.statusCode).toBe(400);
  });
});

