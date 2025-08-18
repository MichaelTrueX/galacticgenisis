# fleets-svc

Responsibilities
- Fleet CRUD
- POST /v1/orders/move → queue movement order (delegates to orders)
- On tick: resolveMovement via Sim Core; publish fleet.moved

Next
- Set up TS project and REST handlers
- PG models and path validation
- NATS publisher for fleet.moved

