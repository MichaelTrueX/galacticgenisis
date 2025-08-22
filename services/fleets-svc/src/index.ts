import Fastify from 'fastify';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const { Pool } = pg;
const TEST_MODE = process.env.NODE_ENV === 'test';

export async function buildServer() {
  const app = Fastify({ logger: true });

  // DB pool (internal-only; compose network)
  const pool = TEST_MODE ? null : new Pool({
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'gg',
    password: process.env.PGPASSWORD || 'ggpassword',
    database: process.env.PGDATABASE || 'gg',
  });

  // List fleets with a simple join to systems (optional fields)
  app.get('/v1/fleets', async (_req, rep) => {
    try {
      if (TEST_MODE || !pool) {
        return rep.send({ fleets: [] });
      }
      const { rows } = await pool.query(
        `select f.id, f.empire_id, f.system_id, f.stance, f.supply,
                s.name as system_name
           from fleets f
           left join systems s on s.id = f.system_id
           order by f.id asc`
      );
      return rep.send({ fleets: rows });
    } catch (err: any) {
      app.log.error({ err }, 'fleets query failed');
      return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
    }
  });

  // Health
  app.get('/v1/health', async () => ({ ok: true }));

  // Create a fleet
  app.post<{ Body: { id?: string; empire_id: string; system_id: string; stance?: string; supply?: number } }>(
    '/v1/fleets',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            empire_id: { type: 'string' },
            system_id: { type: 'string' },
            stance: { type: 'string' },
            supply: { type: 'integer' }
          },
          required: ['empire_id', 'system_id'],
          additionalProperties: false
        },
      },
    },
    async (req, rep) => {
      const id = req.body.id || randomUUID();
      const { empire_id, system_id } = req.body;
      const stance = req.body.stance ?? 'neutral';
      const supply = typeof req.body.supply === 'number' ? req.body.supply : 100;
      try {
        // Validate system exists when DB available
        if (!TEST_MODE && pool) {
          const sys = await pool.query('select 1 from systems where id = $1', [system_id]);
          if (!sys.rows[0]) return rep.status(400).send({ error: 'invalid_system', message: 'system_id not found' });
        }

        if (TEST_MODE || !pool) {
          return rep.status(201).send({ id, empire_id, system_id, stance, supply });
        }

        const { rows } = await pool.query(
          `insert into fleets (id, empire_id, system_id, stance, supply)
           values ($1, $2, $3, $4, $5)
           returning id, empire_id, system_id, stance, supply`,
          [id, empire_id, system_id, stance, supply]
        );
        return rep.status(201).send(rows[0]);
      } catch (err: any) {
        app.log.error({ err }, 'fleet create failed');
        // unique violation
        if (err && err.code === '23505') return rep.status(409).send({ error: 'conflict', message: 'id already exists' });
        return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
      }
    }
  );

  // Update a fleet (stance/supply)
  app.patch<{ Params: { id: string }; Body: { stance?: string; supply?: number } }>(
    '/v1/fleets/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
        body: {
          type: 'object',
          properties: {
            stance: { type: 'string' },
            supply: { type: 'integer' }
          },
          additionalProperties: false
        },
      },
    },
    async (req, rep) => {
      const { id } = req.params;
      const stance = req.body.stance ?? null;
      const supply = typeof req.body.supply === 'number' ? req.body.supply : null;
      try {
        const { rows } = await pool.query(
          `update fleets
             set stance = coalesce($2, stance),
                 supply = coalesce($3, supply)
           where id = $1
           returning id, empire_id, system_id, stance, supply`,
          [id, stance, supply]
        );
        if (!rows[0]) return rep.status(404).send({ error: 'not_found' });
        return rep.send(rows[0]);
      } catch (err: any) {
        app.log.error({ err }, 'fleet update failed');
        return rep.status(500).send({ error: 'db_error', message: err?.message || 'unknown' });
      }
    }
  );

  return app;
}

async function start() {
  const port = Number(process.env.PORT || 8082);
  const app = await buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`fleets-svc listening on :${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

