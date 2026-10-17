// 答案生成层：知识库召回 → 大模型润色，失败或无 Key 时降级为「原文摘录」
// 对外承诺：永远返回一段可读中文，绝不把底层报错抛给访客

const DEFAULT_BASE_URL = 'https://api.deepseek.com/v1';
const DEFAULT_MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 20000;

export function getLLMConfig() {
  const apiKey = (process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const baseUrl = (process.env.LLM_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
  const model = (process.env.LLM_MODEL || DEFAULT_MODEL).trim();
  return { apiKey, baseUrl, model, enabled: Boolean(apiKey) };
}

const SYSTEM_PROMPT = `你是郑筠个人作品集网站的站内助手「阿筠」。郑筠是软件工程背景、正在求职产品经理岗位的应届生。

回答规则：
1. 只能依据 <资料> 里的内容回答，资料没写的一律说"简历里没有这部分信息"，绝不编造公司、数字、时间。
2. 用第一人称口吻替郑筠介绍，专业、简洁、不吹嘘；中文回答，控制在 4 句话或 5 个要点以内。
3. 涉及数字（如满意度 88%、排名 3/42）必须与资料一致，不要四舍五入或换算。
4. 问联系方式时给出邮箱；问是否在招/薪资等站外话题，礼貌说明请通过留言或邮箱联系。
5. 不要输出"根据资料显示"这类前缀，直接给答案。`;

function buildMessages(question, hits) {
  const context = hits
    .map((hit, i) => `[资料${i + 1}｜${hit.category}]\n${hit.text}`)
    .join('\n\n');

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `<资料>\n${context}\n</资料>\n\n访客问题：${question}`
    }
  ];
}

// 控制摘录长度，尽量在句末截断
function condense(text, max = 300) {
  const clean = String(text || '').replace(/\s*\n\s*/g, '\n').trim();
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max);
  const lastPunct = Math.max(
    slice.lastIndexOf('。'),
    slice.lastIndexOf('；'),
    slice.lastIndexOf('\n')
  );
  return lastPunct > max * 0.5 ? slice.slice(0, lastPunct + 1) : `${slice}…`;
}

function stripBulletPrefix(line) {
  return line.replace(/^[\s•·\-*\d.、）)]+/, '').trim();
}

/**
 * 无大模型时的降级答案：把最相关的一到两段原文整理后返回
 */
export function extractiveAnswer(hits) {
  if (!hits.length) return '';

  const top = hits[0];
  const lines = condense(top.text, 320)
    .split('\n')
    .map((line) => stripBulletPrefix(line))
    .filter(Boolean);

  const body = lines.map((line) => (line.length > 60 ? `· ${line}` : line)).join('\n');

  if (hits.length > 1 && hits[1].category !== top.category) {
    return `关于「${top.category}」：\n${body}`;
  }
  return `关于「${top.category}」：\n${body}`;
}

export function buildFallbackReply() {
  return [
    '这个问题我在简历里没找到对应内容，不想编一个答案给你。',
    '你可以试着问我：项目经历、教育背景、技能栈、证书、作品集链接，或者直接看看下面这几个板块。'
  ].join('\n');
}

export function buildGreetingReply() {
  return [
    '你好，我是阿筠，郑筠作品集里的站内助手。',
    '可以问我：他的项目经历、产品能力、技术栈、教育背景，或者怎么联系他。'
  ].join('\n');
}

/**
 * 主入口：优先生成大模型答案，任何异常都降级为原文摘录
 * @returns {Promise<{reply:string, engine:'llm'|'extractive', degradedReason?:string}>}
 */
export async function generateAnswer({ question, hits }) {
  const cfg = getLLMConfig();
  const fallback = extractiveAnswer(hits);

  if (!cfg.enabled) {
    return { reply: fallback, engine: 'extractive', degradedReason: 'no-api-key' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: buildMessages(question, hits),
        temperature: 0.3,
        max_tokens: 600,
        stream: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`LLM ${response.status} ${detail.slice(0, 200)}`);
    }

    const data = await response.json();
    const reply = String(data?.choices?.[0]?.message?.content || '').trim();

    if (!reply) throw new Error('LLM 返回空内容');
    return { reply, engine: 'llm' };
  } catch (error) {
    console.error('[answerer] 大模型调用失败，降级为原文摘录：', error.message);
    return { reply: fallback, engine: 'extractive', degradedReason: error.message };
  } finally {
    clearTimeout(timer);
  }
}
