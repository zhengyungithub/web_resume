# 郑筠 · 个人作品集网站

在线访问：<https://www.zhengyun.online/>

产品经理方向求职作品集，包含项目经历、作品集入口、技能标签与站内知识库问答助手。

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS 4，单页应用
- **后端**：Node.js + Express，提供知识库问答与访客留言接口
- **问答**：本地 BM25 检索（`api/retriever.js`）→ 大模型润色（OpenAI 兼容接口）→ 无 Key 时降级为原文摘录（`api/answerer.js`）
- **邮件**：Resend

## 目录结构

```
api/
  chat.js        # POST /api/chat 问答接口
  kb.js          # 简历知识库（问答的唯一事实来源）
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
| GET | `/api/chat/health` | 知识库条数、索引片段数、大模型是否就绪 |
| GET | `/api/health` | 进程存活、邮件与大模型配置状态 |
| POST | `/api/contact` | 访客留言，转发到邮箱 |

## 更新知识库

问答内容全部来自 `api/kb.js`。**改简历内容只改这一个文件**，检索索引在服务启动时自动重建，无需改代码。

## 部署

自建服务器（Nginx + PM2 + Let's Encrypt）的完整步骤见 [deploy/DEPLOY.md](deploy/DEPLOY.md)。

日常发版（本地执行，服务器无法访问 GitHub，故走增量上传）：

```bash
python deploy/publish.py
```
