import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildServer } from '../src/index';

// Mock global fetch
const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch as any);

describe('POST /v1/orders proxy', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('forwards body and headers and returns downstream response', async () => {
    const app = await buildServer();

    mockFetch.mockResolvedValueOnce({
      status: 202,
      text: async () => JSON.stringify({ orderId: 'abc', target_turn: 1 }),
    } as any);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      headers: { 'idempotency-key': 'k1', authorization: 'Bearer T' },
      payload: { kind: 'move', payload: { foo: 'bar' } },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/orders$/);
    expect(init.method).toBe('POST');
    expect((init.headers as any)['idempotency-key']).toBe('k1');
    expect((init.headers as any)['authorization']).toBe('Bearer T');

    expect(res.statusCode).toBe(202);
    expect(res.json()).toEqual({ orderId: 'abc', target_turn: 1 });
  });
});

