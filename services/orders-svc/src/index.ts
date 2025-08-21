import Fastify from 'fastify';
import { nanoid } from 'nanoid';

const port = Number(process.env.PORT || 8081);

async function buildServer() {
  const app = Fastify({ logger: true });

  app.post('/v1/orders', async (req, rep) => {
    // Minimal idempotency: echo Idempotency-Key if provided
    const idemKey = req.headers['idempotency-key'];

    const body = req.body as any;
    if (!body || typeof body.kind !== 'string' || typeof body.payload !== 'object') {
      return rep.status(400).send({ error: 'Invalid body' });
    }

    const orderId = nanoid();
    const target_turn = 1; // stub for now

    // We are not writing to DB yet; this is a stub endpoint
    return rep.status(202).send({ orderId, target_turn, idemKey });
  });

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`orders-svc listening on :${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

