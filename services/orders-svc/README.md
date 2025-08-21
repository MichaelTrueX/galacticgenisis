# orders-svc

Responsibilities
- POST /v1/orders with Idempotency-Key
- Persist orders; return 202 {orderId, target_turn}
- Turn scheduler: on tick, call SimCore.apply() and write order_receipts

<<<<<<< HEAD
Events
- Publishes order.receipt on accepted orders (publisher abstraction)

Config
- NATS_URL: when set, uses NATS publisher; else falls back to console publisher

Tests
- Publisher is mocked in unit tests; no NATS required
=======
Next
- Set up TS project and REST handlers
- PG client and migrations
- NATS publisher for order.receipt
>>>>>>> origin/main

