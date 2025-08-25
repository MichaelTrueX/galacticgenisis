import { describe, it, expect } from 'vitest';
import { buildServer } from '../src/index';

describe('Gateway validation for resupply orders', () => {
  it('requires kind and payload object', async () => {
    const app = await buildServer();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'resupply' },
    });
    expect(res.statusCode).toBe(400);
  });
});
