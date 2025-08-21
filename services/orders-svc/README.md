# orders-svc

Responsibilities
- POST /v1/orders with Idempotency-Key
- Persist orders; return 202 {orderId, target_turn}
- Turn scheduler: on tick, call SimCore.apply() and write order_receipts

Next
- Set up TS project and REST handlers
- PG client and migrations
- NATS publisher for order.receipt

