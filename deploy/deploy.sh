#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 日常发版：拉最新代码 → 装依赖 → 构建 → 平滑重启 → 自检
# 用法：sudo bash deploy/deploy.sh
# 特性：构建失败时不会重启服务，线上保持旧版本可用
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/zhengyun/app}"
BRANCH="${BRANCH:-main}"

log() { echo -e "\n\033[1;36m==> $*\033[0m"; }

cd "$APP_DIR"

log "记录当前版本（回滚用）"
git rev-parse --short HEAD | tee /tmp/zhengyun_prev_rev

log "1/5 拉取 origin/$BRANCH"
git fetch --depth 1 origin "$BRANCH"
git reset --hard "origin/$BRANCH"

log "2/5 安装依赖"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

log "3/5 构建前端"
npm run build

log "4/5 重启后端进程"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

log "5/5 自检"
sleep 2
API_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/health || true)
CHAT_JSON=$(curl -s http://127.0.0.1:3000/api/chat/health || true)
SITE_CODE=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: www.zhengyun.online' http://127.0.0.1/ || true)

echo "  /api/health        → $API_CODE"
echo "  /api/chat/health   → $CHAT_JSON"
echo "  站点首页           → $SITE_CODE"

if [[ "$API_CODE" != "200" ]]; then
  echo -e "\n\033[1;31m后端健康检查未通过，查看日志：pm2 logs zhengyun-api --lines 50\033[0m" >&2
  exit 1
fi

echo -e "\n\033[1;32m发版完成\033[0m"
echo "回滚命令：cd $APP_DIR && git reset --hard \$(cat /tmp/zhengyun_prev_rev) && npm ci && npm run build && pm2 reload zhengyun-api"
