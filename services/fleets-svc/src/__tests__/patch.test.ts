import { describe, it, expect } from 'vitest';
import { buildServer } from '../index';

describe('fleets PATCH (test mode)', () => {
  it('rejects negative supply', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/fleets/fleet-1',
      payload: { supply: -5 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('updates stance and supply', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/fleets/fleet-1',
      payload: { stance: 'aggressive', supply: 80 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stance).toBe('aggressive');
    expect(body.supply).toBe(80);
  });
});
