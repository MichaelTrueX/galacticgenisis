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
  - List: curl http://localhost:19080/v1/fleets
  - Create: curl -X POST http://localhost:19080/v1/fleets -H 'content-type: application/json' -d '{"empire_id":"emp-1","system_id":"sys-1","stance":"neutral","supply":100}'
  - Update: curl -X PATCH http://localhost:19080/v1/fleets/<id> -H 'content-type: application/json' -d '{"stance":"aggressive"}'
- Orders:
  - Submit move: curl -X POST http://localhost:19080/v1/orders -H 'content-type: application/json' -H 'Idempotency-Key: demo-1' -d '{"kind":"move","payload":{"fleetId":"fleet-1","toSystemId":"sys-2"}}'
  - List: curl http://localhost:19080/v1/orders
  - Get: curl http://localhost:19080/v1/orders/<orderId>
- WebSocket stream (optional):
  - npm i -g wscat && wscat -c ws://localhost:19080/v1/stream

Quick manual testing
- REST Client examples (VS Code):
  - Open apis/space4x/gateway.http and click “Send Request” on a request line
  - Includes Health, Fleets list/create, Orders submit/list/get
- Smoke test:
  - scripts/smoke.sh
  - Verifies health, fleets list, submit move, GET /v1/orders/{id}, and polls for the fleet to arrive at sys-2 if seeds/worker are running


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


Troubleshooting
- Port busy on 19080: another service is using the port. Run scripts/dev-down.sh to clean up, or change the mapped port in deploy/docker-compose.override.local.yml.
- Gateway not healthy: run docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.override.yml -f deploy/docker-compose.override.local.yml logs api-gateway and check for binding errors.
- Tests fail due to DB: unit tests run with NODE_ENV=test, which stubs DB in fleets and orders. Ensure you run npm test in each service directory (no DB needed).
- Smoke flakiness: ensure jq is installed locally; the CI installs it automatically. The move demo depends on seeds/worker to apply movements.

