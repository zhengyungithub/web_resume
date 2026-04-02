import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contactHandler from './api/contact.js';
import { createChatRouter } from './api/chat.js';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 配置 CORS
app.use(cors({
  origin: function(origin, callback) {
    // 允许所有 Vercel 域名和自定义域名
    const allowedOrigins = [
      'http://localhost:5173',
      'https://zhengyun.online',
      'https://www.zhengyun.online'
    ];
    
    // 检查是否匹配允许的域名
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return origin === allowed;
    });
    
    // 允许所有 vercel.app 子域名
    const isVercelDomain = origin && origin.endsWith('.vercel.app');
    
    if (isAllowed || isVercelDomain || !origin) {
      callback(null, true);
    } else {
      console.log('CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// 解析 JSON 请求体
app.use(express.json());

// 处理 API 路由
app.post('/api/contact', contactHandler);

// 使用聊天路由
const chatRouter = createChatRouter();
app.use('/api', chatRouter);

// 提供静态文件服务
app.use(express.static('public'));

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
