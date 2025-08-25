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
  const handlers: any = {};
  class MockWS {
    send = vi.fn();
    on = vi.fn();
    close = vi.fn();
  }
  class MockWSS {
    on = vi.fn((evt: string, cb: any) => {
      if (evt === 'connection') handlers.connection = cb;
    });
    close = vi.fn();
  }
  return { ...actual, WebSocketServer: MockWSS, WebSocket: MockWS, __handlers: handlers };
});

describe('dispatcher iterates over messages', () => {
  it('broadcasts to connected ws clients', async () => {
    const d = await createDispatcher('nats://localhost:4222', 0);
    const wsMod: any = await import('ws');
    const client = new wsMod.WebSocket();
    // simulate connection before start so client is registered
    wsMod.__handlers.connection(client);
    await d.start();
    // allow async iterators to run
    await new Promise((r) => setTimeout(r, 20));
    await d.stop();
    expect(client.send).toHaveBeenCalled();
  });
});
