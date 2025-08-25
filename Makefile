# Simple developer convenience targets
# Usage: make up | make down | make test | make smoke | make logs | make lint | make format

SHELL := /bin/bash

.PHONY: help up down test test-gateway test-orders test-fleets smoke logs lint lint-types format format-check

help:
	@echo "Targets:"
	@echo "  up           - start dev stack (fixed ports)"
	@echo "  down         - stop dev stack"
	@echo "  test         - run unit tests for all services"
	@echo "  smoke        - run end-to-end smoke script"
	@echo "  logs         - docker compose ps/logs snapshot"
	@echo "  lint         - type-check (tsc --noEmit) and prettier check"
	@echo "  format       - prettier write common files"

up:
	bash scripts/dev-up-fixed.sh

down:
	scripts/dev-down.sh

test: test-gateway test-orders test-fleets

# Individual tests
test-gateway:
	npm test --silent --prefix services/api-gateway

test-orders:
	npm test --silent --prefix services/orders-svc

test-fleets:
	npm test --silent --prefix services/fleets-svc

smoke:
	bash scripts/smoke.sh

logs:
	docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.override.yml -f deploy/docker-compose.override.local.yml ps || true
	docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.override.yml -f deploy/docker-compose.override.local.yml logs --tail=150 || true

lint: lint-types format-check

lint-types:
	( cd services/api-gateway && npx -y tsc -p tsconfig.json --noEmit )
	( cd services/orders-svc && npx -y tsc -p tsconfig.json --noEmit )
	( cd services/fleets-svc && npx -y tsc -p tsconfig.json --noEmit )

format-check:
	npx -y prettier -c "**/*.{ts,js,json,md,yml,yaml}" "!**/dist/**" "!**/node_modules/**"

format:
	npx -y prettier -w "**/*.{ts,js,json,md,yml,yaml}" "!**/dist/**" "!**/node_modules/**"

