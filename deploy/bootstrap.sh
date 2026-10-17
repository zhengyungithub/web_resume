#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 服务器首次初始化（在全新 Ubuntu 22.04 / 24.04 上执行一次）
# 用法：sudo bash bootstrap.sh
# 说明：只装环境、建目录、装 Nginx 配置，不涉及你的密钥
# 兼容：腾讯云轻量/CVM、阿里云轻量/ECS，以及任意 Ubuntu 云主机
#      腾讯云 Ubuntu 镜像默认用户是 ubuntu，请先 `sudo -i` 再执行
# 前置：云控制台的防火墙/安全组已放行 22 / 80 / 443
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/zhengyungithub/web_resume.git}"
APP_DIR=/var/www/zhengyun/app
LOG_DIR=/var/log/zhengyun
DOMAIN=zhengyun.online

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }

if [[ $EUID -ne 0 ]]; then
  echo "请用 root 执行：sudo bash bootstrap.sh" >&2
  exit 1
fi

log "1/8 更新系统软件包"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx ufw ca-certificates gnupg rsync

log "2/8 内存不足 2G 时加 2G swap（Vite 构建容易 OOM）"
if [[ ! -f /swapfile ]]; then
  MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
  if [[ "$MEM_MB" -lt 2048 ]]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "已启用 2G swap（原内存 ${MEM_MB}MB）"
  else
    echo "内存 ${MEM_MB}MB，无需 swap"
  fi
else
  echo "swap 已存在，跳过"
fi

log "3/8 安装 Node.js 20 LTS"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2-3)" -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

log "4/8 安装 PM2 并设置开机自启"
npm install -g pm2
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

log "5/8 创建目录"
mkdir -p "$APP_DIR" "$LOG_DIR" /var/www/certbot

log "6/8 拉取代码（浅克隆，避开历史里的大文件）"
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR" && git fetch --depth 1 origin main && git reset --hard origin/main
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi

log "7/8 安装依赖并构建"
cd "$APP_DIR"
npm ci
npm run build

log "8/8 安装 Nginx 站点配置（先装 HTTP 版，签完证书再换 HTTPS）"
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/zhengyun.online
ln -sf /etc/nginx/sites-available/zhengyun.online /etc/nginx/sites-enabled/zhengyun.online
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo "Nginx 已启动，当前为 HTTP 模式：http://<你的IP>/"

log "防火墙放行 22 / 80 / 443"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

cat <<'EOF'

──────────────────────────────────────────────────────────────
环境就绪。接下来需要你手动完成三步：

1) 放配置（.env 不放进 git，必须单独创建）
   cd /var/www/zhengyun/app
   cp .env.example .env && nano .env

2) 启动后端
   pm2 start deploy/ecosystem.config.cjs
   pm2 save
   curl -s localhost:3000/api/health

   此时可直接用 http://<你的IP>/ 访问站点（不用开 3000 端口）

3) 备案通过、DNS 已指向本机后，签证书并切换到 HTTPS
   apt-get install -y certbot
   certbot certonly --webroot -w /var/www/certbot \\
     -d zhengyun.online -d www.zhengyun.online

   cp deploy/nginx-https.conf /etc/nginx/sites-available/zhengyun.online
   nginx -t && systemctl reload nginx

   验证：curl -sI https://www.zhengyun.online/ | head -1
──────────────────────────────────────────────────────────────
EOF
