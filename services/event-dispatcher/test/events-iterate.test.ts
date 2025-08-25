import { describe, it, expect, vi } from 'vitest';
import { createDispatcher } from '../src/index';

vi.mock('nats', async () => {
  const actual = await vi.importActual<any>('nats');
  return {
    ...actual,
    connect: vi.fn(async () => ({
      subscribe: vi.fn(() => ({
        closed: false,
        unsubscribe: () => {},
        async *[Symbol.asyncIterator]() {
          yield {
            data: new TextEncoder().encode('{"topic":"order.applied","orderId":"o1"}'),
          } as any;
          yield {
            data: new TextEncoder().encode('{"topic":"fleet.resupplied","fleetId":"f1"}'),
          } as any;
        },
      })),
      drain: vi.fn(async () => {}),
    })),
    StringCodec: () => ({ decode: (b: Uint8Array) => new TextDecoder().decode(b) }),
  };
});

vi.mock('ws', async () => {
  const actual = await vi.importActual<any>('ws');
  class MockWS {
    send = vi.fn();
    on = vi.fn();
    close = vi.fn();
  }
  class MockWSS {
    on = vi.fn();
    close = vi.fn();
  }
  return { ...actual, WebSocketServer: MockWSS, WebSocket: MockWS };
});

describe('dispatcher iterates over messages', () => {
  it('handles order.applied and fleet.resupplied without crashing', async () => {
    const d = await createDispatcher('nats://localhost:4222', 0);
    await d.start();
    await d.stop();
    expect(true).toBe(true);
  });
});
