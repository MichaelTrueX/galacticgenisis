# Dev Smoke Test

Goal: Verify the end-to-end dev loop works with docker-compose.override

Prereqs

- Docker and docker-compose

Steps

1. From repo root:
   - docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.override.yml up
2. In a new terminal, test REST via gateway:
   - Health: curl -s http://localhost:8080/v1/health | jq
   - Submit order: curl -s -X POST http://localhost:8080/v1/orders \
      -H 'content-type: application/json' \
      -H 'Idempotency-Key: demo-1' \
      -d '{"kind":"move","payload":{"fleetId":"f1"}}' | jq
3. Connect a WS client (e.g. wscat) to see events:
   - wscat -c ws://localhost:8080/v1/stream
   - You should see order.receipt JSON after submitting an order

4. Optional resupply smoke
   - Submit: curl -s -X POST http://localhost:8080/v1/orders \
      -H 'content-type: application/json' \
      -H 'Idempotency-Key: demo-resupply-1' \
      -d '{"kind":"resupply","payload":{"fleetId":"<your-fleet-id>","amount":20}}' | jq
   - Expect 202 with orderId and target_turn

Notes

- orders-svc publishes to NATS; event-dispatcher broadcasts over WS; gateway proxies WS at /v1/stream
- USE_WASM_SIM is optional; mock sim is used by default
