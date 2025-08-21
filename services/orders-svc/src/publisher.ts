import { connect, StringCodec, NatsConnection } from 'nats';

export type Publisher = {
  publish: (topic: string, payload: unknown) => Promise<void> | void;
  close?: () => Promise<void> | void;
};

export function createConsolePublisher(): Publisher {
  return {
    async publish(topic, payload) {
      // Dev stub: log only
      // eslint-disable-next-line no-console
      console.log(`[pub] ${topic}`, payload);
    },
  };
}

export async function createNatsPublisher(url: string): Promise<Publisher> {
  const nc: NatsConnection = await connect({ servers: url });
  const sc = StringCodec();
  return {
    async publish(topic, payload) {
      const data = sc.encode(JSON.stringify(payload));
      nc.publish(topic, data);
    },
    async close() {
      await nc.drain();
    },
  };
}

