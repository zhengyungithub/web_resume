#!/usr/bin/env node
// cron 入口：增量解析 nginx 日志，把结果写进 data/analytics.json
// 安装（ubuntu）：
//   */10 * * * * cd /var/www/zhengyun/app && /usr/bin/node deploy/analytics/collect.mjs >> /var/www/zhengyun/app/data/collect.log 2>&1

import { collect } from '../../api/analytics/store.js';

const started = Date.now();
try {
  const r = collect();
  const ms = Date.now() - started;
  if (!r.log) {
    console.log(`[${new Date().toISOString()}] 未找到 nginx 日志，跳过`);
  } else {
    console.log(
      `[${new Date().toISOString()}] ${r.log} 扫描 ${r.scanned} 行 → 新增 ${r.added} PV / ${r.bots} 机器人 / ${r.skipped} 跳过（${ms}ms）`
    );
  }
} catch (e) {
  console.error(`[${new Date().toISOString()}] 采集失败：`, e);
  process.exitCode = 1;
}
