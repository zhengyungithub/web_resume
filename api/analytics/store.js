// 访问数据存储层：以 nginx 日志为唯一数据源，增量解析后聚合成按天桶
//
// 为什么不是 SQLite：线上 node 20 没有内置 node:sqlite，better-sqlite3 需要原生编译，
// 而个人站每天只有几十次访问 —— JSON 聚合结果几十 KB，全量读进内存完全够用，
// 部署零依赖、坏文件也能一眼看懂。
//
// 隐私：按天桶只存邮箱式聚合（来源/设备/页面），不落 IP；
// 明文 IP 仅存在于 recent 末尾 KEEP_RECENT 条记录中，随滚动自动淘汰。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLine } from './parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.ANALYTICS_DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'analytics.json');

// 主站独立日志（nginx 里为 zhengyun.online / www 单独指定），
// 不配的话退回全局日志，会把同服务器其他项目的流量也算进来
const LOG_CANDIDATES = [
  process.env.ANALYTICS_LOG,
  '/var/log/nginx/zhengyun.access.log',
  '/var/log/nginx/access.log'
].filter(Boolean);

const KEEP_DAYS = 90;
const KEEP_RECENT = 200;

const emptyDb = () => ({
  version: 1,
  totals: { pv: 0, bots: 0, visitors: [] },
  days: {},
  recent: [],
  cursor: {}
});

export function loadDb() {
  try {
    const j = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (j && j.days && j.totals) {
      return { ...emptyDb(), ...j };
    }
  } catch {
    /* 首次运行或文件损坏，从零开始 */
  }
  return emptyDb();
}

function saveDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
}

const dayBucket = () => ({
  pv: 0,
  uv: [],
  sources: {},
  devices: {},
  browsers: {},
  os: {},
  pages: {},
  referers: {}
});

const bump = (obj, key, n = 1) => {
  if (!key) return;
  obj[key] = (obj[key] || 0) + n;
};

// 日志轮转后 inode 会变，必须重新从头读新文件
function pickLog() {
  for (const p of LOG_CANDIDATES) {
    try {
      const st = fs.statSync(p);
      if (st.isFile()) return { path: p, ino: st.ino, size: st.size };
    } catch {
      /* 不存在就试下一个 */
    }
  }
  return null;
}

/**
 * 增量采集：从上次读到的 offset 继续解析到文件末尾
 * @returns {{added:number, bots:number, skipped:number, scanned:number, log:string|null}}
 */
export function collect() {
  const log = pickLog();
  if (!log) return { added: 0, bots: 0, skipped: 0, scanned: 0, log: null };

  const db = loadDb();
  const cur = db.cursor[log.path];

  // 文件被轮转/截断（inode 变化或变短）→ 从头读
  let start = 0;
  if (cur && cur.ino === log.ino && typeof cur.offset === 'number' && cur.offset <= log.size) {
    start = cur.offset;
  }

  const stat = { added: 0, bots: 0, skipped: 0, scanned: 0 };
  if (log.size <= start) {
    db.cursor[log.path] = { ino: log.ino, offset: log.size };
    saveDb(db);
    return { ...stat, log: log.path };
  }

  const fd = fs.openSync(log.path, 'r');
  const length = log.size - start;
  const buf = Buffer.alloc(length);
  try {
    fs.readSync(fd, buf, 0, length, start);
  } finally {
    fs.closeSync(fd);
  }

  // 只处理完整行，最后不完整的半行留到下次（offset 回退到最后一个换行）
  const text = buf.toString('utf8');
  const lastNewline = text.lastIndexOf('\n');
  if (lastNewline < 0) {
    db.cursor[log.path] = { ino: log.ino, offset: start };
    saveDb(db);
    return { ...stat, log: log.path };
  }
  const usable = text.slice(0, lastNewline);
  const consumed = Buffer.byteLength(usable, 'utf8') + 1;

  for (const line of usable.split('\n')) {
    if (!line) continue;
    stat.scanned++;
    const rec = parseLine(line);
    if (!rec) {
      stat.skipped++;
      continue;
    }
    if (rec.bot) {
      stat.bots++;
      db.totals.bots++;
      continue;
    }
    if (rec.skip) {
      stat.skipped++;
      continue;
    }

    const day = (db.days[rec.date] ||= dayBucket());
    day.pv++;
    db.totals.pv++;
    stat.added++;

    if (!day.uv.includes(rec.visitorKey)) day.uv.push(rec.visitorKey);
    if (!db.totals.visitors.includes(rec.visitorKey)) db.totals.visitors.push(rec.visitorKey);

    bump(day.sources, rec.source);
    bump(day.devices, rec.device);
    bump(day.browsers, rec.browser);
    bump(day.os, rec.os);
    bump(day.pages, rec.page);
    if (rec.source === '外部链接' && rec.refererHost) bump(day.referers, rec.refererHost);

    db.recent.push({
      t: `${rec.date} ${rec.time}`,
      ip: rec.ip || '',
      page: rec.page,
      source: rec.source,
      device: rec.device,
      browser: rec.browser,
      os: rec.os
    });
  }

  db.recent = db.recent.slice(-KEEP_RECENT);
  pruneDays(db);
  db.cursor[log.path] = { ino: log.ino, offset: start + consumed };
  saveDb(db);

  return { ...stat, log: log.path };
}

function pruneDays(db) {
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400_000).toISOString().slice(0, 10);
  for (const d of Object.keys(db.days)) {
    if (d < cutoff) delete db.days[d];
  }
}

const todayStr = () => new Date(Date.now() + CST_OFFSET).toISOString().slice(0, 10);

// 统计口径统一为北京时间（日志里的时间是 +0800，parseLine 直接取其日期部分）
const CST_OFFSET = 8 * 3600_000;

function shiftDay(days) {
  return new Date(Date.now() + CST_OFFSET - days * 86400_000).toISOString().slice(0, 10);
}

function nextDay(s) {
  return new Date(new Date(`${s}T00:00:00Z`).getTime() + 86400_000).toISOString().slice(0, 10);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sumMaps(target, src) {
  for (const [k, v] of Object.entries(src || {})) target[k] = (target[k] || 0) + v;
  return target;
}

function topN(map, n = 8) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

/**
 * 看板查询：一次返回概览 + 区间聚合，前端只发一个请求
 * 支持两种范围：days（最近 N 天）或 from+to（自定义日期段，含首尾）
 */
export function summary({ days = 30, from, to } = {}) {
  const db = loadDb();
  const today = todayStr();
  const dates = Object.keys(db.days).sort();

  let start;
  let end;
  let custom = false;
  if (DATE_RE.test(from || '') && DATE_RE.test(to || '')) {
    custom = true;
    start = from <= to ? from : to;
    end = from <= to ? to : from;
    if (end > today) end = today;
    if (start < shiftDay(89)) start = shiftDay(89); // 明细只保留 90 天
    if (start > end) start = end;
  } else {
    start = shiftDay(Math.min(90, Math.max(1, days)) - 1);
    end = today;
  }

  const trend = [];
  for (let d = start; d <= end; d = nextDay(d)) {
    const day = db.days[d];
    trend.push({ date: d, pv: day?.pv || 0, uv: day?.uv?.length || 0 });
  }

  const agg = { sources: {}, devices: {}, browsers: {}, os: {}, pages: {}, referers: {} };
  let rangePv = 0;
  const rangeUvSet = new Set();
  for (const [d, day] of Object.entries(db.days)) {
    if (d < start || d > end) continue;
    rangePv += day.pv || 0;
    for (const h of day.uv || []) rangeUvSet.add(h);
    for (const k of Object.keys(agg)) sumMaps(agg[k], day[k]);
  }

  const todayBucket = db.days[today] || dayBucket();
  const yest = db.days[shiftDay(1)] || dayBucket();

  return {
    generatedAt: new Date().toISOString(),
    range: custom ? `${start}~${end}` : Number(days),
    rangeStart: start,
    rangeEnd: end,
    coverage: { firstDay: dates[0] || null, lastDay: dates[dates.length - 1] || null },
    cards: {
      todayPv: todayBucket.pv,
      todayUv: todayBucket.uv.length,
      yesterdayPv: yest.pv,
      rangePv,
      rangeUv: rangeUvSet.size,
      totalPv: db.totals.pv,
      totalUv: db.totals.visitors.length,
      bots: db.totals.bots
    },
    trend,
    sources: topN(agg.sources, 6),
    devices: topN(agg.devices, 6),
    browsers: topN(agg.browsers, 6),
    os: topN(agg.os, 6),
    pages: topN(agg.pages, 10),
    referers: topN(agg.referers, 8),
    recent: db.recent.slice(-20).reverse()
  };
}
