// 一次性回填：历史天桶没有 geo 聚合（该字段是新功能上线后才开始积累）。
// 做法：读 nginx 日志全文，按 parseLine 同样口径把每个有效访问的省份
// 重新聚合进对应天桶。每个天桶的 geo 先清空再重建 —— 幂等、可重复执行。
// 不动 pv / uv / totals / recent / cursor。

import fs from 'node:fs';
import { parseLine } from '../../api/analytics/parser.js';
import { initGeo, provinceOf } from '../../api/analytics/geo.js';

const DATA_FILE = '/var/www/zhengyun/app/data/analytics.json';
const LOG = '/var/log/nginx/zhengyun.access.log';

initGeo();

const db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// 先清空所有天桶的 geo，避免与新聚合叠加重复计数
for (const day of Object.values(db.days)) day.geo = {};

let added = 0;
for (const line of fs.readFileSync(LOG, 'utf8').split('\n')) {
  if (!line) continue;
  const rec = parseLine(line);
  if (!rec || rec.bot || rec.skip || !rec.date) continue;
  const day = db.days[rec.date];
  if (!day) continue; // 天桶之外的历史不算（口径与 PV 一致）
  const prov = provinceOf(rec.ip);
  day.geo[prov] = (day.geo[prov] || 0) + 1;
  added++;
}

fs.writeFileSync(DATA_FILE, JSON.stringify(db));

const sample = Object.entries(db.days).map(([d, day]) => `${d}: ${JSON.stringify(day.geo)}`);
console.log(`回填完成：聚合 ${added} 条访问的省份`);
console.log(sample.join('\n'));
