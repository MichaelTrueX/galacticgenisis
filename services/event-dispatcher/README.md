# event-dispatcher

Responsibilities

- WebSocket server for client subscriptions
- Subscribe to NATS topics and broadcast frames to all connected clients

Endpoints

- GET /healthz — liveness probe
- GET /readyz — readiness probe (200 when NATS is connected, 503 otherwise)

Environment

- NATS_URL: NATS servers URL (default nats://localhost:4222)
- WS_PORT: WebSocket/HTTP server port (default 8090)

Topics (NATS subjects)

- order.receipt — order accepted/applied/rejected receipts
- fleet.moved — movement events (stubbed)
- fleet.resupplied — resupply events

Usage

- Connect a WS client to ws://localhost:8090 (or via the Gateway proxy at ws://localhost:8080/v1/stream)
- Messages are JSON strings produced by services publishing to NATS

Testing

- Unit tests mock NATS and WS to verify broadcast behavior and health endpoints
- CI runs type-checks and tests for this package
