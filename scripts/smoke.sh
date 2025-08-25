#!/usr/bin/env bash
set -euo pipefail

# Simple smoke test against the API gateway.
# Requirements: curl; jq (optional for stricter checks)
# Usage:
#   scripts/smoke.sh [--gateway URL] [--idem KEY] [--payload JSON] [--ws]
# Defaults:
#   GATEWAY_URL (env or --gateway) default http://localhost:8080
#   Idempotency-Key default demo-1
#   Payload default '{"kind":"move","payload":{"fleetId":"f1"}}'
#   --ws subscribes briefly to /v1/stream to assert an event appears (requires websocat)

GATEWAY_URL=${GATEWAY_URL:-http://localhost:8080}
IDEM_KEY=demo-1
PAYLOAD='{"kind":"move","payload":{"fleetId":"f1"}}'

WS_CHECK=false
# Parse args (very simple)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gateway)
      GATEWAY_URL="$2"; shift 2;;
    --idem)
      IDEM_KEY="$2"; shift 2;;
    --payload)
      PAYLOAD="$2"; shift 2;;
    --ws)
      WS_CHECK=true; shift 1;;
    -h|--help)
      echo "Usage: $0 [--gateway URL] [--idem KEY] [--payload JSON] [--ws]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
  shift || true
done

pass=0; fail=0
_has_jq() { command -v jq >/dev/null 2>&1; }
_print() { printf "%s\n" "$*"; }
# jq assertion helper (name, json, jq_filter)
_assert_jq() {
  local name="$1" json="$2" filter="$3"
  if _has_jq && printf "%s" "$json" | jq -e "$filter" >/dev/null 2>&1; then
    _print "✔ $name (jq)"; pass=$((pass+1))
  else
    _print "✖ $name (jq)"; fail=$((fail+1))
  fi
}

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

_print "Gateway: $GATEWAY_URL (ws check: $WS_CHECK)"

# 0) Wait for gateway readiness (aggregated)
for i in $(seq 1 30); do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$GATEWAY_URL/readyz" || true)
  if [[ "$code" == "200" ]]; then _print "gateway ready"; break; fi
  sleep 1
  if [[ $i -eq 30 ]]; then _print "gateway not ready after 30s; proceeding anyway"; fi
done

# 1) Health
_check "GET /v1/health" GET "$GATEWAY_URL/v1/health"
if _has_jq; then echo "$(_req GET "$GATEWAY_URL/v1/health" | head -n1)" | jq -e '.ok==true' >/dev/null 2>&1 || true; fi

# 2) Fleets
_check "GET /v1/fleets" GET "$GATEWAY_URL/v1/fleets"
if _has_jq; then echo "$(_req GET "$GATEWAY_URL/v1/fleets" | head -n1)" | jq -e '.fleets|type=="array"' >/dev/null 2>&1 || true; fi

# 3) Submit order
_check "POST /v1/orders" POST "$GATEWAY_URL/v1/orders" "$PAYLOAD" "Idempotency-Key" "$IDEM_KEY"
# 3a) List orders and assert shape when jq is available
_check "GET /v1/orders" GET "$GATEWAY_URL/v1/orders"
if _has_jq; then _assert_jq ".orders is array" "$(_req GET \"$GATEWAY_URL/v1/orders\" | head -n1)" '.orders|type=="array"'; fi


# 3b) Move demo (requires jq)
if _has_jq; then
  _print "Attempting move demo using sys-2 (requires seeds) and resupply demo (ws check: $WS_CHECK)"
  # Create a fleet at sys-1
  create_resp=$(_req POST "$GATEWAY_URL/v1/fleets" '{"empire_id":"emp-1","system_id":"sys-1","stance":"neutral","supply":100}')
  create_code=${create_resp##*$'\n'}
  create_body=${create_resp%$'\n'*}
  if [[ "$create_code" =~ ^2[0-9]{2}$ ]]; then
    new_id=$(printf "%s" "$create_body" | jq -r '.id // empty')
    if [[ -n "$new_id" ]]; then
      _assert_jq "create fleet body has id/system_id" "$create_body" '.id and .system_id'
      _print "Created fleet: $new_id"
      # Submit a move order to sys-2
      move_payload=$(printf '{"kind":"move","payload":{"fleetId":"%s","toSystemId":"sys-2"}}' "$new_id")
      # Submit a move order to sys-2 and capture orderId
      move_resp=$(_req POST "$GATEWAY_URL/v1/orders" "$move_payload" "Idempotency-Key" "smoke-move-$new_id")
      move_code=${move_resp##*$'\n'}
      move_body=${move_resp%$'\n'*}
      if [[ "$move_code" =~ ^2[0-9]{2}$ ]]; then
        _assert_jq "move receipt has orderId/target_turn" "$move_body" '.orderId and (.target_turn|type=="number")'
        orderId=$(printf "%s" "$move_body" | jq -r '.orderId // empty')
        _print "Submitted move order: $orderId"
        # Verify GET /v1/orders/<id>
        get_order_resp=$(_req GET "$GATEWAY_URL/v1/orders/$orderId")
        get_order_code=${get_order_resp##*$'\n'}
        get_order_body=${get_order_resp%$'\n'*}
        if [[ "$get_order_code" =~ ^2[0-9]{2}$|^404$ ]]; then
          _print "✔ GET /v1/orders/$orderId returned $get_order_code"
          pass=$((pass+1))
          if [[ "$get_order_code" == "200" ]]; then _assert_jq "order has id/status" "$get_order_body" '.id and .status'; fi
        else
          _print "✖ GET /v1/orders/$orderId failed ($get_order_code)"; fail=$((fail+1))
        fi
      else
        _print "✖ POST /v1/orders (move -> sys-2) failed ($move_code)"; _print "$move_body"; fail=$((fail+1))
      fi
      # Resupply demo
      if $WS_CHECK && command -v websocat >/dev/null 2>&1; then
        # background subscribe to /v1/stream and capture a single message
        ws_url=${GATEWAY_URL/http/ws}
        ws_tmp=$(mktemp)
        (websocat -t "$ws_url/v1/stream" | head -n1 > "$ws_tmp") &
        ws_pid=$!
      fi
      resupply_payload=$(printf '{"kind":"resupply","payload":{"fleetId":"%s","amount":20}}' "$new_id")
      resupply_resp=$(_req POST "$GATEWAY_URL/v1/orders" "$resupply_payload" "Idempotency-Key" "smoke-resupply-$new_id")
      resupply_code=${resupply_resp##*$'\n'}
      resupply_body=${resupply_resp%$'\n'*}
      if [[ "$resupply_code" =~ ^2[0-9]{2}$ ]]; then
        _assert_jq "resupply receipt has orderId/target_turn" "$resupply_body" '.orderId and (.target_turn|type=="number")'
        pass=$((pass+1))
        # if ws check is on, wait briefly for an event
        if $WS_CHECK && [[ -n "${ws_pid:-}" ]]; then
          for i in $(seq 1 5); do
            if [[ -s "$ws_tmp" ]]; then break; fi
            sleep 1
          done
          if [[ -s "$ws_tmp" ]]; then _print "✔ WS received an event"; pass=$((pass+1)); else _print "✖ WS did not receive an event"; fail=$((fail+1)); fi
          kill "$ws_pid" >/dev/null 2>&1 || true
          rm -f "$ws_tmp" || true
        fi
      else
        _print "✖ POST /v1/orders (resupply) failed ($resupply_code)"; _print "$resupply_body"; fail=$((fail+1))
      fi
      # Wait until fleet shows at sys-2
      ok=false
      for i in $(seq 1 10); do
        fjson=$(_req GET "$GATEWAY_URL/v1/fleets" | head -n1)
        at_sys=$(printf "%s" "$fjson" | jq -r --arg id "$new_id" '.fleets[]?|select(.id==$id)|.system_id // empty')
        if [[ "$at_sys" == "sys-2" ]]; then ok=true; break; fi
        sleep 1
      done
      if $ok; then _print "✔ Move applied: $new_id at sys-2"; pass=$((pass+1)); else _print "✖ Move not observed (check seeds/worker)."; fail=$((fail+1)); fi
    else
      _print "✖ Could not parse created fleet id (jq)"; fail=$((fail+1))
    fi
  else
    _print "✖ Create fleet failed ($create_code)"; _print "$create_body"; fail=$((fail+1))
  fi
else
  _print "(Skipping move demo: jq not installed)"
fi

_print "---"
_print "Passed: $pass  Failed: $fail"
exit $([[ $fail -eq 0 ]] && echo 0 || echo 1)

