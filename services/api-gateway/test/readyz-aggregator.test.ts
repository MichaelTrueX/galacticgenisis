import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../src/index';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch as any);

describe('Gateway /readyz aggregating readiness', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns 200 when all downstreams are ready', async () => {
    const app = await buildServer();
    mockFetch.mockResolvedValue({ status: 200 } as any);
    const res = await app.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ready: true, details: { orders: 200, fleets: 200, events: 200 } });
    await app.close();
  });

  it('returns 503 and details when any downstream is not ready', async () => {
    const app = await buildServer();
    mockFetch
      .mockResolvedValueOnce({ status: 200 } as any) // orders
      .mockResolvedValueOnce({ status: 503 } as any) // fleets
      .mockResolvedValueOnce({ status: 200 } as any); // events
    const res = await app.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      ready: false,
      details: { orders: 200, fleets: 503, events: 200 },
    });
    await app.close();
  });
});
