// Placeholder for a future WASM bridge. For now we export a factory that can be swapped in tests.
export type WasmApply = (orderJson: string) => string;

export async function createWasmSim(load: () => Promise<{ apply: WasmApply }>) {
  const mod = await load();
  return {
    async apply(order: { kind: string; payload: Record<string, unknown> }) {
      const out = mod.apply(JSON.stringify(order));
      try {
        return JSON.parse(out) as { applied: boolean; notes: string };
      } catch {
        return { applied: false, notes: 'invalid delta' };
      }
    },
  };
}

