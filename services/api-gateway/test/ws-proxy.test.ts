/* eslint-disable @typescript-eslint/no-require-imports */

import { describe, it, expect, vi } from 'vitest';

// Mock ws client used inside proxy code path
vi.mock('ws', () => {
  const EventEmitter = require('events');
  class MockWS extends EventEmitter {
    close = vi.fn();
    send = vi.fn();
  }
  return { default: MockWS, WebSocket: MockWS };
});

// Mock fastify websocket plugin to inject a fake connection
vi.mock('@fastify/websocket', () => ({ default: () => {} }));

describe('WS proxy route', () => {
  it('exposes /v1/stream route (handler existence)', async () => {
    const { buildServer } = await import('../src/index');
    const app = await buildServer();
    // Fastify inject cannot upgrade WebSocket; this is a presence test
    const routes = app.printRoutes();
    expect(routes).toContain('stream (GET');
    await app.close();
  }, 10000);
});
