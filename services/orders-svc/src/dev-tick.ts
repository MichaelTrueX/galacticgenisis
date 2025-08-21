import type { Publisher } from './publisher';

export function startDevTick(publisher: Publisher, intervalMs = Number(process.env.TICK_MS || 5000)) {
  if (process.env.NODE_ENV === 'test') return () => {};
  const t = setInterval(async () => {
    try {
      await publisher.publish('turn.tick', { ts: Date.now() });
    } catch {}
  }, intervalMs);
  return () => clearInterval(t);
}

