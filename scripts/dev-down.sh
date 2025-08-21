#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
COMPOSE_BASE="$ROOT_DIR/deploy/docker-compose.yml"
COMPOSE_DEV="$ROOT_DIR/deploy/docker-compose.override.yml"

echo "[INFO] Shutting down compose stack..."
docker compose -f "$COMPOSE_BASE" -f "$COMPOSE_DEV" down -v

