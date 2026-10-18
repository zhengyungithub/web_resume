# 把站点迁到自己的服务器：完整操作手册

> 目标架构：**云服务器（1 台）** → Nginx（静态 + HTTPS） → Node/Express（PM2 守护，端口 3000）
> 域名 `zhengyun.online` 的 DNS 在**阿里云（hichina）**，`www` 目前 CNAME 指向 Vercel，需要改成 A 记录。
> 本文对**腾讯云 / 阿里云**都适用，差异集中写在下面第一节。

---

## 一、先买什么（还没服务器的话）

这个站是「静态页 + 一个 Node 进程」，**2 核 2G 完全够用**，别被销售忽悠买 4C8G。

| 项目 | 腾讯云 | 阿里云 |
|---|---|---|
| 产品 | **轻量应用服务器 Lighthouse**（推荐，便宜且带流量包） | 轻量应用服务器 |
| 配置 | 2 核 2G / 3M 带宽 / 40G 系统盘 / 200G 流量包 | 2 核 2G / 3M / 40G ESSD |
| 系统镜像 | **Ubuntu 22.04 / 24.04 LTS**（选「系统镜像」，别选宝塔/OpenClaw/Hermes 等应用镜像） | 同左 |
| 地域 | 广州 / 上海 / 北京（需备案）；**中国香港**（免备案） | 深圳 / 杭州（需备案）；中国香港（免备案） |
| 放行端口 | 控制台 → **防火墙** → 添加规则 22 / 80 / 443 | 控制台 → **安全组** → 放行 22 / 80 / 443 |

> 计费必须选**包年包月**。按量计费 / 试用机既不能备案，也不适合长期跑。

### ⚠️ 备案：绕不开，但没你想的那么麻烦

**能不能备案，先看两件事**（你的情况都已满足）：

1. **后缀要在工信部批复名单里** —— `.online` 2017 年已获批复，✅ 可以备案。
2. **域名注册商须为境内注册商** —— 你的域名 NS 是 `hichina.com`（阿里云），✅ 符合。

**腾讯云的硬性条件**（官方规则，卡得很死）：

- 必须是**中国境内**节点，香港/境外节点**不能**用于备案
- 必须**包年包月**，购买时长 **≥ 3 个月**，且备案审核期间剩余有效期 ≥ 1 个月
- 必须绑定腾讯云境内公网 IP，**带宽不能为 0**，**不支持 EIP**
- 个人账号：一台服务器最多备案 5 个网站

**流程与周期**：腾讯云控制台 → 备案 → 填主体+网站信息 → 腾讯云初审（1–2 个工作日）→ 提交管局（**7–20 个工作日**）→ 短信核验 → 下发备案号。

**个人备案两个容易被打回的点**：

- 网站名称不能带「公司/企业/招聘/工作室」等字样，也不能填纯域名。建议填 **「郑筠的个人主页」**。
- 个人备案不能做经营性内容（不能挂广告联盟、不能收会员费）。放作品集没问题。

**备案期间网站是打不开的**（80/443 会被拦），所以：

1. 先用 `http://服务器IP:3000` 验证功能（需在防火墙临时放行 3000，验完删掉）；
2. 或者直接买**中国香港**节点，免备案、当天上线，大陆延迟约 40–60ms——**近期要拿去投简历就选这个**。

> 建议：急着用 → 香港节点；长期做个人品牌 → 大陆节点 + 老老实实备案。两者价格差别不大，香港略贵一点。

---

## 二、DNS 怎么切（关键，别切错）


当前状态：

```
zhengyun.online      NS → dns13/dns14.hichina.com   （阿里云 DNS 托管）
www.zhengyun.online  CNAME → xxx.vercel-dns-017.com
```

### 1. 先在阿里云 DNS 加一条测试记录

| 记录类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| A | `test` | 你的服务器公网 IP | 600 |

访问 `http://test.zhengyun.online` 能打开，说明服务器和 Nginx 都通了，再做正式切换。

### 2. 正式切换

| 记录类型 | 主机记录 | 记录值 | 说明 |
|---|---|---|---|
| A | `www` | 服务器 IP | **删掉原来的 CNAME**，同名记录不能共存 |
| A | `@` | 服务器 IP | 裸域也指过来，Nginx 里会 301 跳到 www |
| A | `test` | 删除 | 验证完删掉 |

### 3. 去 Vercel 解除域名绑定

Vercel 控制台 → 项目 → Settings → Domains → 把 `zhengyun.online`、`www.zhengyun.online` 移除。
**不移除的话**，Vercel 可能继续签发/占用证书，两边的验证会打架。

> TTL 建议提前一天改成 600 秒，切换时生效快。切换后旧解析还会缓存一段时间，最多 10 分钟。

---

## 三、服务器上执行（复制粘贴）

### 第 1 步：登录并初始化

```bash
# 腾讯云轻量服务器 Ubuntu 镜像默认用户是 ubuntu（不是 root），先提权
ssh ubuntu@你的服务器公网IP
sudo -i                      # 后面 bootstrap 要求 root 权限

# 直接把代码克隆到脚本最终使用的目录，避免同一份 277MB 代码下载两遍
apt-get update -y && apt-get install -y git
mkdir -p /var/www/zhengyun
git clone --depth 1 https://github.com/zhengyungithub/web_resume.git /var/www/zhengyun/app

bash /var/www/zhengyun/app/deploy/bootstrap.sh
```

> 为什么要先 clone 到 `/var/www/zhengyun/app`：脚本内部的目标目录就是它。若像早期文档那样先克隆到 `/root/zhengyun-src`，
> 脚本第 6 步会再完整克隆一遍，等于把含 91 张原图（277MB）的仓库下载两次。
> 先放到目标目录后，脚本走 `git fetch` 分支，只拉增量。

> 用密钥登录的话：控制台「密钥」绑定实例后 `ssh -i 你的私钥.pem ubuntu@IP`。
> 阿里云轻量默认是 `root`，直接 `ssh root@IP` 即可。

**跑之前先在控制台放行端口**（腾讯云叫「防火墙」，阿里云叫「安全组」）：

| 端口 | 协议 | 用途 |
|---|---|---|
| 22 | TCP | SSH 登录 |
| 80 | TCP | HTTP → HTTPS 跳转、签发证书 |
| 443 | TCP | HTTPS |

> 3000 端口**任何情况下都不要对外放行**。Nginx 通过本机 `127.0.0.1:3000` 访问 Node，外网摸不到。
> 备案期间用 `http://服务器IP/` 走 80 端口验证即可，不需要动 3000。

`bootstrap.sh` 会做完这些事：装 Nginx/Node 20/PM2、内存不足 2G 时自动加 2G swap（防构建 OOM）、建目录、拉代码、`npm ci` + 构建、装 Nginx 站点配置、开 ufw。

#### 如果服务器拉 GitHub 太慢（大陆机房常见）

`node_modules` 已从仓库移除（29088 个文件 / 334MB），但最新代码树里还有 **91 张原图共 277MB**，所以 clone 仍需拉这部分。腾讯云入站带宽通常不受 3M 出站限制，多数情况几分钟能拉完。

如果确实卡住或反复中断，用**办法 B：本地打包，只传产物**（完全不走 git）：

```bash
# 本地项目根目录执行（Windows 用 Git Bash，或用 7-Zip 压成 tar.gz）
npm run build
tar --exclude=node_modules --exclude=.env -czf zhengyun.tar.gz \
    dist api server.js package.json package-lock.json deploy
scp zhengyun.tar.gz ubuntu@你的IP:/tmp/

# 服务器上
mkdir -p /var/www/zhengyun/app
tar -xzf /tmp/zhengyun.tar.gz -C /var/www/zhengyun/app
cd /var/www/zhengyun/app
npm ci --omit=dev            # dist 已经构建好，生产环境不需要 vite
cp .env.example .env && nano .env
pm2 start deploy/ecosystem.config.cjs && pm2 save
```

> 用办法 B 时，`deploy.sh` 里的 `git pull` 那段用不上，以后发版就重复「本地 build → 打包 → 上传 → `pm2 reload`」。



### 第 2 步：写 .env（密钥只放这里，不进 git）

```bash
cd /var/www/zhengyun/app
cp .env.example .env
nano .env
```

填成下面这样（`LLM_API_KEY` 换成你自己的）：

```ini
# 知识库问答的大模型（DeepSeek 示例）
LLM_API_KEY=sk-xxxxxxxxxxxxxxxx
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

# 留言邮件（沿用你现在的 Resend Key，建议重新生成一个）
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_FROM=网站留言 <contact@zhengyun.online>
CONTACT_TO=zhengyun_0629@qq.com

PORT=3000
```

> 没填 `LLM_API_KEY` 站点也能跑：会自动降级成"知识库原文摘录"回答，不会报错。

### 第 3 步：启动后端

```bash
cd /var/www/zhengyun/app
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup          # 按提示复制粘贴它输出的那行命令，实现开机自启

curl -s localhost:3000/api/health
# 期望：{"ok":true,...,"llmConfigured":true,"mailConfigured":true}
# 还没填大模型 Key 时 llmConfigured 会是 false，属正常，站点照常可用
```

### 第 4 步：签 HTTPS 证书并切换配置

**前提**：备案已通过、`www` 的 A 记录已指向本机、`curl -I http://www.zhengyun.online` 能返回 200。

```bash
cd /var/www/zhengyun/app

apt-get install -y certbot

# 只签证书，不改 Nginx 配置（配置由我们自己控制，更可控）
certbot certonly --webroot -w /var/www/certbot \
  -d zhengyun.online -d www.zhengyun.online

# 证书签好后，换成 HTTPS 版配置
cp deploy/nginx-https.conf /etc/nginx/sites-available/zhengyun.online
nginx -t && systemctl reload nginx
```

> 为什么不用 `certbot --nginx`：它会自动改写配置，之后你再用 `cp` 覆盖就会打架。`certonly --webroot` 只负责签发，配置始终是仓库里那份，可复现。

证书 90 天有效，certbot 会自动续期（`systemctl list-timers | grep certbot` 可确认）。续期走的是 80 端口的 `/.well-known/acme-challenge/`，配置里已保留这个通道。

### 第 5 步：验证清单

逐条打勾，任何一条不过就先别去动 Vercel 的旧记录：

```bash
curl -sI https://www.zhengyun.online/ | head -1          # 200
curl -s  https://www.zhengyun.online/api/health          # {"ok":true...}
curl -s  https://www.zhengyun.online/api/chat/health     # indexedChunks: 18, llm.enabled: true
curl -s  https://zhengyun.online/ -o /dev/null -w '%{http_code} → %{redirect_url}\n'  # 301 到 www

# 知识库问答真跑一次
curl -s -X POST https://www.zhengyun.online/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"他做过哪些项目"}' | head -c 400
```

浏览器里再手动确认：首页样式正常、AI 助手能回答、"浏览作品集"能跳转、留言表单能收到邮件。

### 备案还没下来时怎么验证（大陆节点）

域名解析到未备案的大陆服务器会被拦，**所以证书也签不下来**（ACME 要访问 80 端口）。正确顺序是：

```
买服务器 → 域名实名 → 提交备案（等 7–20 天）
   ↓ 备案审核期间
用 http://服务器IP/ 部署调试（Nginx 已在跑 HTTP 版，无需开 3000）
   ↓ 备案通过
切 DNS（第二节）→ 签证书 → 换成 nginx-https.conf → 全站 HTTPS
```

> 备案期间用 IP 访问时，浏览器地址栏是 `http://IP`，页面与 `/api` 同源，CORS 不会拦。AI 助手、留言表单都能正常测。

如果不想等，可以先用 **DNS-01** 方式签证书（走 DNS TXT 记录验证，不需要 80 端口），但要装 `certbot-dns-aliyun` 插件、配阿里云 AccessKey，比 HTTP-01 麻烦。**建议还是先备案完再签**。

---

## 四、日常发版

> ⚠️ **先看这条**：上海/广州等大陆节点实测**无法访问 github.com**（`git clone` 超时，`codeload` 仅 62KB/s）。
> 因此服务器上的 `git pull` 方式（`deploy.sh`）在这类机房不可用。发布改为**本地构建 + 增量上传**。

### 推荐方式：本地一键发布

改完代码后，在**你自己的电脑**上执行：

```bash
cd "D:/项目码源/个人网站（简历版）/web-resume"
python deploy/publish.py
```

它做的事：本地 `vite build` → SFTP 增量上传（只传有变化的文件，图片不变就不传）→ `pm2 reload` 平滑重启 → 线上自检。

首次使用需要 `pip install paramiko`；会提示输入 ubuntu 的 sudo 密码。

> 构建失败会直接中止，**线上继续跑旧版本**，不会出现半新半旧的站点。

### 如果服务器能访问 GitHub（境外节点 / 已配加速）

```bash
bash /var/www/zhengyun/app/deploy/deploy.sh
```

脚本会：拉代码 → `npm ci` → 构建 → `pm2 reload` → 自检三连。同样保证「构建失败不重启」。

### 回滚

`publish.py` 的增量上传会让旧文件被覆盖，回滚靠重新发布：本地 `git checkout` 到上一个可用提交，再跑一次 `publish.py`。

---

## 五、常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 域名和 IP 都打不开，SSH 正常 | 云平台**防火墙/安全组**没放行 80/443 | 腾讯云 → 实例 → 防火墙；阿里云 → 安全组 |
| 域名打不开，IP 能打开 | 未备案被拦 / DNS 没生效 | 先 `ping zhengyun.online` 看解析；未备案只能等或换香港节点 |
| 执行脚本提示 Permission denied | 腾讯云 Ubuntu 镜像默认用户是 `ubuntu` | 先 `sudo -i` 再跑脚本 |
| 502 Bad Gateway | Node 没起来 | `pm2 status`、`pm2 logs zhengyun-api --lines 50` |
| 构建时被 Killed | 内存不足 | 确认 swap 已启用：`free -h` |
| 证书签发失败 | 80 端口不通 / DNS 未生效 / **未备案** | `curl -I http://www.zhengyun.online`，确认能返回 200 再签 |
| `nginx -t` 报 `unknown directive "http2"` | 用了 1.25+ 的 `http2 on;` 语法，但系统 nginx 是 1.18/1.24 | 已改用 `listen 443 ssl http2;`，直接 `git pull` 取最新配置 |
| `nginx -t` 报 `cannot load certificate` | 证书还没签就上了 HTTPS 配置 | 先 `cp deploy/nginx.conf`（HTTP 版）恢复，签完证书再换 |
| AI 回答变成"原文摘录" | `LLM_API_KEY` 没配对，或余额不足 | 看 `pm2 logs` 里的 `[answerer]` 日志 |
| 改了代码但页面没变 | 浏览器缓存 index.html | 已配置 `no-cache`；强刷一次；确认 `dist` 已重建 |
| 网站能开但样式全乱 | Nginx 没加载到配置 / 静态目录不对 | `nginx -t`，确认 `root` 指向 `/var/www/zhengyun/app/dist` |

### 常用运维命令

```bash
pm2 status                          # 进程状态
pm2 logs zhengyun-api --lines 100   # 实时日志
pm2 monit                           # CPU/内存
tail -f /var/log/nginx/access.log   # 访问日志
systemctl restart nginx
```

---

## 六、上线后必须做的安全收尾

1. **轮换所有已经泄露的密钥**（重要，仓库是公开的）：
   - Coze 令牌：直接删掉，改成知识库方案后不再需要；
   - Resend API Key：控制台重新生成；
   - 邮箱 SMTP 授权码：重置。
2. **把 `.env` 从 git 里摘掉**（文件还留在本地，只是不再被跟踪）：
   ```bash
   git rm --cached .env contact-server/.env
   git commit -m "chore: 停止跟踪环境变量文件"
   ```
3. **不要再把 `node_modules` 提交进仓库**：现在仓库 345MB，`git clone` 会非常慢。执行 `git rm -r --cached node_modules contact-server/node_modules` 后提交。
4. 服务器只开 22/80/443；SSH 建议改成密钥登录、禁用密码登录。
