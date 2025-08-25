import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../src/index';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch as any);

describe('GET /v1/orders/:id proxy', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('forwards to orders-svc and returns JSON', async () => {
    const app = await buildServer();

    mockFetch.mockResolvedValueOnce({
      status: 200,
      text: async () => JSON.stringify({ id: 'o1', status: 'applied' }),
    } as any);

    const res = await app.inject({ method: 'GET', url: '/v1/orders/o1' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/orders\/o1$/);

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: 'o1', status: 'applied' });

    await app.close();
  });
});
