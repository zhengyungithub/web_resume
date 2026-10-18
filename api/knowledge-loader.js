// 知识库加载器：把 knowledge/ 目录下的 Markdown / 纯文本文件读成检索层能吃的条目
//
// 设计要点：
// 1. 同步读取（启动时一次性建索引，不需要异步链路）
// 2. 目录扫描递归，支持子目录；子目录名可作 category 兜底
// 3. front-matter 只认 category / anchor / title 三个字段，其余忽略
// 4. 一个文件 = 一条知识库条目，文件名前缀数字决定顺序（01-xxx.md）
// 5. 目录不存在或扫不到任何文件时，退回 api/kb.js 的历史快照，保证接口不挂

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { knowledgeBase as legacyKnowledgeBase } from './kb.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = path.resolve(HERE, '..', 'knowledge');

const SUPPORTED_EXT = new Set(['.md', '.markdown', '.txt']);

// ── 文本清理：让进索引的内容尽量干净 ─────────────────────────────────
function normalizeBody(body) {
  return body
    // 去掉标题井号，保留文字（标题文字本身有检索价值）
    .replace(/^[ \t]{0,3}#{1,6}[ \t]*/gm, '')
    // 去掉加粗/斜体标记，保留内容
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
    // 去掉行内代码的反引号
    .replace(/`([^`\n]+)`/g, '$1')
    // 去掉分隔线
    .replace(/^[ \t]{0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/gm, '')
    // 压缩空行
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── front-matter 解析：只处理 key: value 的扁平结构 ───────────────────
function parseFrontMatter(text) {
  const meta = {};
  let body = text;

  const match = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { meta, body };

  body = text.slice(match[0].length);

  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sep = line.indexOf(':');
    if (sep <= 0) continue;

    const key = line.slice(0, sep).trim().toLowerCase();
    let value = line.slice(sep + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }

    if (key) meta[key] = value;
  }

  return { meta, body };
}

// "01-基本信息.md" → { order: 1, name: "基本信息" }
function describeFile(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const match = base.match(/^(\d+)[-_.\s]+(.+)$/);
  if (match) return { order: Number(match[1]), name: match[2].trim() };
  return { order: Number.MAX_SAFE_INTEGER, name: base.trim() };
}

// 递归收集文件，返回 { filePath, relPath, segments } 列表
function walk(dir, rootDir = dir, depth = 0, acc = []) {
  if (depth > 4) return acc;

  let items = [];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      walk(full, rootDir, depth + 1, acc);
      continue;
    }
    if (!item.isFile()) continue;
    if (!SUPPORTED_EXT.has(path.extname(item.name).toLowerCase())) continue;
    if (item.name.startsWith('.')) continue;

    const relPath = path.relative(rootDir, full).split(path.sep).join('/');
    const segments = path.relative(rootDir, dir).split(path.sep).filter(Boolean);
    acc.push({ filePath: full, relPath, segments });
  }

  return acc;
}

function readEntry({ filePath, relPath, segments }, warnings) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    warnings.push(`${relPath}: 读取失败（${error.code || error.message}）`);
    return null;
  }

  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const { meta, body } = parseFrontMatter(text);
  const content = normalizeBody(body);

  if (!content) {
    warnings.push(`${relPath}: 正文为空，已跳过`);
    return null;
  }

  const { order, name } = describeFile(path.basename(filePath));
  const folder = segments.length ? segments[segments.length - 1] : '';
  const category = meta.category || folder || name;

  let anchor = meta.anchor || '';
  if (anchor && !anchor.startsWith('#')) anchor = `#${anchor}`;

  return {
    order,
    relPath,
    entry: {
      category,
      content,
      meta: {
        anchor,
        title: meta.title || name,
        source: relPath
      }
    }
  };
}

/**
 * 同步加载知识库。
 * @param {object} options
 * @param {string} [options.dir]      知识库目录，默认项目根的 knowledge/
 * @param {boolean} [options.verbose] 是否打印加载明细，默认 true
 * @returns {{ entries: Array, source: string, files: string[], warnings: string[], dir: string }}
 */
export function loadKnowledge(options = {}) {
  const dir = options.dir || DEFAULT_DIR;
  const verbose = options.verbose !== false;
  const warnings = [];

  const files = walk(dir);

  if (!files.length) {
    warnings.push(`目录 ${dir} 下没有找到 .md / .txt 文件`);
    if (verbose) {
      console.warn(`[knowledge] ⚠️  ${warnings[warnings.length - 1]}`);
      console.warn(`[knowledge] ⚠️  已回退到 api/kb.js 历史快照（${legacyKnowledgeBase.length} 条）`);
    }
    return {
      entries: legacyKnowledgeBase,
      source: 'legacy:api/kb.js',
      files: [],
      warnings,
      dir
    };
  }

  const collected = [];
  for (const file of files) {
    const parsed = readEntry(file, warnings);
    if (parsed) collected.push(parsed);
  }

  // 先按文件名前缀数字，再按路径字典序，保证与页面章节顺序一致
  collected.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.relPath.localeCompare(b.relPath, 'zh-Hans-CN');
  });

  // 同一个锚点被多个文档引用是正常设计（多个项目都指向 #projects），
  // 只有「不同板块抢同一个锚点」才是配置错误
  const anchorOwner = new Map();
  for (const { entry, relPath } of collected) {
    const anchor = entry.meta.anchor;
    if (!anchor) continue;
    const owner = anchorOwner.get(anchor);
    if (!owner) {
      anchorOwner.set(anchor, { category: entry.category, file: relPath });
      continue;
    }
    if (owner.category !== entry.category) {
      warnings.push(
        `${relPath}: 锚点 ${anchor} 已被「${owner.category}」(${owner.file}) 占用，引用标签会串到同一处`
      );
    }
  }

  if (verbose) {
    console.log(`[knowledge] 从 ${dir} 加载 ${collected.length} 篇文档`);
    for (const { entry, relPath } of collected) {
      console.log(
        `[knowledge]   · ${relPath} → ${entry.category}` +
          `${entry.meta.anchor ? ` (${entry.meta.anchor})` : ''} ${entry.content.length} 字`
      );
    }
    for (const warning of warnings) {
      console.warn(`[knowledge] ⚠️  ${warning}`);
    }
  }

  return {
    entries: collected.map((item) => item.entry),
    source: `docs:${dir}`,
    files: collected.map((item) => item.relPath),
    warnings,
    dir
  };
}

// 进程内缓存，避免多次调用重复读盘
let cached = null;

export function getKnowledge(options = {}) {
  if (!cached || options.force) {
    cached = loadKnowledge(options);
  }
  return cached;
}

export function getKnowledgeBase(options = {}) {
  return getKnowledge(options).entries;
}

export function reloadKnowledge(options = {}) {
  cached = null;
  return getKnowledge({ ...options, force: true });
}

export { DEFAULT_DIR };
