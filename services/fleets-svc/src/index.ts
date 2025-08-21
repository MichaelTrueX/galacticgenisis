import Fastify from 'fastify';

export async function buildServer() {
  const app = Fastify({ logger: true });

  // Minimal placeholder: list fleets (static for now)
  app.get('/v1/fleets', async () => ({ fleets: [] }));

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

