import { describe, it, expect } from 'vitest';
import { createWasmSim } from '../src/sim-wasm';
import { buildServer } from '../src/index';

// Fake WASM module export shape
const fakeWasm = {
  apply: (json: string) => {
    const o = JSON.parse(json);
    if (o.kind === 'move') return JSON.stringify({ applied: true, notes: 'moved one step' });
    return JSON.stringify({ applied: false, notes: 'unsupported kind' });
  },
};

describe('orders-svc with WASM sim bridge', () => {
  it('returns delta from wasm apply()', async () => {
    const sim = await createWasmSim(async () => fakeWasm as any);
    const app = await buildServer(undefined, sim);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/orders',
      payload: { kind: 'move', payload: { fleetId: 'f1' } },
    });
    expect(res.statusCode).toBe(202);
    const json = res.json();
    expect(json.delta).toEqual({ applied: true, notes: 'moved one step' });
  });
});

