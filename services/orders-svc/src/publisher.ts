export type Publisher = {
  publish: (topic: string, payload: unknown) => Promise<void> | void;
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

