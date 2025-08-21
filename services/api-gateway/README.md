# api-gateway

Fastify-based API Gateway.

Responsibilities
- Terminate REST/WS
- AuthN (dev JWT stub), CORS/CSP, rate limiting
- Route to backend services

Implemented
- GET /v1/health
- Proxy POST /v1/orders → orders-svc (passes Idempotency-Key, Authorization)

Config
- ORDERS_SVC_URL (default http://localhost:8081)

