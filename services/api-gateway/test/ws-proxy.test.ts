 

import { describe, it, expect } from 'vitest';
describe('WS proxy route', () => {
  it('exposes /v1/stream route (via root index)', async () => {
    const { buildServer } = await import('../src/index');
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body?.endpoints?.stream).toContain('/v1/stream');
    await app.close();
  }, 5000);
});
