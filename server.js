import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import contactHandler from './api/contact.js';
import { createChatRouter } from './api/chat.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

// 生产环境跑在 Nginx 后面，需要它来还原真实协议和客户端 IP
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ── CORS：同域部署时用不到；拆子域部署时在 ALLOWED_ORIGINS 里补 ──────
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://zhengyun.online',
  'https://www.zhengyun.online'
];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

// 只对 /api 生效，且不抛错：
// 早期版本是全局 app.use(cors(...)) 并在不匹配时 callback(new Error)，结果用 IP 或
// 新域名访问时，浏览器带 Origin 请求静态 JS 也会被中间件判失败 → 500 → 整页白屏。
const apiCors = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // 同源请求 / curl
    const ok =
      allowedOrigins.includes(origin) || /^https:\/\/[\w-]+\.vercel\.app$/.test(origin);
    if (!ok) console.warn('[cors] 未在白名单，跳过跨域头：', origin);
    return callback(null, ok); // 第二个参数为 false 表示不下发 CORS 头，而不是报错
  }
});

app.use(express.json({ limit: '128kb' }));

// 由 Nginx 负责 HTTPS，这里只补一个兜底的安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ── API ────────────────────────────────────────────────────────────
app.use('/api', apiCors);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    node: process.version,
    llmConfigured: Boolean(process.env.LLM_API_KEY || process.env.OPENAI_API_KEY),
    mailConfigured: Boolean(process.env.RESEND_API_KEY)
  });
});

app.post('/api/contact', contactHandler);

const chatRouter = createChatRouter();
app.use('/api', chatRouter);

// 未匹配的 API 一律返回 JSON，别掉进前端 index.html
app.use('/api', (req, res) => {
  res.status(404).json({ error: `接口不存在：${req.method} ${req.originalUrl}` });
});

// ── 静态资源 ────────────────────────────────────────────────────────
if (fs.existsSync(distDir)) {
  // 带 hash 的构建产物可以长缓存
  app.use(
    '/assets',
    express.static(path.join(distDir, 'assets'), {
      immutable: true,
      maxAge: '1y'
    })
  );
  app.use(express.static(distDir, { maxAge: '1h', index: false }));

  // SPA 兜底：非 API 的 GET 全部交给前端路由
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  console.warn('[server] 未找到 dist 目录，仅提供 API。请先执行 npm run build');
}

// 兜底错误处理：任何中间件抛错都不要把堆栈吐给浏览器
app.use((err, req, res, next) => {
  console.error('[server] 未处理错误：', err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: '服务暂时不可用，请稍后再试' });
  }
  return res.status(500).send('服务暂时不可用');
});

app.listen(port, () => {
  console.log(`[server] 已启动：http://127.0.0.1:${port}`);
});
