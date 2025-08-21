import { createWasmSim } from './sim-wasm';
import type { Sim } from './index';

export async function loadSimFromEnv(): Promise<Sim> {
  if (process.env.USE_WASM_SIM === '1') {
    // Dynamically load a JS glue that exposes { apply } from built WASM
    // Expect SIM_WASM_PATH to point to compiled module JS (wasm-bindgen or wasm-pack output)
    const path = process.env.SIM_WASM_PATH;
    if (!path) throw new Error('SIM_WASM_PATH not set');
    const loader = async () => (await import(/* @vite-ignore */ path)) as any;
    return await createWasmSim(loader);
  }
  throw new Error('WASM sim not enabled');
}

