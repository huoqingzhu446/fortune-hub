#!/usr/bin/env bash

set -euo pipefail

DEPLOY_DIR="/opt/fortune-hub"
SERVICE_NAME="deploy-watcher.service"
SERVICE_SRC="${DEPLOY_DIR}/scripts/${SERVICE_NAME}"
SERVICE_DST="/etc/systemd/system/${SERVICE_NAME}"

log() {
  printf '[install] %s\n' "$*"
}

die() {
  printf '[install][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "缺少命令: $1"
}

main() {
  require_cmd systemctl
  require_cmd docker

  # 检查项目目录是否存在
  [[ -d "$DEPLOY_DIR" ]] || die "项目目录不存在: $DEPLOY_DIR"

  # 检查源 service 文件是否存在
  [[ -f "$SERVICE_SRC" ]] || die "源 service 文件不存在: $SERVICE_SRC"

  # 检查 deploy-helper.sh 是否存在且有执行权限
  local helper_script="${DEPLOY_DIR}/scripts/deploy-helper.sh"
  [[ -f "$helper_script" ]] || die "部署脚本不存在: $helper_script"
  if [[ ! -x "$helper_script" ]]; then
    log "为 deploy-helper.sh 添加执行权限"
    chmod +x "$helper_script"
  fi

  # 创建 deploy-trigger 目录
  log "创建触发目录: ${DEPLOY_DIR}/deploy-trigger"
  mkdir -p "${DEPLOY_DIR}/deploy-trigger"

  # 复制 service 文件到 systemd
  log "复制 service 文件到: $SERVICE_DST"
  cp "$SERVICE_SRC" "$SERVICE_DST"

  # 重新加载 systemd
  log "重新加载 systemd 配置"
  systemctl daemon-reload

  # 启用服务（开机自启）
  log "启用服务: $SERVICE_NAME"
  systemctl enable "$SERVICE_NAME"

  # 启动服务
  log "启动服务: $SERVICE_NAME"
  systemctl start "$SERVICE_NAME"

  # 检查服务状态
  log "检查服务状态..."
  sleep 1
  systemctl status "$SERVICE_NAME" --no-pager || true

  log "========================================"
  log "Deploy Watcher 安装完成"
  log ""
  log "常用命令:"
  log "  查看状态: systemctl status $SERVICE_NAME"
  log "  查看日志: journalctl -u $SERVICE_NAME -f"
  log "  停止服务: systemctl stop $SERVICE_NAME"
  log "  重启服务: systemctl restart $SERVICE_NAME"
  log "========================================"
}

main "$@"
