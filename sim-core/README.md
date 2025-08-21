# sim-core

Deterministic simulation core (Rust), exposed to Node via WASM for prototype.

Responsibilities
- apply(orderEnvelope) -> deterministic deltas (mock initially)
- Seeded RNG per sector + turn; no wall clock use

Next
- Initialize Rust crate with wasm-bindgen
- Define API surface and return types for deltas
- Add determinism unit tests

