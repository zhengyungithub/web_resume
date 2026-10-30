// 看板 API：单密码登录 + 签名 cookie 会话
// 密码只存服务端 .env（STATS_PASSWORD），cookie 里只有 HMAC 签名的时间戳，不含任何凭据

import express from 'express';
import crypto from 'node:crypto';
import { collect, summary } from './store.js';

const COOKIE_NAME = 'zy_stats';
const SESSION_MS = 7 * 86400_000;

const secret = () =>
  (process.env.STATS_SECRET || process.env.STATS_PASSWORD || 'dev-only-secret').trim();

const password = () => (process.env.STATS_PASSWORD || '').trim();

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function issueToken() {
  const payload = String(Date.now() + SESSION_MS);
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const idx = token.lastIndexOf('.');
  if (idx < 1) return false;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expect = sign(payload);
  // 定长比较，避免时序侧信道
  if (mac.length !== expect.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > Date.now();
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function requireAuth(req, res, next) {
  if (!password()) {
    return res.status(503).json({ error: '看板未配置访问密码（STATS_PASSWORD）' });
  }
  if (!verifyToken(readCookie(req, COOKIE_NAME))) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  next();
}

export function createStatsRouter() {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const configured = password();
    if (!configured) return res.status(503).json({ error: '看板未配置访问密码' });

    const input = String(req.body?.password || '');
    const a = Buffer.from(input.padEnd(64).slice(0, 64));
    const b = Buffer.from(configured.padEnd(64).slice(0, 64));
    const ok = crypto.timingSafeEqual(a, b) && input.length === configured.length;

    if (!ok) {
      // 简单节流：失败也睡 400ms，压住暴力尝试
      return setTimeout(() => res.status(401).json({ error: '密码不正确' }), 400);
    }

    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${issueToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MS / 1000}`
    );
    return res.json({ ok: true });
  });

  router.post('/logout', (req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  // 前端首屏用它判断是否需要显示登录框
  router.get('/session', (req, res) => {
    res.json({ authenticated: Boolean(password()) && verifyToken(readCookie(req, COOKIE_NAME)) });
  });

  router.get('/summary', requireAuth, (req, res) => {
    try {
      const { from, to } = req.query;
      const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
      res.json(summary({ days, from: String(from || ''), to: String(to || '') }));
    } catch (e) {
      console.error('[stats] 查询失败：', e);
      res.status(500).json({ error: '数据读取失败' });
    }
  });

  // 手动触发一次采集（cron 之外的手动刷新，便于调试图表）
  router.post('/collect', requireAuth, (req, res) => {
    try {
      res.json({ ok: true, ...collect() });
    } catch (e) {
      console.error('[stats] 采集失败：', e);
      res.status(500).json({ error: '采集失败：' + e.message });
    }
  });

  return router;
}
