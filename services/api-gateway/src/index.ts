import Fastify from 'fastify';

const port = Number(process.env.PORT || 8080);
const ORDERS_SVC_URL = process.env.ORDERS_SVC_URL || 'http://localhost:8081';
<<<<<<< HEAD
const FLEETS_SVC_URL = process.env.FLEETS_SVC_URL || 'http://localhost:8082';
=======
>>>>>>> origin/main
const EVENTS_WS_URL = process.env.EVENTS_WS_URL || 'ws://localhost:8090';

export async function buildServer() {
  const app = Fastify({ logger: true });
  // Register Fastify websocket plugin
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fastifyWs = require('@fastify/websocket');
  app.register(fastifyWs);

  app.get('/v1/health', async (_req, _rep) => {
    return { ok: true };
  });

  // Proxy: POST /v1/orders -> orders-svc (validate body before forwarding)
  app.post<{ Body: { kind: string; payload: Record<string, unknown> } }>(
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
      },
    },
    async (req, rep) => {
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
    }
  );

<<<<<<< HEAD
  // Proxy: GET /v1/fleets -> fleets-svc
  app.get('/v1/fleets', async (_req, rep) => {
    const res = await fetch(`${FLEETS_SVC_URL}/v1/fleets`);
    const text = await res.text();
    try {
      return rep.status(res.status).send(JSON.parse(text));
    } catch {
      return rep.status(res.status).send(text);
    }
  });

=======
>>>>>>> origin/main
  // WS proxy: GET /v1/stream -> event-dispatcher WS (simple pipe)
  app.get('/v1/stream', { websocket: true } as any, (connection: any /* fastify ws plugin shape */) => {
    const { socket } = connection;
    // Lazy require ws to avoid import types clashing
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocket = require('ws');
    const upstream = new WebSocket(EVENTS_WS_URL);

    // Pipe upstream -> client
    upstream.on('message', (data: any) => {
      try { socket.send(data); } catch {}
    });
    upstream.on('close', () => { try { socket.close(); } catch {} });
    upstream.on('error', () => { try { socket.close(); } catch {} });

    // Pipe client -> upstream (if needed later)
    socket.on('message', (data: any) => {
      try { upstream.send(data); } catch {}
    });
    socket.on('close', () => { try { upstream.close(); } catch {} });
    socket.on('error', () => { try { upstream.close(); } catch {} });
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

