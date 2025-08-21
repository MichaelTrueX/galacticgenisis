import Fastify from 'fastify';
import { nanoid } from 'nanoid';

const port = Number(process.env.PORT || 8081);

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
import type { Publisher } from './publisher';
import { createConsolePublisher, createNatsPublisher } from './publisher';

export async function buildServer(pub?: Publisher) {
  const app = Fastify({ logger: true });

  let publisher: Publisher;
  if (pub) {
    publisher = pub;
  } else if (process.env.NATS_URL) {
    publisher = await createNatsPublisher(process.env.NATS_URL);
  } else {
    publisher = createConsolePublisher();
  }

<<<<<<< HEAD
=======
=======
export async function buildServer() {
  const app = Fastify({ logger: true });

>>>>>>> origin/main
>>>>>>> origin/main
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
            },
            required: ['orderId', 'target_turn'],
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

<<<<<<< HEAD
      // Publish receipt stub (to be wired to NATS later)
      await publisher.publish('order.receipt', { orderId, status: 'accepted', target_turn });

=======
<<<<<<< HEAD
      // Publish receipt stub (to be wired to NATS later)
      await publisher.publish('order.receipt', { orderId, status: 'accepted', target_turn });

=======
>>>>>>> origin/main
>>>>>>> origin/main
      // We are not writing to DB yet; this is a stub endpoint
      return rep.status(202).send({ orderId, target_turn, idemKey });
    }
  );

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`orders-svc listening on :${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

