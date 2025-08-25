import { connect, StringCodec, NatsConnection, Subscription } from 'nats';
import { WebSocketServer, WebSocket } from 'ws';

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const WS_PORT = Number(process.env.WS_PORT || 8090);

export type Dispatcher = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

export async function createDispatcher(natsUrl = NATS_URL, wsPort = WS_PORT): Promise<Dispatcher> {
  const nc: NatsConnection = await connect({ servers: natsUrl });
  const sc = StringCodec();
  const wss = new WebSocketServer({ port: wsPort });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  let subs: Subscription[] = [];

  const topics = ['order.receipt', 'fleet.moved', 'fleet.resupplied'];

  return {
    async start() {
      subs = topics.map((t) => nc.subscribe(t));
      (async () => {
        for await (const s of subs) {
          (async () => {
            for await (const m of s) {
              const text = sc.decode(m.data);
              for (const ws of clients) {
                try {
                  ws.send(text);
                } catch {
                  // ignore WS send errors (client may have disconnected)
                }
              }
            }
          })();
        }
      })();
    },
    async stop() {
      subs.forEach((s) => s.unsubscribe());
      wss.close();
      await nc.drain();
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createDispatcher()
    .then((d) => d.start())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
