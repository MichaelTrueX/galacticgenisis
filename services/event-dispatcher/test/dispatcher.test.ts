import { describe, it, expect, vi } from 'vitest';
import { createDispatcher } from '../src/index';

// We'll mock NATS connect and a minimal WS server behavior by invoking start/stop.
vi.mock('nats', async (orig) => {
  const actual = await (orig as any)();
  const messages: any[] = [];
  const subs: any[] = [];
  return {
    ...actual,
    connect: async () => ({
      subscribe: (topic: string) => {
        const sub = {
          topic,
          async *[Symbol.asyncIterator]() {
            for (const msg of messages) {
              yield { data: actual.StringCodec().encode(JSON.stringify(msg)) };
            }
          },
          unsubscribe() {},
        };
        subs.push(sub);
        return sub;
      },
      drain: async () => {},
      _messages: messages,
      _subs: subs,
    }),
  };
});

// ws WebSocketServer is used directly; in test we just start/stop dispatcher

describe('event-dispatcher scaffolding', () => {
  it('starts and stops without error', async () => {
    const d = await createDispatcher('nats://test:4222', 0);
    await d.start();
    await d.stop();
    expect(true).toBe(true);
  });
});

