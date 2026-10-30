// nginx 日志解析层：把一行 access.log 拆成可统计的字段
// 隐私口径（方案 B）：IP 只随「最近 200 条实时记录」短期保留，按天聚合桶不落 IP；
// 看板默认掩码展示，需手动展开。UV 去重仍用不可逆哈希，不依赖明文 IP。

import crypto from 'node:crypto';

// combined 格式：
// 1.2.3.4 - - [30/Oct/2026:20:01:54 +0800] "GET /path HTTP/1.1" 200 1234 "https://ref" "Mozilla/5.0 ..."
const LINE_RE = /^(\S+) \S+ (?:\S+ )?\[([^\]]+)\] "([^"]*)" (\d{3}) (\S+) "([^"]*)" "([^"]*)"/;

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// 只统计这些"有意义"的路径；静态资源和杂项一律丢弃
const STATIC_EXT = /\.(js|css|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|mp4|webm|map|txt|xml|json)$/i;

// ── 路径白名单 ────────────────────────────────────────────────────
// 关键：本站是 SPA，任何不存在的路径都会被兜底成 index.html 并返回 200，
// 于是扫描器请求 /wp-admin/install.php、/.env 也会"成功"。只靠状态码过滤会把
// 上千次扫描算成访问量。这里以「站点真实存在的路径」为准，白名单之外的 200 一律
// 视为扫描，单独计入 bots。
const KNOWN_PATH = [
  /^\/$/,                                        // 首页
  /^\/index\.html$/,
  /^\/stats\.html$/,                             // 看板入口
  /^\/assets\//,                                 // 构建产物（不计 PV，见下）
  /^\/api\/(health|chat|contact|visit|stats)(\/|$)/,
  /^\/视频号二维码\.jpg$/,
  /^\/郑筠\.pdf$/,
  /^\/favicon\.svg$/,
  /^\/(头像轮播图|横屏照片集|竖屏照片集|证书照片)\//,
  /^\/[^/]+\.(jpe?g|png|webp|pdf)$/              // 根目录下的证书/照片文件
];

// 站点真实页面的路径前缀，用于把接口/资源归类
const PAGE_ALIASES = [
  [/^\/$/, '首页'],
  [/^\/index\.html$/, '首页'],
  [/^\/api\/chat/, 'AI 问答'],
  [/^\/api\/contact/, '留言'],
  [/^\/api\/visit/, '访问计数'],
  [/^\/api\/stats/, '数据看板'],
  [/^\/api\/health/, '健康检查'],
  [/^\/api\//, '其他接口'],
  [/^\/视频号二维码/, '视频号二维码'],
  [/^\/郑筠\.pdf$/, '简历 PDF'],
  [/^\/assets\//, '静态资源（构建产物）']
];

function isKnownPath(path) {
  return KNOWN_PATH.some((re) => re.test(path));
}

const BOT_UA = /bot\b|bot\/|spider|crawler|crawl|slurp|scrapy|curl\/|wget\/|python-requests|python-urllib|go-http-client|java\/|okhttp|libwww|httpclient|axios\/|node-fetch|undici|headless|phantomjs|selenium|puppeteer|playwright|facebookexternalhit|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|yandex|bingpreview|applebot|monitoring|uptime|nagios|zabbix|check_http|masscan|nmap|nikto|sqlmap|zgrab|nuclei/i;

const SELF_HOSTS = ['zhengyun.online', 'www.zhengyun.online', 'stats.zhengyun.online', '43.142.33.191'];

export function isBotUserAgent(ua) {
  if (!ua || ua === '-') return true; // 空 UA 基本都是脚本
  return BOT_UA.test(ua);
}

/**
 * 解析单行；返回 null 表示这行不该被统计
 */
export function parseLine(line) {
  const m = LINE_RE.exec(line);
  if (!m) return null;

  const [, ip, timeRaw, request, statusRaw, , referer, ua] = m;
  const status = Number(statusRaw);
  const [method, rawPath] = request.split(' ');

  // 非标准方法（扫描器握手包、CONNECT 探测等）直接丢
  if (!method || !['GET', 'POST', 'HEAD'].includes(method)) return { bot: true };
  // 错误响应一律算扫描/探测，不进 PV
  if (status >= 400) return { bot: true };
  // 绝对 URI 形式的请求是代理探测
  if (!rawPath || !rawPath.startsWith('/')) return { bot: true };

  const bot = isBotUserAgent(ua);

  // [30/Oct/2026:20:01:54 +0800] —— 只取日期部分，按访问者本地时区归日
  const dm = /^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/.exec(timeRaw);
  if (!dm) return null;
  const [, dd, mon, yyyy, hh, mi] = dm;
  const month = MONTHS[mon];
  if (month === undefined) return null;
  const date = `${yyyy}-${String(month + 1).padStart(2, '0')}-${dd}`;

  const path = rawPath.split('?')[0];

  // UA 明显的爬虫/脚本直接丢
  if (bot) return { bot: true, date };

  // 白名单之外的路径 = 扫描器探测（SPA 兜底会让它们返回 200，不能只看状态码）
  if (!isKnownPath(path)) return { bot: true, date };

  // 构建产物与图片资源：浏览器加载时会产生，不代表一次"来访"，不计 PV
  // （视频号二维码是访客主动点开的内容，单独按页面计）
  const isAsset =
    /^\/assets\//.test(path) ||
    /^\/(头像轮播图|横屏照片集|竖屏照片集|证书照片)\//.test(path) ||
    (/\.(jpe?g|png|webp|svg|gif|avif)$/i.test(path) && !/视频号二维码/.test(path));
  if (isAsset) return { skip: true, date };

  const pageLabel = (PAGE_ALIASES.find(([re]) => re.test(path)) || [, path])[1];

  return {
    date,
    time: `${hh}:${mi}`,
    ip,
    page: pageLabel,
    source: classifySource(referer),
    refererHost: safeHost(referer),
    device: classifyDevice(ua),
    browser: classifyBrowser(ua),
    os: classifyOS(ua),
    // UV 只在这里用一次，落盘的是哈希，不保留原 IP
    visitorKey: visitorKey(ip, ua)
  };
}

function safeHost(referer) {
  if (!referer || referer === '-') return '';
  try {
    return new URL(referer).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function classifySource(referer) {
  const host = safeHost(referer);
  if (!host) return '直接访问';
  if (SELF_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return '站内跳转';
  if (/(^|\.)(baidu\.com|bing\.com|google\.[a-z.]+|sogou\.com|so\.com|sm\.cn|yandex\.[a-z]+|duckduckgo\.com)$/.test(host)) {
    return '搜索引擎';
  }
  if (/(weixin|wechat|qq\.com|qzone|weibo|douyin|toutiao|zhihu|xiaohongshu|linkedin|facebook|twitter|t\.co|x\.com)/.test(host)) {
    return '微信 / 社交';
  }
  return '外部链接';
}

export function classifyDevice(ua = '') {
  if (!ua || ua === '-') return '未知';
  if (/micromessenger/i.test(ua)) return '手机 · 微信';
  if (/ipad|tablet|kindle|silk/i.test(ua)) return '平板';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return '手机';
  return '桌面';
}

export function classifyBrowser(ua = '') {
  if (!ua || ua === '-') return '未知';
  if (/micromessenger/i.test(ua)) return '微信';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/qqbrowser|mqqbrowser/i.test(ua)) return 'QQ 浏览器';
  if (/ucbrowser/i.test(ua)) return 'UC';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return '其他';
}

export function classifyOS(ua = '') {
  if (!ua || ua === '-') return '未知';
  if (/windows/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return '其他';
}

// 一天内同一 IP + UA 视为同一访客；只输出不可逆哈希
export function visitorKey(ip, ua) {
  return crypto.createHash('sha256').update(`${ip}|${ua || ''}`).digest('hex').slice(0, 16);
}
