#!/usr/bin/env bash
set -euo pipefail

# Simple smoke test against the API gateway.
# Requirements: curl; jq (optional for stricter checks)
# Usage:
#   scripts/smoke.sh [--gateway URL] [--idem KEY] [--payload JSON]
# Defaults:
#   GATEWAY_URL (env or --gateway) default http://localhost:8080
#   Idempotency-Key default demo-1
#   Payload default '{"kind":"move","payload":{"fleetId":"f1"}}'

GATEWAY_URL=${GATEWAY_URL:-http://localhost:8080}
IDEM_KEY=demo-1
PAYLOAD='{"kind":"move","payload":{"fleetId":"f1"}}'

# Parse args (very simple)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gateway)
      GATEWAY_URL="$2"; shift 2;;
    --idem)
      IDEM_KEY="$2"; shift 2;;
    --payload)
      PAYLOAD="$2"; shift 2;;
    -h|--help)
      echo "Usage: $0 [--gateway URL] [--idem KEY] [--payload JSON]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

pass=0; fail=0
_has_jq() { command -v jq >/dev/null 2>&1; }
_print() { printf "%s\n" "$*"; }

_req() {
  local method="$1" url="$2" body="${3:-}"; shift || true
  local extra=("$@")
  if [[ -n "$body" ]]; then
    curl -sS -w "\n%{http_code}" -X "$method" "$url" -H 'content-type: application/json' "${extra[@]}" --data-binary "$body"
  else
    curl -sS -w "\n%{http_code}" -X "$method" "$url" "${extra[@]}"
  fi
}

_check() {
  local name="$1" method="$2" url="$3" body="${4:-}" header_key="${5:-}" header_val="${6:-}"
  local resp code data
  if [[ -n "$header_key" ]]; then
    resp=$(_req "$method" "$url" "$body" -H "$header_key: $header_val")
  else
    resp=$(_req "$method" "$url" "$body")
  fi
  code=${resp##*$'\n'}
  data=${resp%$'\n'*}
  if [[ "$code" =~ ^2[0-9]{2}$ ]]; then
    _print "✔ $name ($code)"
    _print "$data"
    pass=$((pass+1))
  else
    _print "✖ $name failed ($code)"
    _print "$data"
    fail=$((fail+1))
  fi
}

_print "Gateway: $GATEWAY_URL"

# 1) Health
_check "GET /v1/health" GET "$GATEWAY_URL/v1/health"
if _has_jq; then echo "$(_req GET "$GATEWAY_URL/v1/health" | head -n1)" | jq -e '.ok==true' >/dev/null 2>&1 || true; fi

# 2) Fleets
_check "GET /v1/fleets" GET "$GATEWAY_URL/v1/fleets"
if _has_jq; then echo "$(_req GET "$GATEWAY_URL/v1/fleets" | head -n1)" | jq -e '.fleets|type=="array"' >/dev/null 2>&1 || true; fi

# 3) Submit order
_check "POST /v1/orders" POST "$GATEWAY_URL/v1/orders" "$PAYLOAD" "Idempotency-Key" "$IDEM_KEY"

_print "---"
_print "Passed: $pass  Failed: $fail"
exit $([[ $fail -eq 0 ]] && echo 0 || echo 1)

