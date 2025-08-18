import Fastify from 'fastify';

const port = Number(process.env.PORT || 8080);

async function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/v1/health', async (_req, _rep) => {
    return { ok: true };
  });

  return app;
}

async function start() {
  const app = await buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`api-gateway listening on :${port}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

