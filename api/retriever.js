// 轻量中文检索层：BM25 + 字面重合度，零外部依赖
// 设计目标：9~100 条量级的简历知识库，毫秒级召回，冷启动无 IO

const CJK_RUN = /[\u4e00-\u9fff]+/g;
const LATIN_WORD = /[a-z][a-z0-9+#._-]*/g;

// 高频虚词：不参与打分，避免"什么/怎么/一下"把无关段落顶上来
const STOPWORDS = new Set([
  '的', '了', '吗', '呢', '吧', '啊', '呀', '是', '有', '在', '和', '与', '或',
  '我', '你', '您', '他', '她', '它', '我们', '你们',
  '什么', '怎么', '哪些', '哪个', '如何', '是否', '能否', '可以', '能否',
  '请问', '一下', '一些', '这个', '那个', '这些', '那些',
  '介绍', '说说', '介绍下', '关于', '方面', '相关', '情况', '一般',
  '帮我', '想看', '知道', '了解', '具体'
]);

/**
 * 中文友好分词：
 * - 英文/数字按整词（vue3、spring boot → spring / boot）
 * - 中文按连续汉字段切二元组（"项目经历" → 项目/目经/经历）
 * 二元组检索对短文本知识库的召回率明显优于单字
 */
export function tokenize(text) {
  const raw = String(text || '').toLowerCase();
  const tokens = [];

  for (const m of raw.match(LATIN_WORD) || []) {
    if (m.length > 1 && !STOPWORDS.has(m)) tokens.push(m);
  }

  for (const run of raw.match(CJK_RUN) || []) {
    if (run.length === 1) {
      if (!STOPWORDS.has(run)) tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i++) {
      const bigram = run.slice(i, i + 2);
      if (!STOPWORDS.has(bigram)) tokens.push(bigram);
    }
  }

  return tokens;
}

// 段落切分：按换行切，过短的合并，过长的按句号二次切
function splitParagraphs(content) {
  const pieces = String(content || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';
  for (const piece of pieces) {
    if (buffer && buffer.length + piece.length > 240) {
      chunks.push(buffer);
      buffer = piece;
    } else {
      buffer = buffer ? `${buffer}\n${piece}` : piece;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

/**
 * 建索引：把知识库条目拆成 chunk，并统计词频 / 文档频次
 */
export function buildIndex(entries = []) {
  const chunks = [];
  const df = new Map();
  let totalLen = 0;

  entries.forEach((entry, entryIndex) => {
    const category = String(entry.category || '').trim();
    const anchor = entry.meta?.anchor || '';
    const titleWords = tokenize(category);

    splitParagraphs(entry.content).forEach((text, partIndex) => {
      const bodyTokens = tokenize(text);
      // 类别词也计入词袋，保证「教育经历」「技能」这类短查询能命中
      const tokens = [...bodyTokens, ...titleWords];
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

      // 链接字符占比：用来识别"目录型"段落（作品集就是一串 Figma 链接）
      const urlChars = (text.match(/https?:\/\/\S+/g) || []).reduce((n, u) => n + u.length, 0);

      chunks.push({
        id: `${entryIndex}-${partIndex}`,
        category,
        anchor,
        title: entry.meta?.title || category,
        text,
        tf,
        length: tokens.length,
        linkRatio: text.length ? urlChars / text.length : 0
      });

      for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
      totalLen += tokens.length;
    });
  });

  const N = chunks.length || 1;
  const idf = new Map();
  for (const [term, freq] of df) {
    // 带平滑的 BM25 idf，避免负值
    idf.set(term, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
  }

  return { chunks, idf, df, avgdl: totalLen / N, N };
}

// 访客不会用简历里的书面语提问，这里做一层口语 → 简历用语的映射
const ALIASES = {
  爱好: ['兴趣', '特长'],
  兴趣: ['兴趣'],
  技术栈: ['技能', 'vue', 'java'],
  会什么: ['技能'],
  学历: ['教育', '本科', '学校'],
  学校: ['教育', '大学'],
  哪所: ['教育', '大学'],
  毕业: ['教育', '学校'],
  实习: ['工作', '实习'],
  公司: ['工作'],
  上班: ['工作'],
  作品: ['作品集'],
  案例: ['项目'],
  经历: ['经历'],
  经验: ['经历'],
  联系方式: ['邮箱', '电话'],
  联系: ['邮箱', '电话'],
  邮箱: ['邮箱'],
  证书: ['证书', '软考'],
  证: ['证书'],
  养老: ['养老'],
  饮食: ['饮食', '健康'],
  // 自我介绍类：「你叫什么名字」「你是谁」
  名字: ['姓名'],
  姓名: ['姓名'],
  谁: ['姓名'],
  简历: ['基本信息']
};

function expandQuery(query) {
  const base = String(query || '');
  const extras = [];
  for (const [key, values] of Object.entries(ALIASES)) {
    if (base.includes(key)) extras.push(...values);
  }
  return extras.length ? `${base} ${extras.join(' ')}` : base;
}

/**
 * 检索：BM25 打分 + 「可识别覆盖率」过滤
 *
 * 关键点：覆盖率分母只统计语料里真实出现过的查询词。
 * 否则「你做过哪些项目」里的"你做/做过/哪些"会拉低覆盖率，
 * 把这句本该命中的问题判成无关。
 */
export function search(index, query, k = 4) {
  const queryTokens = tokenize(expandQuery(query));
  const uniqueTerms = [...new Set(queryTokens)];
  if (!uniqueTerms.length) return { queryTerms: 0, hits: [], best: null };

  // 语料里认得出来的查询词
  const recognizable = uniqueTerms.filter((t) => index.df.has(t));
  const unmatchedTerms = uniqueTerms.filter((t) => !index.df.has(t));

  // 一个词都认不出来 → 视为知识库外的问题
  if (!recognizable.length) return { queryTerms: uniqueTerms.length, hits: [], best: null };

  const k1 = 1.5;
  const b = 0.75;
  const scored = [];

  for (const chunk of index.chunks) {
    let score = 0;
    let matched = 0;

    for (const term of uniqueTerms) {
      const freq = chunk.tf.get(term);
      if (!freq) continue;
      matched += 1;
      const termIdf = index.idf.get(term) || 0;
      const denom = freq + k1 * (1 - b + (b * chunk.length) / index.avgdl);
      score += termIdf * ((freq * (k1 + 1)) / denom);
    }

    if (!matched) continue;

    // 认得的部分里覆盖了多少（0~1）
    const matchedRecognizable = uniqueTerms.filter(
      (t) => chunk.tf.has(t) && index.df.has(t)
    ).length;
    const coverage = matchedRecognizable / recognizable.length;

    // 类别命中：问"证书"就优先【证书】段落
    const categoryHit = chunk.category && uniqueTerms.some((t) => chunk.category.includes(t)) ? 1.35 : 1;

    // 纯链接清单（URL 占正文 25% 以上）更像目录，回答描述性问题时降权
    const linkPenalty = chunk.linkRatio >= 0.25 ? 0.7 : 1;

    scored.push({
      ...chunk,
      score: score * (0.5 + 0.5 * coverage) * categoryHit * linkPenalty,
      coverage
    });
  }

  scored.sort((a, b2) => b2.score - a.score);

  const relevant = scored.filter((item) => item.coverage >= 0.5);

  return {
    queryTerms: uniqueTerms.length,
    unmatchedTerms,
    hits: relevant.slice(0, k),
    best: relevant[0] || null
  };
}

export function buildIndexFrom(entries) {
  return buildIndex(entries);
}
