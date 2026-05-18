#!/usr/bin/env bash

set -euo pipefail

DEPLOY_DIR="/opt/fortune-hub"
TRIGGER_DIR="${DEPLOY_DIR}/deploy-trigger"
TRIGGER_FILE="${TRIGGER_DIR}/trigger.json"
RESULT_FILE="${TRIGGER_DIR}/result.json"
LOG_FILE="${TRIGGER_DIR}/deploy.log"
LOCK_FILE="${TRIGGER_DIR}/.lock"
HEALTH_URL="http://localhost:3001/api/v1/health"
POLL_INTERVAL=2

# ─── helpers ──────────────────────────────────────────────────────

log() {
  local ts
  ts=$(date '+%Y-%m-%d %H:%M:%S')
  printf '[%s] %s\n' "$ts" "$*" | tee -a "$LOG_FILE"
}

log_raw() {
  tee -a "$LOG_FILE"
}

die() {
  log "[error] $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "缺少命令: $1"
}

# 尝试获取文件锁；成功返回 0，失败返回 1
acquire_lock() {
  exec 200>"$LOCK_FILE"
  if flock -n 200; then
    return 0
  fi
  return 1
}

release_lock() {
  flock -u 200 2>/dev/null || true
  exec 200>&- 2>/dev/null || true
}

# 等待服务健康检查通过
wait_for_health() {
  local retries=10
  local delay=5
  local i

  log "等待健康检查: $HEALTH_URL (最多 ${retries} 次，每次 ${delay}s)"

  for ((i = 1; i <= retries; i++)); do
    if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
      log "健康检查通过 (第 ${i} 次)"
      return 0
    fi
    log "健康检查未通过，${delay}s 后重试... (${i}/${retries})"
    sleep "$delay"
  done

  return 1
}

# 生成 result.json
write_result() {
  local status="$1"
  local started_at="$2"
  local triggered_by="$3"
  local commit_hash="$4"
  local log_content
  log_content=$(cat "$LOG_FILE" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g')

  local finished_at
  finished_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  local started_epoch finished_epoch duration
  started_epoch=$(date -d "$started_at" '+%s' 2>/dev/null || date -j -f '%Y-%m-%dT%H:%M:%SZ' "$started_at" '+%s' 2>/dev/null || echo 0)
  finished_epoch=$(date -u '+%s')
  duration=$((finished_epoch - started_epoch))

  cat > "$RESULT_FILE" <<EOF
{
  "status": "${status}",
  "startedAt": "${started_at}",
  "finishedAt": "${finished_at}",
  "duration": ${duration},
  "triggeredBy": "${triggered_by}",
  "commitHash": "${commit_hash}",
  "log": "${log_content}"
}
EOF
}

# ─── deploy flow ──────────────────────────────────────────────────

deploy() {
  local branch triggered_by triggered_at started_at commit_hash
  started_at=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  # 读取 trigger.json
  if ! branch=$(jq -r '.branch // "main"' "$TRIGGER_FILE" 2>/dev/null); then
    branch="main"
  fi
  if ! triggered_by=$(jq -r '.triggeredBy // "unknown"' "$TRIGGER_FILE" 2>/dev/null); then
    triggered_by="unknown"
  fi
  if ! triggered_at=$(jq -r '.triggeredAt // empty' "$TRIGGER_FILE" 2>/dev/null); then
    triggered_at=""
  fi

  log "========================================"
  log "开始部署"
  log "  分支:    $branch"
  log "  触发者:  $triggered_by"
  log "  触发时间: ${triggered_at:-N/A}"
  log "========================================"

  local deploy_status="failed"
  commit_hash=""

  {
    # 1. 进入项目目录
    log "进入目录: $DEPLOY_DIR"
    cd "$DEPLOY_DIR" || die "无法进入 $DEPLOY_DIR"

    # 2. git pull
    log "执行: git pull origin $branch"
    git fetch origin "$branch" || die "git fetch 失败"
    git checkout "$branch" || die "git checkout 失败"
    git pull origin "$branch" || die "git pull 失败"
    commit_hash=$(git rev-parse --short HEAD)
    log "当前 commit: $commit_hash"

    # 3. docker compose build
    log "执行: docker compose build api admin mobile-h5"
    docker compose build api admin mobile-h5 || die "docker compose build 失败"

    # 4. docker compose up -d
    log "执行: docker compose up -d"
    docker compose up -d || die "docker compose up -d 失败"

    # 5. 健康检查
    if wait_for_health; then
      deploy_status="success"
      log "部署成功"
    else
      deploy_status="failed"
      log "健康检查失败，部署标记为失败"
    fi
  } || {
    deploy_status="failed"
    log "部署过程中发生错误"
  }

  # 写入结果
  write_result "$deploy_status" "$started_at" "$triggered_by" "$commit_hash"
  log "结果已写入: $RESULT_FILE"

  # 清理 trigger 文件
  if rm -f "$TRIGGER_FILE"; then
    log "已删除触发文件: $TRIGGER_FILE"
  else
    log "警告: 无法删除触发文件 $TRIGGER_FILE"
  fi

  log "部署流程结束: $deploy_status"
  log ""
}

# ─── main loop ────────────────────────────────────────────────────

main() {
  require_cmd jq
  require_cmd git
  require_cmd docker
  require_cmd curl

  # 确保触发目录存在
  mkdir -p "$TRIGGER_DIR"

  log "========================================"
  log "Fortune Hub Deploy Watcher 已启动"
  log "监听目录: $TRIGGER_DIR"
  log "轮询间隔: ${POLL_INTERVAL}s"
  log "========================================"

  while true; do
    if [[ -f "$TRIGGER_FILE" ]]; then
      if acquire_lock; then
        deploy
        release_lock
      else
        log "检测到触发文件，但部署正在进行中，跳过"
      fi
    fi
    sleep "$POLL_INTERVAL"
  done
}

main "$@"
