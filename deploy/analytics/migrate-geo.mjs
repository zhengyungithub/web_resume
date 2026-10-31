#!/usr/bin/env node
// 一次性迁移：重建 recent 记录（带省份），不改动 PV/UV 聚合计数
// 用法：node deploy/analytics/migrate-geo.mjs

import fs from 'node:fs';
import { parseLine } from '../../api/analytics/parser.js';
import { initGeo, provinceOf } from '../../api/analytics/geo.js';

const LOG = process.env.ANALYTICS_LOG || '/var/log/nginx/zhengyun.access.log';
const DB = process.env.ANALYTICS_DATA_FILE || '/var/www/zhengyun/app/data/analytics.json';

initGeo();
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
db.recent = [];

for (const line of fs.readFileSync(LOG, 'utf8').split('\n')) {
  if (!line) continue;
  const rec = parseLine(line);
  if (!rec || rec.bot || rec.skip || !rec.date) continue;
  db.recent.push({
    t: `${rec.date} ${rec.time}`,
    ip: rec.ip || '',
    province: provinceOf(rec.ip),
    page: rec.page,
    source: rec.source,
    device: rec.device,
    browser: rec.browser,
    os: rec.os
  });
}

db.recent = db.recent.slice(-500);
fs.writeFileSync(DB, JSON.stringify(db));
console.log(`迁移完成：recent ${db.recent.length} 条（含省份）`);
console.log('省份样例:', db.recent.slice(-5).map((r) => `${r.ip}→${r.province}`).join(' | '));
