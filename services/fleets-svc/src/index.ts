import Fastify from 'fastify';
import pg from 'pg';

const { Pool } = pg;

export async function buildServer() {
  const app = Fastify({ logger: true });

  // DB pool (internal-only; compose network)
  const pool = new Pool({
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'gg',
    password: process.env.PGPASSWORD || 'ggpassword',
    database: process.env.PGDATABASE || 'gg',
  });

  // List fleets with a simple join to systems (optional fields)
  app.get('/v1/fleets', async (_req, rep) => {
    try {
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

