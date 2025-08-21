import Fastify from 'fastify';

const port = Number(process.env.PORT || 8080);
const ORDERS_SVC_URL = process.env.ORDERS_SVC_URL || 'http://localhost:8081';

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/v1/health', async (_req, _rep) => {
    return { ok: true };
  });

  // Proxy: POST /v1/orders -> orders-svc
  app.post('/v1/orders', async (req, rep) => {
    const url = `${ORDERS_SVC_URL}/v1/orders`;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    // Pass through idempotency and auth headers if present
    const idem = req.headers['idempotency-key'];
    if (typeof idem === 'string') headers['idempotency-key'] = idem;
    const auth = req.headers['authorization'];
    if (typeof auth === 'string') headers['authorization'] = auth;

    const body = JSON.stringify(req.body ?? {});
    const res = await fetch(url, { method: 'POST', headers, body });
    const text = await res.text();

    // Try to return JSON if possible
    try {
      const json = JSON.parse(text);
      return rep.status(res.status).send(json);
    } catch {
      return rep.status(res.status).send(text);
    }
  });

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`api-gateway listening on :${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

