# Galactic Genesis — Dev Backend

This monorepo hosts the backend services, database schema, and dev tooling for the Galactic Genesis 4X strategy game.

What works today
- Docker Compose dev stack (PostgreSQL, NATS, services)
- API Gateway with proxied routes to services
  - GET /v1/health
  - GET /v1/fleets
  - POST /v1/orders (idempotency header supported)
  - WS /v1/stream

Quick Start (Ubuntu)
- Start (fixed ports; frees 19080 on host if needed):
  - bash scripts/dev-up-fixed.sh
- Stop:
  - scripts/dev-down.sh

Test the API (defaults to http://localhost:19080)
- Health:
  - curl http://localhost:19080/v1/health
- Fleets:
  - curl http://localhost:19080/v1/fleets
- Create order:
  - curl -X POST http://localhost:19080/v1/orders \
    -H "content-type: application/json" \
    -H "Idempotency-Key: demo-1" \
    -d '{"kind":"move","payload":{"fleetId":"f1"}}'
- WebSocket stream (optional):
  - npm i -g wscat && wscat -c ws://localhost:19080/v1/stream

Repo layout
- deploy/ — docker-compose and infra config
- scripts/ — dev scripts (dev-up-fixed.sh, dev-up.sh, dev-down.sh)
- services/
  - api-gateway/ — Fastify gateway
  - orders-svc/ — Order intake + scheduler (stub)
  - fleets-svc/ — Fleet CRUD + movement (stub)
  - event-dispatcher/ — WS + NATS fanout (stub)
- db/sql/ — SQL migrations
- apis/space4x/ — OpenAPI specs

Notes
- The gateway does not serve "/" content; use "/v1/*" endpoints. A friendly root index is provided to list them.
- Services are currently stubs; persistence and real Sim logic are next.

Roadmap (near term)
- Minimal persistence for fleets and orders
- Deterministic Sim Core stub and basic apply() loop
- CI: lint + unit tests + integration smoke

