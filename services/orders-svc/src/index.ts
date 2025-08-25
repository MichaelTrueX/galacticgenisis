import Fastify from 'fastify';
import { nanoid } from 'nanoid';
import pg from 'pg';

const { Pool } = pg;
const port = Number(process.env.PORT || 8081);
const TEST_MODE = process.env.NODE_ENV === 'test';

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
  const pool = TEST_MODE ? null : new Pool({
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
      // Validate move payload early
      if (req.body.kind === 'move') {
        const fid = (req.body.payload as any)?.fleetId || (req.body.payload as any)?.fleet_id;
        const to = (req.body.payload as any)?.toSystemId || (req.body.payload as any)?.to_system_id;
        if (!fid) return rep.status(400).send({ error: 'invalid_request', message: 'fleetId is required' });
        if (!to) return rep.status(400).send({ error: 'invalid_request', message: 'toSystemId is required' });
        // Validate both entities exist
        if (!TEST_MODE && pool) {
          try {
            const [[f], [s]] = await Promise.all([
              pool.query('select 1 from fleets where id = $1', [fid]).then(r => r.rows),
              pool.query('select 1 from systems where id = $1', [to]).then(r => r.rows),
            ]);
            if (!f) return rep.status(400).send({ error: 'invalid_request', field: 'fleetId', message: 'fleet not found' });
            if (!s) return rep.status(400).send({ error: 'invalid_request', field: 'toSystemId', message: 'toSystemId not found' });
          } catch (err: any) {
            app.log.error({ err }, 'validation query failed');
            return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
          }
        }
      }
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
        on conflict (idem_key) do update set id = excluded.id -- ensure same orderId returned on repeat
        returning id, target_turn, status
      `;
      const upsertParams = [orderId, empireId, req.body.kind, JSON.stringify(req.body.payload ?? {}), target_turn, idem, 'accepted'];
      let row: any;
      if (TEST_MODE || !pool) {
        row = { id: orderId, target_turn, status: 'accepted' };
      } else {
        try {
          const { rows } = await pool.query(upsertSql, upsertParams);
          row = rows[0];
        } catch (err: any) {
          app.log.error({ err }, 'orders upsert failed');
          return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
        }
      }

      // Publish receipt stub (to be wired to NATS later)
      await publisher.publish('order.receipt', { orderId: row.id, status: row.status, target_turn: row.target_turn, delta });

      return rep.status(202).send({ orderId: row.id, target_turn: row.target_turn, idemKey, delta });
    }
  );

  // Fetch order by id
  app.get('/v1/orders/:id', async (req, rep) => {
    const id = (req.params as any).id as string;
    if (TEST_MODE || !pool) return rep.status(404).send({ error: 'not_found' });
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
    if (TEST_MODE || !pool) return rep.send({ orders: [] });
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

// Simple worker: pick an accepted 'move' order, mark processing, toggle fleet system, mark applied
function startApplyWorker(publisher: Publisher, intervalMs = Number(process.env.APPLY_MS || 2000)) {
  const pool = new Pool({
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'gg',
    password: process.env.PGPASSWORD || 'ggpassword',
    database: process.env.PGDATABASE || 'gg',
  });

  const t = setInterval(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Find one accepted move order
      const sel = await client.query(
        "select id, payload from orders where status = 'accepted' and kind = 'move' order by created_at asc limit 1 for update skip locked"
      );
      const row = sel.rows[0];
      if (!row) { await client.query('COMMIT'); return; }
      const orderId = row.id as string;
      const fleetId = (row.payload?.fleetId || row.payload?.fleet_id) as string | undefined;
      const toSystemId = (row.payload?.toSystemId || row.payload?.to_system_id) as string | undefined;
      if (!fleetId || !toSystemId) { await client.query('update orders set status = $2 where id = $1', [orderId, 'applied']); await client.query('COMMIT'); return; }

      // Move the fleet to the target system
      const f = await client.query('select id, system_id from fleets where id = $1 for update', [fleetId]);
      if (!f.rows[0]) { await client.query('update orders set status = $2 where id = $1', [orderId, 'applied']); await client.query('COMMIT'); return; }
      await client.query('update fleets set system_id = $2 where id = $1', [fleetId, toSystemId]);
      await client.query('update orders set status = $2 where id = $1', [orderId, 'applied']);
      await client.query('COMMIT');

      try {
        await publisher.publish('fleet.moved', { fleetId, from: current, to: next, orderId });
        await publisher.publish('order.applied', { orderId, status: 'applied' });
      } catch {}
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
    } finally {
      client.release();
    }
  }, intervalMs);

  return () => clearInterval(t);
}

async function start() {
  const app = await buildServer();
  const stopTick = startDevTick((app as any).publisher ?? { publish: async () => {} });

  // Start a tiny background worker to apply 'move' orders by toggling fleet system between sys-1 and sys-2
  // This is for MVP demo purposes only; later we will replace with a proper scheduler.
  const pub: Publisher = (app as any).publisher;
  const worker = startApplyWorker(pub);

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`orders-svc listening on :${port}`);
  // graceful shutdown
  process.on('SIGINT', () => { try { stopTick(); worker(); } catch {} process.exit(0); });
  process.on('SIGTERM', () => { try { stopTick(); worker(); } catch {} process.exit(0); });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

