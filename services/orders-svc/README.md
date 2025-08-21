# orders-svc

Responsibilities
- POST /v1/orders with Idempotency-Key
- Persist orders; return 202 {orderId, target_turn}
- Turn scheduler: on tick, call SimCore.apply() and write order_receipts

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
>>>>>>> origin/main
>>>>>>> origin/main
Events
- Publishes order.receipt on accepted orders (publisher abstraction)

Config
- NATS_URL: when set, uses NATS publisher; else falls back to console publisher
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
- USE_WASM_SIM=1 with SIM_WASM_PATH=./path/to/pkg.js to enable WASM sim-core bridge; fallback is a mock sim

Tests
- Publisher is mocked in unit tests; no NATS required
<<<<<<< HEAD
=======
=======

Tests
- Publisher is mocked in unit tests; no NATS required
<<<<<<< HEAD
=======
=======
Next
- Set up TS project and REST handlers
- PG client and migrations
- NATS publisher for order.receipt
>>>>>>> origin/main
>>>>>>> origin/main
>>>>>>> origin/main
>>>>>>> origin/main

