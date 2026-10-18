import express from 'express';
import { getKnowledge, reloadKnowledge } from './knowledge-loader.js';
import { buildIndex, search } from './retriever.js';
import {
  generateAnswer,
  buildFallbackReply,
  buildGreetingReply,
  getLLMConfig
} from './answerer.js';

// ── 索引在进程启动时建一次，后续请求直接复用 ───────────────────────────
// 知识库来源：knowledge/ 目录下的 Markdown 文档（改文档 → 重启进程即生效）
let knowledge = getKnowledge();
let knowledgeBase = knowledge.entries;
let index = buildIndex(knowledgeBase);
console.log(`[chat] 知识库索引就绪：${knowledgeBase.length} 条 / ${index.chunks.length} 个片段`);

function rebuildIndex(source = 'startup') {
  knowledge = reloadKnowledge();
  knowledgeBase = knowledge.entries;
  index = buildIndex(knowledgeBase);
  console.log(
    `[chat] 索引已重建（${source}）：${knowledgeBase.length} 条 / ${index.chunks.length} 个片段`
  );
  return knowledge;
}

const GREETING_PATTERN = /^(你好|您好|hi|hello|嗨|在吗|哈喽|hey)[\s!！。,.，?？]*$/i;

const MAX_QUESTION_LENGTH = 300;

// ── 极简 TTL 缓存：同一问题 6 小时内不重复调用大模型 ───────────────────
class ResponseCache {
  constructor(ttl = 6 * 60 * 60 * 1000, maxSize = 200) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  key(question) {
    return question.trim().toLowerCase();
  }

  get(question) {
    const key = this.key(question);
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(question, value) {
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(this.key(question), { value, expiry: Date.now() + this.ttl });
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

const cache = new ResponseCache();

// 命中的片段 → 前端可直接点击跳转的引用标签
function toCitations(hits) {
  const seen = new Set();
  const citations = [];
  for (const hit of hits) {
    if (!hit.anchor || seen.has(hit.anchor)) continue;
    seen.add(hit.anchor);
    citations.push({ title: hit.category, href: hit.anchor });
  }
  return citations;
}

export const createChatRouter = () => {
  const router = express.Router();

  router.post('/chat', async (req, res) => {
    const startedAt = Date.now();
    const rawQuestion = req.body?.question;
    const question = typeof rawQuestion === 'string' ? rawQuestion.trim() : '';

    if (!question) {
      return res.status(400).json({ error: '缺少问题内容' });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(413).json({ error: '问题太长了，请精简到 300 字以内' });
    }

    // 打招呼不走检索，直接回引导语
    if (GREETING_PATTERN.test(question)) {
      return res.json({
        reply: buildGreetingReply(),
        citations: [],
        sources: [],
        engine: 'local'
      });
    }

    const cached = cache.get(question);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    try {
      const { hits } = search(index, question, 4);

      const result = hits.length
        ? await generateAnswer({ question, hits })
        : { reply: buildFallbackReply(), engine: 'local' };

      const payload = {
        reply: result.reply,
        citations: toCitations(hits),
        sources: hits.map((hit) => ({
          category: hit.category,
          anchor: hit.anchor,
          score: Number(hit.score.toFixed(3)),
          coverage: Number(hit.coverage.toFixed(2))
        })),
        engine: result.engine
      };

      // 降级结果也缓存，避免每次请求都去撞一次大模型
      cache.set(question, payload);

      console.log(
        `[chat] "${question}" → ${result.engine}${result.degradedReason ? `(${result.degradedReason})` : ''} ` +
          `${hits.length} 条命中，${Date.now() - startedAt}ms`
      );

      res.json(payload);
    } catch (error) {
      // 这一层理论上不可达；真到了也必须给访客一句人话
      console.error('[chat] 未预期的错误：', error);
      res.status(500).json({
        reply: '助手暂时有点忙，你可以先看看页面里的项目经历和技能部分，或直接通过邮箱联系郑筠。',
        citations: [],
        sources: [],
        engine: 'error'
      });
    }
  });

  // 健康检查：部署后用它确认知识库和模型配置是否正确
  router.get('/chat/health', (req, res) => {
    const cfg = getLLMConfig();
    res.json({
      ok: true,
      knowledgeBaseEntries: knowledgeBase.length,
      indexedChunks: index.chunks.length,
      knowledge: {
        source: knowledge.source,
        dir: knowledge.dir,
        files: knowledge.files,
        warnings: knowledge.warnings
      },
      llm: {
        enabled: cfg.enabled,
        model: cfg.enabled ? cfg.model : null,
        baseUrl: cfg.enabled ? cfg.baseUrl : null
      },
      cacheSize: cache.size
    });
  });

  router.post('/chat/clear-cache', (req, res) => {
    cache.clear();
    res.json({ success: true, message: '缓存已清空' });
  });

  // 改完文档不重启也能生效：POST /api/chat/reload
  router.post('/chat/reload', (req, res) => {
    const next = rebuildIndex('manual');
    cache.clear();
    res.json({
      success: true,
      message: '知识库已重新加载，缓存已清空',
      knowledgeBaseEntries: next.entries.length,
      indexedChunks: index.chunks.length,
      files: next.files,
      warnings: next.warnings
    });
  });

  return router;
};
