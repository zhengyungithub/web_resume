#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
本地一键发布到腾讯云服务器（增量上传）

为什么不用 deploy.sh 里的 git pull：
    这台服务器在上海机房，无法访问 github.com（实测 codeload 只有 62KB/s，
    git clone 直接超时）。因此发布改由本地构建、SFTP 增量上传完成。

用法：
    python deploy/publish.py                      # 会提示输入 sudo 密码
    python deploy/publish.py --host 43.142.33.191
    DEPLOY_SUDO_PASS=xxx python deploy/publish.py # 非交互（CI 场景）

依赖：paramiko（pip install paramiko）
首次使用建议确认：本机私钥 ~/.ssh/tencentcloud_ed25519 已写入服务器 ubuntu 用户。
"""
import argparse
import base64
import getpass
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

try:
    import paramiko
except ImportError:
    sys.exit("缺少 paramiko，先执行：pip install paramiko")

ROOT = Path(__file__).resolve().parent.parent
APP = "/var/www/zhengyun/app"
USER = "ubuntu"
DEFAULT_HOST = "43.142.33.191"
DEFAULT_KEY = str(Path.home() / ".ssh" / "tencentcloud_ed25519")

# 需要同步的路径（相对仓库根目录）
INCLUDE_FILES = ["server.js", "package.json", "package-lock.json", ".env.example"]
INCLUDE_DIRS = ["dist", "api", "deploy"]


def log(msg):
    print(f"\033[1;36m==> {msg}\033[0m", flush=True)


def build():
    log("1/5 本地构建")
    vite = ROOT / "node_modules" / "vite" / "bin" / "vite.js"
    if not vite.exists():
        sys.exit("未找到 vite，请先在项目根目录执行 npm install")
    node = os.environ.get("NODE_BIN") or shutil.which("node")
    if not node:
        sys.exit("找不到 node，可设置环境变量 NODE_BIN 指向 node 可执行文件")
    r = subprocess.run([node, str(vite), "build"], cwd=ROOT)
    if r.returncode != 0:
        sys.exit("构建失败，已中止（线上仍是旧版本）")


def collect():
    log("2/5 收集待发布文件")
    files = []
    for name in INCLUDE_FILES:
        p = ROOT / name
        if p.exists():
            files.append(p)
    for d in INCLUDE_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_file() and "__pycache__" not in p.parts:
                files.append(p)
    log(f"    共 {len(files)} 个文件")
    return files


def sync(sftp, files, interactive):
    log("3/5 增量上传（只传有变化的文件）")
    # 预建目录
    dirs = {APP}
    for p in files:
        rel = p.relative_to(ROOT).parent.as_posix()
        d = APP if rel == "." else f"{APP}/{rel}"
        dirs.add(d)
    for d in sorted(dirs, key=len):
        parts = d.split("/")
        for i in range(2, len(parts) + 1):
            sub = "/".join(parts[:i])
            try:
                sftp.stat(sub)
            except IOError:
                try:
                    sftp.mkdir(sub)
                except IOError:
                    pass

    uploaded = skipped = total_bytes = 0
    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        remote = f"{APP}/{rel}"
        st = p.stat()
        try:
            rst = sftp.stat(remote)
            same = (rst.st_size == st.st_size and int(rst.st_mtime) >= int(st.st_mtime) - 2)
        except IOError:
            same = False
        if same:
            skipped += 1
            continue
        sftp.put(str(p), remote)
        uploaded += 1
        total_bytes += st.st_size
        if uploaded % 20 == 0:
            print(f"    已传 {uploaded} 个 / {total_bytes/1024/1024:.1f}MB", flush=True)
    log(f"    上传 {uploaded} 个（{total_bytes/1024/1024:.1f}MB），跳过 {skipped} 个未变化")


def restart(host, key, sudo_pass):
    log("4/5 重载服务")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, 22, USER, key_filename=key, timeout=25, banner_timeout=40)
    b64 = base64.b64encode(sudo_pass.encode()).decode()
    cmd = (f"echo {b64} | base64 -d | sudo -S -p '' bash -c "
           f"'cd {APP} && chmod 600 .env 2>/dev/null; pm2 reload zhengyun-api --update-env'")
    chan = c.get_transport().open_session()
    chan.set_combine_stderr(True)
    chan.exec_command(cmd)
    out = b""
    while True:
        if chan.recv_ready():
            out += chan.recv(65536)
        elif chan.exit_status_ready():
            while chan.recv_ready():
                out += chan.recv(65536)
            break
        else:
            time.sleep(0.05)
    print(out.decode("utf-8", "replace").strip())
    c.close()


def verify(host):
    log("5/5 线上验证")
    import urllib.request
    # 绕开本机 http_proxy（代理不认这台服务器的 IP）
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for path, label in [("/", "首页"), ("/api/health", "后端健康")]:
        try:
            with opener.open(f"http://{host}{path}", timeout=15) as r:
                body = r.read(300).decode("utf-8", "replace").strip()
                print(f"    {label}: HTTP {r.status}  {body[:120]}")
        except Exception as e:
            print(f"    {label}: 失败 {e}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=os.environ.get("DEPLOY_HOST", DEFAULT_HOST))
    ap.add_argument("--key", default=os.environ.get("DEPLOY_KEY", DEFAULT_KEY))
    ap.add_argument("--skip-build", action="store_true")
    args = ap.parse_args()

    sudo_pass = os.environ.get("DEPLOY_SUDO_PASS")
    if not sudo_pass:
        sudo_pass = getpass.getpass(f"{USER}@{args.host} 的 sudo 密码: ")

    if not args.skip_build:
        build()
    files = collect()

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        c.connect(args.host, 22, USER, key_filename=args.key, timeout=25, banner_timeout=40)
    except Exception as e:
        sys.exit(f"SSH 连接失败：{e}")
    c.get_transport().set_keepalive(15)
    sftp = c.open_sftp()
    sync(sftp, files, True)
    sftp.close()
    c.close()

    restart(args.host, args.key, sudo_pass)
    verify(args.host)
    print("\n\033[1;32m发布完成\033[0m")


if __name__ == "__main__":
    main()
