import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// This is a light E2E-style test that exercises gateway handlers without real HTTP
import { buildServer } from '../index';

// We mock fetch for gateway to simulate downstream services
const fleetsList = { fleets: [{ id: 'f1', system_id: 'sys-1', stance: 'neutral', supply: 100 }] };
const orderAccepted = { orderId: 'o1', target_turn: 1 } as any;

const mockFetch = async (url: string, init?: any) => {
  if (url.includes('/v1/fleets') && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify(fleetsList), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/v1/orders') && init?.method === 'POST') {
    return new Response(JSON.stringify(orderAccepted), { status: 202, headers: { 'content-type': 'application/json' } });
  }
  if (url.includes('/v1/orders') && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify({ orders: [orderAccepted] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response('not found', { status: 404 });
};

// @ts-ignore
global.fetch = mockFetch as any;

describe('api-gateway integration', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  beforeAll(async () => {
    app = await buildServer();
  });
  afterAll(async () => { await app.close(); });

  it('GET /v1/fleets proxies successfully', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/fleets' });
    expect(res.statusCode).toBe(200);
    expect(res.json().fleets?.length).toBe(1);
  });

  it('POST /v1/orders proxies and returns 202', async () => {
    const res = await app.inject({ method: 'POST', url: '/v1/orders', payload: { kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } } });
    expect(res.statusCode).toBe(202);
  });

  it('GET /v1/orders proxies list', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/orders' });
    expect(res.statusCode).toBe(200);
  });
});

