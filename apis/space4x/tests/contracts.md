# API Contract Tests Plan

Scope (phase 1)
- GET /v1/health returns 200 with { ok: true }
- POST /v1/orders returns 202 and includes orderId and target_turn

Gateway proxy checks
- When POST /v1/orders is called on api-gateway, it forwards body and headers Idempotency-Key, Authorization to orders-svc

Test approach
- Unit tests on services with supertest (or fastify.inject)
- Contract tests stub orders-svc in isolation and verify api-gateway behavior
- No DB or NATS required yet

Next phases
- Expand to scheduler tick events and NATS-based WS via event-dispatcher

