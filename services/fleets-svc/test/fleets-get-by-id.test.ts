import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('GET /v1/fleets/:id', () => {
  it('returns a fleet in test mode', async () => {
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/v1/fleets/f1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe('f1');
    expect(body.system_id).toBe('sys-1');
  });
});
