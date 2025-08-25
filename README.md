# Galactic Genesis — Dev Backend

This monorepo hosts the backend services, database schema, and dev tooling for the Galactic Genesis 4X strategy game.

What works today

- Docker Compose dev stack (PostgreSQL, NATS, services)
- API Gateway with proxied routes to services
  - GET /v1/health
  - Fleets: GET /v1/fleets, POST /v1/fleets, PATCH /v1/fleets/:id
  - Orders: POST /v1/orders (idempotency header supported), GET /v1/orders, GET /v1/orders/:id
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
- Make targets:
  - make up / make down
  - make test (or make test-gateway|test-orders|test-fleets)
  - make smoke
  - make logs

- WebSocket stream (optional):
  - Option A: npm i -g wscat && wscat -c ws://localhost:19080/v1/stream
  - Option B: websocat -t ws://localhost:19080/v1/stream

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

- The gateway does not serve "/" content; use "/v1/\*" endpoints. A friendly root index is provided to list them.
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

Environment variables (dev)

- API Gateway
  - PORT: gateway port (default 8080 in compose, 19080 host-mapped)
  - ORDERS_SVC_URL: downstream orders service URL (default http://localhost:8081)
  - FLEETS_SVC_URL: downstream fleets service URL (default http://localhost:8082)
  - EVENTS_WS_URL: upstream dispatcher websocket URL (default ws://localhost:8090)
- Orders Service
  - NATS_URL: if set, publishes events to NATS instead of console
  - APPLY_MS: worker tick interval in ms (default 2000)
  - DEFAULT_EMPIRE_ID: empire used for accepted orders in dev/test (default emp-1)
  - PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE: database connection (compose defaults)
- Event Dispatcher
  - NATS_URL: NATS servers URL (default nats://localhost:4222)
  - WS_PORT: websocket server port (default 8090)
  - Readiness: GET /readyz returns 503 if NATS is not connected
- Fleets Service
  - PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE: database connection (compose defaults)

Notes on intent

- NATS_URL enables real event fan-out for local end-to-end streams via event-dispatcher.

Troubleshooting (dev)

- Port conflicts: ensure 8080 (gateway), 4222/8222 (NATS) aren’t in use; override gateway host port via GATEWAY_PORT env
- Compose up/down:
  - make up to start; make down to stop and prune volumes
  - docker compose ps/logs: make logs for snapshot
- Smoke issues:
  - Verify GET /v1/health returns 200
  - Try scripts/smoke.sh --gateway http://localhost:19080 if using mapped port
  - WS checks: install websocat and pass --ws
- Lint-staged failures on commit: run make format and make lint locally, commit again

- APPLY_MS controls how fast the worker looks for accepted orders; keep high enough to avoid churn.
- DEFAULT_EMPIRE_ID allows the API to accept orders in dev without authentication or user context.
- WS_PORT exposes the dispatcher’s WS feed consumed by the gateway at /v1/stream.
