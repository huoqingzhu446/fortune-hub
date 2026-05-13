#!/usr/bin/env bash

set -euo pipefail

APP_DOMAIN="${APP_DOMAIN:-www.yuanlian.xin}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://${APP_DOMAIN}}"
API_HEALTH_URL="${API_HEALTH_URL:-${PUBLIC_ORIGIN}/api/v1/health}"
FILE_HEALTH_URL="${FILE_HEALTH_URL:-${PUBLIC_ORIGIN}/file-api/api/health}"
MOBILE_URL="${MOBILE_URL:-${PUBLIC_ORIGIN}/}"
ADMIN_URL="${ADMIN_URL:-${PUBLIC_ORIGIN}/admin/}"
CURL_TIMEOUT="${CURL_TIMEOUT:-15}"

log() {
  printf '[health] %s\n' "$*"
}

die() {
  printf '[health][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

probe() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local expected_body="${4:-}"
  local body_file
  local metrics
  local http_code
  local ssl_verify
  local total_time

  body_file="$(mktemp)"
  if ! metrics="$(
    curl -sS -L \
      --max-time "$CURL_TIMEOUT" \
      -o "$body_file" \
      -w '%{http_code} %{ssl_verify_result} %{time_total}' \
      "$url"
  )"; then
    rm -f "$body_file"
    die "${name} probe failed: ${url}"
  fi

  read -r http_code ssl_verify total_time <<<"$metrics"

  if [[ "$http_code" != "$expected_status" ]]; then
    log "${name} body:"
    sed -n '1,20p' "$body_file" >&2 || true
    rm -f "$body_file"
    die "${name} expected HTTP ${expected_status}, got ${http_code}: ${url}"
  fi

  if [[ "$ssl_verify" != "0" ]]; then
    rm -f "$body_file"
    die "${name} TLS verification failed with ssl_verify_result=${ssl_verify}: ${url}"
  fi

  if [[ -n "$expected_body" ]] && ! grep -Fq "$expected_body" "$body_file"; then
    log "${name} body:"
    sed -n '1,20p' "$body_file" >&2 || true
    rm -f "$body_file"
    die "${name} response did not contain expected marker: ${expected_body}"
  fi

  rm -f "$body_file"
  log "${name} ok status=${http_code} ssl_verify=${ssl_verify} time=${total_time}s url=${url}"
}

main() {
  require_cmd curl

  probe 'api' "$API_HEALTH_URL" 200 'fortune-hub-api'
  probe 'file-service' "$FILE_HEALTH_URL" 200 'file-service'
  probe 'mobile-h5' "$MOBILE_URL" 200
  probe 'admin' "$ADMIN_URL" 200

  log 'production HTTPS health checks passed'
}

main "$@"
