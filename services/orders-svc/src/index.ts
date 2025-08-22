import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import pg from 'pg';

const { Pool } = pg;
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

  // DB pool (internal docker network defaults)
  const pool = new Pool({
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'gg',
    password: process.env.PGPASSWORD || 'ggpassword',
    database: process.env.PGDATABASE || 'gg',
  });

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

      // Persist order (minimal fields). Default empire for demo.
      const empireId = process.env.DEFAULT_EMPIRE_ID || 'emp-1';
      const idem = typeof idemKey === 'string' ? idemKey : null;
      const upsertSql = `
        insert into orders (id, empire_id, kind, payload, target_turn, idem_key, status)
        values ($1, $2, $3, $4::jsonb, $5, $6, $7)
        on conflict (idem_key) do update set idem_key = excluded.idem_key
        returning id, target_turn, status
      `;
      const upsertParams = [orderId, empireId, req.body.kind, JSON.stringify(req.body.payload ?? {}), target_turn, idem, 'accepted'];
      let row;
      try {
        const { rows } = await pool.query(upsertSql, upsertParams);
        row = rows[0];
      } catch (err: any) {
        app.log.error({ err }, 'orders upsert failed');
        return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
      }

      // Publish receipt stub (to be wired to NATS later)
      await publisher.publish('order.receipt', { orderId: row.id, status: row.status, target_turn: row.target_turn, delta });

      return rep.status(202).send({ orderId: row.id, target_turn: row.target_turn, idemKey, delta });
    }
  );

  // Fetch order by id
  app.get('/v1/orders/:id', async (req, rep) => {
    const id = (req.params as any).id as string;
    try {
      const { rows } = await pool.query(
        'select id, empire_id, kind, payload, target_turn, idem_key, status, created_at from orders where id = $1',
        [id]
      );
      if (!rows[0]) return rep.status(404).send({ error: 'not_found' });
      return rep.send(rows[0]);
    } catch (err: any) {
      app.log.error({ err }, 'orders fetch failed');
      return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
    }
  });

  // List orders (basic)
  app.get('/v1/orders', async (_req, rep) => {
    try {
      const { rows } = await pool.query(
        'select id, empire_id, kind, payload, target_turn, idem_key, status, created_at from orders order by created_at desc limit 50'
      );
      return rep.send({ orders: rows });
    } catch (err: any) {
      app.log.error({ err }, 'orders list failed');
      return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
    }
  });

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

