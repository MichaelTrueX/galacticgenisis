import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide a per-test client factory that the pg mock will use
let getClient: () => any = () => ({});
vi.mock('pg', () => ({
  default: {
    Pool: class {
      async connect() {
        return getClient();
      }
    },
  },
}));

const mkClient = (cases: Array<{ match: RegExp; result: any }>) => {
  let idx = 0;
  return {
    async query(sql: string) {
      if (/^BEGIN$/.test(sql)) return {} as any;
      if (/^COMMIT$/.test(sql)) return {} as any;
      if (/^ROLLBACK$/.test(sql)) return {} as any;
      // Allow generic updates/inserts in worker path without matching
      if (/^(update|insert)/i.test(sql)) return { rows: [] } as any;
      const c = cases[idx] || cases[cases.length - 1];
      if (!c || !c.match.test(sql)) throw new Error(`no match for sql: ${sql}`);
      idx++;
      return c.result;
    },
    release() {},
  } as any;
};

describe('startApplyWorker events', () => {
  const publish = vi.fn();
  const pub = { publish } as any;

  beforeEach(() => {
    publish.mockReset();
  });

  it('publishes order.rejected when move has insufficient supply', async () => {
    // Arrange client query results sequence for a move with low supply
    const client = mkClient([
      {
        match: /^select id, kind, payload from orders/,
        result: {
          rows: [{ id: 'o1', kind: 'move', payload: { fleetId: 'f1', toSystemId: 'sys-2' } }],
        },
      },
      {
        match: /^select id, system_id, supply from fleets/,
        result: { rows: [{ id: 'f1', system_id: 'sys-1', supply: 0 }] },
      },
    ]);
    getClient = () => client;
    const { startApplyWorker } = await import('../src/index');
    const stop = startApplyWorker(pub, 5);
    await new Promise((r) => setTimeout(r, 25));
    stop();

    expect(publish).toHaveBeenCalledWith(
      'order.rejected',
      expect.objectContaining({ orderId: 'o1' }),
    );
  });

  it('publishes fleet.resupplied and order.applied on resupply', async () => {
    const client = mkClient([
      {
        match: /^select id, kind, payload from orders/,
        result: { rows: [{ id: 'o2', kind: 'resupply', payload: { fleetId: 'f9', amount: 20 } }] },
      },
      { match: /^select id, supply from fleets/, result: { rows: [{ id: 'f9', supply: 100 }] } },
    ]);
    getClient = () => client;
    const { startApplyWorker } = await import('../src/index');
    const stop = startApplyWorker(pub, 5);
    await new Promise((r) => setTimeout(r, 25));
    stop();

    expect(publish).toHaveBeenCalledWith(
      'fleet.resupplied',
      expect.objectContaining({ orderId: 'o2', fleetId: 'f9' }),
    );
    expect(publish).toHaveBeenCalledWith(
      'order.applied',
      expect.objectContaining({ orderId: 'o2' }),
    );
  });
});
