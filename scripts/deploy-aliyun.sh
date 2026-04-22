#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.aliyun}"
NGINX_CONF="$ROOT_DIR/deploy/nginx/conf.d/default.conf"
SSL_DIR="$ROOT_DIR/deploy/nginx/ssl"
HTTP_TEMPLATE="$ROOT_DIR/deploy/nginx/templates/http-only.conf.tpl"
HTTPS_TEMPLATE="$ROOT_DIR/deploy/nginx/templates/https.conf.tpl"
ACTION="${1:-deploy}"

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "缺少命令: $1"
}

load_env() {
  [[ -f "$ENV_FILE" ]] || die "未找到环境文件: $ENV_FILE"

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a

  APP_DOMAIN="${APP_DOMAIN:-_}"
  ENABLE_HTTPS="${ENABLE_HTTPS:-true}"
  DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
  SSL_CERT_SOURCE="${SSL_CERT_SOURCE:-}"
  SSL_KEY_SOURCE="${SSL_KEY_SOURCE:-}"
}

ensure_docker() {
  require_cmd docker
  docker compose version >/dev/null 2>&1 || die '当前 Docker 不支持 docker compose'
}

prepare_ssl() {
  mkdir -p "$SSL_DIR"

  if [[ "$ENABLE_HTTPS" != "true" ]]; then
    log '当前按 HTTP 模式渲染 Nginx 配置'
    return
  fi

  if [[ -n "$SSL_CERT_SOURCE" ]]; then
    cp "$SSL_CERT_SOURCE" "$SSL_DIR/fullchain.pem"
  fi

  if [[ -n "$SSL_KEY_SOURCE" ]]; then
    cp "$SSL_KEY_SOURCE" "$SSL_DIR/privkey.pem"
  fi

  [[ -f "$SSL_DIR/fullchain.pem" ]] || die "缺少证书文件: $SSL_DIR/fullchain.pem"
  [[ -f "$SSL_DIR/privkey.pem" ]] || die "缺少私钥文件: $SSL_DIR/privkey.pem"
}

render_nginx() {
  local template
  template="$HTTP_TEMPLATE"

  if [[ "$ENABLE_HTTPS" == "true" ]]; then
    template="$HTTPS_TEMPLATE"
  fi

  sed "s/__SERVER_NAME__/${APP_DOMAIN}/g" "$template" > "$NGINX_CONF"
  log "已生成 Nginx 配置: $NGINX_CONF"
}

git_update() {
  require_cmd git
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die '当前目录不是 Git 仓库'

  log "更新代码分支: $DEPLOY_BRANCH"
  git fetch --all --prune
  git checkout "$DEPLOY_BRANCH"
  git pull --ff-only origin "$DEPLOY_BRANCH"
}

docker_up() {
  ensure_docker
  log "使用环境文件启动容器: $ENV_FILE"
  docker compose --env-file "$ENV_FILE" up -d --build
}

docker_restart() {
  ensure_docker
  docker compose --env-file "$ENV_FILE" restart
}

docker_down() {
  ensure_docker
  docker compose --env-file "$ENV_FILE" down
}

docker_status() {
  ensure_docker
  docker compose --env-file "$ENV_FILE" ps
}

docker_logs() {
  ensure_docker
  docker compose --env-file "$ENV_FILE" logs -f --tail=200
}

usage() {
  cat <<'EOF'
用法:
  bash scripts/deploy-aliyun.sh deploy
  bash scripts/deploy-aliyun.sh pull-and-deploy
  bash scripts/deploy-aliyun.sh render-nginx
  bash scripts/deploy-aliyun.sh status
  bash scripts/deploy-aliyun.sh logs
  bash scripts/deploy-aliyun.sh restart
  bash scripts/deploy-aliyun.sh down

可选环境变量:
  ENV_FILE=/path/to/.env.aliyun
EOF
}

main() {
  case "$ACTION" in
    deploy)
      load_env
      prepare_ssl
      render_nginx
      docker_up
      ;;
    pull-and-deploy)
      load_env
      git_update
      prepare_ssl
      render_nginx
      docker_up
      ;;
    render-nginx)
      load_env
      prepare_ssl
      render_nginx
      ;;
    status)
      load_env
      docker_status
      ;;
    logs)
      load_env
      docker_logs
      ;;
    restart)
      load_env
      docker_restart
      ;;
    down)
      load_env
      docker_down
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main
