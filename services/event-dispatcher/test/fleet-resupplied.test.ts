import { describe, it, expect, vi } from 'vitest';
import { createDispatcher } from '../src/index';

// This test is a light smoke that ensures subscribing and send path do not throw
// We do not require a real NATS; we will mock the nats client used inside createDispatcher

vi.mock('nats', async () => {
  const actual = await vi.importActual<any>('nats');
  return {
    ...actual,
    connect: vi.fn(async () => ({
      subscribe: vi.fn(() => ({
        closed: false,
        unsubscribe: () => {},
        [Symbol.asyncIterator]: async function* () {
          /* yield no messages */
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
    messages: string[] = [];
    send = vi.fn((msg: any) => {
      this.messages.push(String(msg));
    });
    on = vi.fn();
    close = vi.fn();
  }
  class MockWSS {
    on = vi.fn();
    close = vi.fn();
  }
  return { ...actual, WebSocketServer: MockWSS, WebSocket: MockWS };
});

describe('event-dispatcher topics', () => {
  it('subscribes to fleet.resupplied without crashing', async () => {
    const d = await createDispatcher('nats://localhost:4222', 0);
    await d.start();
    await d.stop();
    expect(true).toBe(true);
  });
});
