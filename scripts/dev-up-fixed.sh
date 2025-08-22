#!/usr/bin/env bash
set -euo pipefail

# Start the dev stack with fixed host ports.
# - Uses only the gateway host port; all other services are internal to Docker
# - Kills any process using the gateway host port before starting
# - Waits for readiness and runs the smoke test
#
# Fixed ports
#   GATEWAY_PORT=19080 (host) -> container 8080
#
# Usage:
#   scripts/dev-up-fixed.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
COMPOSE_BASE="$ROOT_DIR/deploy/docker-compose.yml"
COMPOSE_DEV="$ROOT_DIR/deploy/docker-compose.override.yml"
COMPOSE_LOCAL="$ROOT_DIR/deploy/docker-compose.override.local.yml"

GATEWAY_PORT=19080
export GATEWAY_PORT

info()  { printf "[INFO] %s\n" "$*"; }
warn()  { printf "[WARN] %s\n" "$*"; }
error() { printf "[ERR ] %s\n" "$*" 1>&2; }

have_cmd() { command -v "$1" >/dev/null 2>&1; }

require_docker() {
  if have_cmd docker; then
    info "Docker found: $(docker --version)"
  else
    error "Docker not found. Please install Docker first or use scripts/dev-up.sh --install-docker"
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    info "Docker Compose plugin found: $(docker compose version)"
  else
    error "Docker compose plugin not found. Install docker-compose-plugin"
    exit 1
  fi
}

kill_port() {
  local port="$1"
  # Try ss first, fall back to lsof
  local pids=""
  if ss -ltnp 2>/dev/null | grep -E ":${port} .*LISTEN" >/dev/null; then
    pids=$(ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | sort -u)
  else
    if command -v lsof >/dev/null 2>&1; then
      pids=$(sudo lsof -t -iTCP:"${port}" -sTCP:LISTEN -nP 2>/dev/null | sort -u || true)
    fi
  fi
  if [[ -n "$pids" ]]; then
    warn "Killing processes on port ${port}: $pids"
    sudo kill -9 $pids || true
    sleep 0.5
  fi
}

bring_up() {
  info "Starting compose stack on gateway port ${GATEWAY_PORT}..."
  docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_DEV" -f "$COMPOSE_LOCAL" up -d
}

wait_gateway() {
  local tries=60
  local url="http://localhost:${GATEWAY_PORT}/v1/health"
  info "Waiting for gateway at ${url} ..."
  for i in $(seq 1 $tries); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
    if [[ "$code" == "200" ]]; then
      info "Gateway is ready (HTTP 200)"
      return 0
    fi
    sleep 2
  done
  warn "Gateway did not become healthy in time; printing logs"
  docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_DEV" -f "$COMPOSE_LOCAL" logs --no-color || true
  return 1
}

run_smoke() {
  if [[ -x "$ROOT_DIR/scripts/smoke.sh" ]]; then
    info "Running smoke checks..."
    GATEWAY_URL="http://localhost:${GATEWAY_PORT}" bash "$ROOT_DIR/scripts/smoke.sh" || warn "Smoke test failed"
  else
    warn "scripts/smoke.sh not found; skipping smoke test"
  fi
}

main() {
  require_docker
  # Kill only the one host port we publish
  kill_port "$GATEWAY_PORT"
  bring_up
  wait_gateway || true
  run_smoke || true
  info "Dev stack is up."
  cat <<NEXT

Access:
- API Gateway: http://localhost:${GATEWAY_PORT}
  * Health:  curl http://localhost:${GATEWAY_PORT}/v1/health
  * Fleets:  curl http://localhost:${GATEWAY_PORT}/v1/fleets
  * Orders:  curl -X POST http://localhost:${GATEWAY_PORT}/v1/orders \
              -H 'content-type: application/json' \
              -H 'Idempotency-Key: demo-1' \
              -d '{"kind":"move","payload":{"fleetId":"f1"}}'
- WS Stream: ws://localhost:${GATEWAY_PORT}/v1/stream

Stop:
- scripts/dev-down.sh
NEXT
}

main "$@"

