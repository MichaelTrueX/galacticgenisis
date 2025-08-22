import { describe, it, expect } from 'vitest';
import { buildServer } from '../index';

describe('fleets-svc (test mode)', () => {
  it('GET /v1/fleets returns list array', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/fleets' });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(Array.isArray(json.fleets)).toBe(true);
  });

  it('POST /v1/fleets creates fleet with schema validation', async () => {
    const app = await buildServer();
    const bad = await app.inject({ method: 'POST', url: '/v1/fleets', payload: { empire_id: 'emp-1' } });
    expect(bad.statusCode).toBe(400); // missing system_id

    const ok = await app.inject({ method: 'POST', url: '/v1/fleets', payload: { empire_id: 'emp-1', system_id: 'sys-1' } });
    expect(ok.statusCode).toBe(201);
    const body = ok.json();
    expect(typeof body.id).toBe('string');
    expect(body.system_id).toBe('sys-1');
  });
});

