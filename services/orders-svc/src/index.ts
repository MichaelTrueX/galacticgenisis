import Fastify from 'fastify';
import { nanoid } from 'nanoid';

const port = Number(process.env.PORT || 8081);

import type { Publisher } from './publisher';
import { createConsolePublisher, createNatsPublisher } from './publisher';
import { startDevTick } from './dev-tick';

export type Sim = { apply: (order: { kind: string; payload: Record<string, unknown> }) => Promise<{ applied: boolean; notes: string }> };

function createMockSim(): Sim {
  return {
    async apply(order) {
      if (order.kind === 'move') return { applied: true, notes: 'moved one step (mock)' };
      return { applied: false, notes: 'unsupported kind (mock)' };
    },
  };
}

import { loadSimFromEnv } from './sim-loader';

export async function buildServer(pub?: Publisher, sim?: Sim) {
  const app = Fastify({ logger: true });

  let publisher: Publisher;
  if (pub) {
    publisher = pub;
  } else if (process.env.NATS_URL) {
    publisher = await createNatsPublisher(process.env.NATS_URL);
  } else {
    publisher = createConsolePublisher();
  }

  // expose publisher for dev-tick
  (app as any).publisher = publisher;

  const simCore: Sim = sim ?? (await loadSimFromEnv().catch(() => createMockSim()));

  type OrderBody = { kind: string; payload: Record<string, unknown> };

  app.post<{ Body: OrderBody }>(
    '/v1/orders',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            kind: { type: 'string' },
            payload: { type: 'object' },
          },
          required: ['kind', 'payload'],
          additionalProperties: true,
        },
        response: {
          202: {
            type: 'object',
            properties: {
              orderId: { type: 'string' },
              target_turn: { type: 'integer' },
              idemKey: { anyOf: [{ type: 'string' }, { type: 'array' }, { type: 'null' }] },
              delta: {
                type: 'object',
                properties: {
                  applied: { type: 'boolean' },
                  notes: { type: 'string' },
                },
                required: ['applied', 'notes'],
              },
            },
            required: ['orderId', 'target_turn'],
            additionalProperties: true,
          },
        },
      },
    },
    async (req, rep) => {
      // Minimal idempotency: echo Idempotency-Key if provided
      const idemKey = req.headers['idempotency-key'] as any;

      // Idempotency stub: if same key seen before in this process, reuse orderId
      const memory = (app as any).__idem || ((app as any).__idem = new Map());
      let orderId: string;
      if (typeof idemKey === 'string' && memory.has(idemKey)) {
        orderId = memory.get(idemKey);
      } else {
        orderId = nanoid();
        if (typeof idemKey === 'string') memory.set(idemKey, orderId);
      }

      const target_turn = 1; // stub for now

      // Call Sim Core (mock or wasm-bridged) for deterministic delta
      const delta = await simCore.apply({ kind: req.body.kind, payload: req.body.payload });

      // Publish receipt stub (to be wired to NATS later)
      await publisher.publish('order.receipt', { orderId, status: 'accepted', target_turn, delta });

      // We are not writing to DB yet; this is a stub endpoint
      return rep.status(202).send({ orderId, target_turn, idemKey, delta });
    }
  );

  return app;
}

async function start() {
  const app = await buildServer();
  const stopTick = startDevTick((app as any).publisher ?? { publish: async () => {} });
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`orders-svc listening on :${port}`);
  // graceful shutdown
  process.on('SIGINT', () => { try { stopTick(); } catch {} process.exit(0); });
  process.on('SIGTERM', () => { try { stopTick(); } catch {} process.exit(0); });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

