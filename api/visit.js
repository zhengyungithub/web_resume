import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据落盘位置：自建服务器写在应用目录 data/visits.json。
// Vercel 的函数文件系统只读且每次调用都是新实例，写本地没有意义，
// 所以统一转发给自建服务器——真实数据只有一份，两个站点看到同一个数。
const UPSTREAM = (process.env.VISIT_UPSTREAM || (process.env.VERCEL ? 'http://43.142.33.191' : '')).replace(/\/$/, '');

const DATA_DIR = process.env.VISIT_DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'visits.json');
const KEEP_DAYS = 30; // 按天明细只留最近 30 天，总量 pv 永久累计

const load = () => {
  try {
    const j = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (j && typeof j.pv === 'number' && j.days && typeof j.days === 'object') return j;
  } catch { /* 文件不存在或损坏，从零开始 */ }
  return { pv: 0, days: {} };
};

// 先写临时文件再 rename，避免写一半进程被杀导致 JSON 损坏
const save = (db) => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_FILE);
};

const pruneOldDays = (db) => {
  const cutoff = Date.now() - KEEP_DAYS * 86400_000;
  for (const day of Object.keys(db.days)) {
    if (new Date(`${day}T00:00:00Z`).getTime() < cutoff) delete db.days[day];
  }
};

const today = () => new Date().toISOString().slice(0, 10);

// 同一访客一天内只算一个 UV；不存原始 IP，只存哈希
const visitorHash = (req) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim();
  const ua = String(req.headers['user-agent'] || '');
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 16);
};

const stats = (db) => {
  const d = today();
  const day = db.days[d] || { pv: 0, uv: [] };
  return { pv: db.pv, today: day.pv, uvToday: day.uv.length };
};

export function createVisitRouter() {
  const router = express.Router();

  // Vercel：无本地磁盘，转发给自建服务器
  const proxy = async (req, res) => {
    try {
      const r = await fetch(`${UPSTREAM}/api/visit`, {
        method: req.method,
        headers: { 'x-forwarded-for': String(req.headers['x-forwarded-for'] || '') }
      });
      const j = await r.json();
      return res.status(r.status).json(j);
    } catch (e) {
      console.error('[visit] 上游不可达：', e.message);
      // unavailable=true 让前端把数字隐藏，而不是展示误导性的 0
      return res.status(200).json({ pv: 0, unavailable: true });
    }
  };

  router.post('/', async (req, res) => {
    if (UPSTREAM) return proxy(req, res);

    try {
      const db = load();
      const d = today();
      db.pv += 1;
      db.days[d] = db.days[d] || { pv: 0, uv: [] };
      db.days[d].pv += 1;

      const h = visitorHash(req);
      if (!db.days[d].uv.includes(h)) db.days[d].uv.push(h);

      pruneOldDays(db);
      save(db);
      res.json(stats(db));
    } catch (e) {
      console.error('[visit] 记录失败：', e);
      res.status(200).json({ pv: 0, unavailable: true });
    }
  });

  router.get('/', (req, res) => {
    if (UPSTREAM) return proxy(req, res);
    res.json(stats(load()));
  });

  return router;
}
