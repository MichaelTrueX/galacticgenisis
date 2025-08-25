import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('fleets CRUD', () => {
  it('POST /v1/fleets creates a fleet (test mode)', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/fleets',
      payload: { empire_id: 'emp-1', system_id: 'sys-1', stance: 'aggressive', supply: 80 },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.empire_id).toBe('emp-1');
    expect(body.system_id).toBe('sys-1');
    expect(body.stance).toBe('aggressive');
    expect(body.supply).toBe(80);
  });

  it('PATCH /v1/fleets/:id updates stance and supply (test mode)', async () => {
    const app = await buildServer();
    const created = await app.inject({
      method: 'POST',
      url: '/v1/fleets',
      payload: { empire_id: 'emp-1', system_id: 'sys-1' },
    });
    const fleet = created.json();
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/fleets/${fleet.id}`,
      payload: { stance: 'defensive', supply: 120 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(fleet.id);
    expect(body.stance).toBe('defensive');
    expect(body.supply).toBe(120);
  });
});
