import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatRouter } from './api/chat.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// 确保正确处理UTF-8编码
app.use(express.json({ encoding: 'utf-8' }));
app.use(express.urlencoded({ extended: true, encoding: 'utf-8' }));

const cozeApiKey = process.env.COZE_API_KEY;
if (!cozeApiKey || cozeApiKey === 'pat_xxxxxxxxxxxxxxxxxxxxxx') {
  console.warn('⚠️  警告: 未检测到有效的 COZE_API_KEY，AI 功能将无法正常工作。请在 .env 文件中配置。');
}

const cozeBotId = process.env.COZE_BOT_ID;
if (!cozeBotId || cozeBotId === '73xxxxxxxxxxxxxxxxxxxxx') {
  console.warn('⚠️  警告: 未检测到有效的 COZE_BOT_ID，AI 功能将无法正常工作。请在 .env 文件中配置。');
}

app.use('/api', createChatRouter());

app.listen(port, () => {
  console.log(`
  🚀 阿筠 AI 后端服务已启动!
  🔗 本地地址: http://localhost:${port}
  `);
});
