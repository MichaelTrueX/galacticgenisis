#!/usr/bin/env bash
set -euo pipefail

# Start the full dev stack on Ubuntu using Docker Compose.
# - Optionally installs Docker + compose plugin (Ubuntu) when --install-docker is passed
# - Brings up the stack in detached mode
# - Waits for the API gateway to become healthy
# - Optionally runs the smoke test (scripts/smoke.sh) when --smoke is passed
#
# Usage:
#   scripts/dev-up.sh [--install-docker] [--smoke]
# Env:
#   GATEWAY_PORT=8080 (default)

GATEWAY_PORT=${GATEWAY_PORT:-8080}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
COMPOSE_BASE="$ROOT_DIR/deploy/docker-compose.yml"
COMPOSE_DEV="$ROOT_DIR/deploy/docker-compose.override.yml"
COMPOSE_PORTS="$ROOT_DIR/deploy/docker-compose.override.ports.yml"
COMPOSE_LOCAL="$ROOT_DIR/deploy/docker-compose.override.local.yml"

info()  { printf "[INFO] %s\n" "$*"; }
warn()  { printf "[WARN] %s\n" "$*"; }
error() { printf "[ERR ] %s\n" "$*" 1>&2; }

need_install=false
run_smoke=false
force_port=false
auto_port=false
CLI_PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install-docker) need_install=true; shift ;;
    --smoke) run_smoke=true; shift ;;
    --force-port) force_port=true; shift ;;
    --auto-port) auto_port=true; shift ;;
    --port) CLI_PORT="$2"; shift 2 ;;
    -h|--help)
      cat <<USAGE
Usage: $0 [--install-docker] [--smoke] [--port N] [--force-port] [--auto-port]
  --install-docker  Install Docker Engine and compose plugin (Ubuntu, requires sudo)
  --smoke           After boot, run scripts/smoke.sh against the gateway
  --port N          Host port for the gateway (overrides GATEWAY_PORT env)
  --force-port      Kill any process using the chosen host port before start (DANGEROUS)
  --auto-port       Find the first free port starting at the chosen port
Env:
  GATEWAY_PORT      Defaults to 8080; can be overridden by --port
USAGE
      exit 0
      ;;
    *) error "Unknown arg: $1"; exit 1 ;;
  esac
done

have_cmd() { command -v "$1" >/dev/null 2>&1; }

install_docker_ubuntu() {
  if [[ $EUID -ne 0 ]]; then SUDO=sudo; else SUDO=""; fi
  info "Installing Docker Engine + compose plugin (Ubuntu)"
  $SUDO apt-get update -y
  $SUDO apt-get install -y ca-certificates curl gnupg lsb-release
  if [[ ! -e /etc/apt/keyrings/docker.gpg ]]; then
    $SUDO install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  fi
  . /etc/os-release
  echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$VERSION_CODENAME stable" | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  info "Docker installed. You may need to re-login for non-root docker usage."
}

require_docker() {
  if have_cmd docker; then
    info "Docker found: $(docker --version)"
  else
    if $need_install; then
      install_docker_ubuntu
    else
      error "Docker not found. Re-run with --install-docker (Ubuntu) or install Docker manually."
      exit 1
    fi
  fi
  if docker compose version >/dev/null 2>&1; then
    info "Docker Compose plugin found: $(docker compose version)"
  else
    if $need_install; then
      install_docker_ubuntu
    else
      error "Docker compose plugin not found. Re-run with --install-docker or install docker-compose-plugin."
      exit 1
    fi
  fi
}

is_port_free() { ! ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ":${GATEWAY_PORT}$" >/dev/null; }
kill_port_if_needed() {
  if $force_port; then
    if ss -ltnp 2>/dev/null | grep -E ":${GATEWAY_PORT} .*LISTEN" >/dev/null; then
      warn "--force-port set: killing processes on ${GATEWAY_PORT}"
      # Kill processes bound to the port (best-effort)
      PIDS=$(ss -ltnp 2>/dev/null | awk -v p=":${GATEWAY_PORT}" '$4 ~ p {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | sort -u)
      if [[ -n "$PIDS" ]]; then
        sudo kill -9 $PIDS || true
      fi
    fi
  fi
}

choose_port() {
  if [[ -n "$CLI_PORT" ]]; then GATEWAY_PORT="$CLI_PORT"; fi
  if $auto_port; then
    base="$GATEWAY_PORT"
    for ((i=0; i<50; i++)); do
      try=$((base + i))
      if ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ":${try}$" >/dev/null; then
        continue
      else
        GATEWAY_PORT="$try"; export GATEWAY_PORT
        info "Auto-selected free port: ${GATEWAY_PORT}"
        return
      fi
    done
    warn "Auto-port could not find a free port near ${base}; continuing with ${GATEWAY_PORT}"
  fi
}

bring_up() {
  choose_port
  kill_port_if_needed
  info "Starting compose stack on gateway port ${GATEWAY_PORT}..."
  # Use the local override that publishes only the gateway on the chosen port,
  # avoiding conflicts on 8081/8082/8090 for other services.
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
  docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_DEV" logs --no-color || true
  return 1
}

run_smoke_if_requested() {
  if $run_smoke; then
    if [[ -x "$ROOT_DIR/scripts/smoke.sh" ]]; then
      info "Running smoke checks..."
      bash "$ROOT_DIR/scripts/smoke.sh" || { warn "Smoke test failed"; return 1; }
    else
      warn "scripts/smoke.sh not found or not executable; skipping"
    fi
  fi
}

main() {
  require_docker
  bring_up
  wait_gateway
  run_smoke_if_requested || true
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
- WS Stream: ws://localhost:${GATEWAY_PORT}/v1/stream (e.g., with wscat)

Manage:
- Show logs:   docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.override.yml logs -f
- Shutdown:    scripts/dev-down.sh
NEXT
}

main "$@"

