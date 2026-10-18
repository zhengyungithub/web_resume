# 郑筠 · 个人作品集网站

在线访问：<https://www.zhengyun.online/>

产品与项目作品集，包含项目经历、作品集入口、技能标签，以及一个能就站内内容回答问题的 AI 助手。

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS 4，单页应用
- **后端**：Node.js + Express，提供知识库问答与访客留言接口
- **问答**：本地 BM25 检索（`api/retriever.js`）→ 大模型润色（OpenAI 兼容接口）→ 无 Key 时降级为原文摘录（`api/answerer.js`）
- **邮件**：Resend

## 目录结构

```
knowledge/       # 知识库源文件（Markdown），改内容只改这里
  01-基本信息.md
  02-教育经历.md
  ...
api/
  knowledge-loader.js  # 扫描 knowledge/，解析 front-matter，输出检索条目
  chat.js        # POST /api/chat 问答接口
  kb.js          # ⚠️ 历史快照，仅当 knowledge/ 读不到时兜底
  retriever.js   # 中文分词 + BM25 检索
  answerer.js    # 大模型润色 + 降级摘录
  contact.js     # POST /api/contact 访客留言
server.js        # Express 入口：API + 静态托管 + SPA 兜底
deploy/          # 自建服务器部署脚本与 Nginx / PM2 配置
src/             # 前端源码
```

## 本地开发

```bash
npm install
cp .env.example .env      # 填入 LLM_API_KEY 等配置
npm start                 # 同时启动 Vite(5173) 和 Express(3000)
```

只跑前端：`npm run dev`（`/api` 会代理到 3000）。
只跑后端：`npm run server`。

> 没配 `LLM_API_KEY` 也能正常运行，助手会自动降级为「知识库原文摘录」模式。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat` | `{"question":"..."}` → `{reply, citations, engine}` |
| GET | `/api/chat/health` | 知识库来源、文档清单、索引片段数、大模型是否就绪 |
| POST | `/api/chat/reload` | 重新扫描 `knowledge/` 并重建索引，同时清空回答缓存 |
| POST | `/api/chat/clear-cache` | 只清空回答缓存 |
| GET | `/api/health` | 进程存活、邮件与大模型配置状态 |
| POST | `/api/contact` | 访客留言，转发到邮箱 |

## 更新知识库

问答内容来自 `knowledge/` 目录下的 Markdown 文档，**改简历内容只改这里，不用碰代码**。

一篇文档 = 一条知识条目，开头用 front-matter 声明归类与页面锚点：

```markdown
---
category: 教育经历
anchor: #education
---

学校：湖南理工大学
学历：本科
...
```

- `category`：左侧引用标签的显示名，也参与检索打分
- `anchor`：前端点击引用时跳转的页面锚点（如 `#education`、`#projects`）
- `title`（可选）：不填则用文件名去掉 `01-` 前缀后的部分
- 文件名前缀数字决定顺序；子目录名可作为 `category` 兜底

改完文档后的生效方式：

```bash
pm2 reload zhengyun-api          # 服务器上
curl -X POST localhost:3000/api/chat/reload   # 或让进程不重启就重载
```

> 新增一篇「实习收获」只需在 `knowledge/` 下丢一个 `10-实习收获.md`，重启即生效。
> `api/kb.js` 是迁移前的手写快照，只在 `knowledge/` 读不到时兜底，正常情况不会用到。

## 部署

自建服务器（Nginx + PM2 + Let's Encrypt）的完整步骤见 [deploy/DEPLOY.md](deploy/DEPLOY.md)。

日常发版（本地执行，服务器无法访问 GitHub，故走增量上传）：

```bash
python deploy/publish.py
```
