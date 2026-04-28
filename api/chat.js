import express from 'express';

// 缓存系统
class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 24 * 60 * 60 * 1000; // 默认缓存 24 小时
  }

  // 生成缓存键
  generateKey(question) {
    return `coze_${Buffer.from(question.trim().toLowerCase()).toString('base64')}`;
  }

  // 设置缓存
  set(question, response, ttl = this.defaultTTL) {
    const key = this.generateKey(question);
    const expiry = Date.now() + ttl;
    this.cache.set(key, { response, expiry });
    console.log(`缓存已设置：${question.substring(0, 20)}...`);
  }

  // 获取缓存
  get(question) {
    const key = this.generateKey(question);
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`缓存未命中：${question.substring(0, 20)}...`);
      return null;
    }

    if (Date.now() > item.expiry) {
      console.log(`缓存已过期：${question.substring(0, 20)}...`);
      this.cache.delete(key);
      return null;
    }

    console.log(`缓存命中：${question.substring(0, 20)}...`);
    return item.response;
  }

  // 清除缓存
  clear() {
    this.cache.clear();
    console.log('缓存已清空');
  }

  // 获取缓存大小
  size() {
    return this.cache.size;
  }
}

// 创建缓存实例
const responseCache = new ResponseCache();

// 超时处理函数
const timeout = (ms, promise) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`请求超时：${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        clearTimeout(timer);
        reject(reason);
      }
    );
  });
};

// Coze 工作流 API 调用函数（带重试机制）
const callCozeWorkflow = async (question, retries = 3) => {
  console.log('调用 Coze 工作流 API，问题：', question, `（重试次数：${3 - retries + 1}）`);
  
  // 确保问题是字符串类型，并且正确处理中文编码
  const questionStr = String(question || '').trim();
  console.log('处理后的问题字符串：', questionStr);
  
  // 工作流 API 请求体
  const requestBody = {
    workflow_id: "7620101882899824655",
    parameters: {
      input: questionStr
    }
  };
  
  // 确保中文编码正确
  const requestBodyStr = JSON.stringify(requestBody);
  console.log('请求体：', requestBodyStr);
  
  try {
    console.log('开始请求 Coze API...');
    console.log('Coze API URL：', 'https://api.coze.cn/v1/workflow/stream_run');
    
    // 增加超时时间到60秒
    const response = await timeout(60000, fetch('https://api.coze.cn/v1/workflow/stream_run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer pat_pCxfEqh8sg0RIXlJkCFdJ8Iyxj68spTigjUFxYtggxP6MS0Qcn6ibL5SEaQQR0vE'
      },
      body: requestBodyStr,
      // 添加网络请求配置
      keepalive: true,
      // 禁用缓存
      cache: 'no-cache',
      // 添加超时设置
      timeout: 60000
    }));
    
    console.log('Coze 工作流 API 响应状态：', response.status);
    console.log('Coze 工作流 API 响应头部：', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('Coze API 请求失败，状态码：', response.status);
      const errorText = await response.text().catch(() => '无法获取错误详情');
      console.error('Coze API 错误信息：', errorText);
      
      // 如果还有重试次数，递归重试
      if (retries > 0) {
        console.log(`Coze API 请求失败，${retries}秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // 递增延迟
        return callCozeWorkflow(question, retries - 1);
      }
    }
    
    console.log('Coze API 响应对象：', response);
    console.log('Coze API 响应对象是否有 body：', !!response.body);
    
    // 检查 response.body 是否存在，如果不存在，尝试获取响应文本
    if (!response.body) {
      console.error('Coze API 响应没有 body，尝试获取响应文本...');
      const text = await response.text().catch(() => '无法获取响应文本');
      console.error('Coze API 响应文本：', text);
    }
    
    return response;
  } catch (error) {
    console.error('Coze API 请求异常：', error);
    console.error('错误类型：', error.name);
    console.error('错误信息：', error.message);
    console.error('错误堆栈：', error.stack);
    
    // 如果还有重试次数，递归重试
    if (retries > 0) {
      console.log(`Coze API 请求异常，${retries}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // 递增延迟
      return callCozeWorkflow(question, retries - 1);
    }
    
    // 模拟一个失败的响应对象
    return {
      ok: false,
      status: 500,
      statusText: 'Network Error',
      text: async () => JSON.stringify({ error: error.message }),
      json: async () => ({ error: error.message }),
      body: null
    };
  }
};

const handleWorkflowStreamingResponse = async (res, cozeResponse) => {
  try {
    if (!cozeResponse.body) {
      console.error('Coze 响应没有 body');
      return 'Coze API 调用失败：无法获取响应内容';
    }
    
    const reader = cozeResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let allOutputs = {};
    
    console.log('开始处理工作流流式响应');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log('收到工作流流式数据：', chunk);
        
        const lines = buffer.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data:')) {
            const dataContent = line.substring(5).trim();
            if (dataContent) {
              try {
                // 清理 dataContent 中的空格和换行符，确保 JSON 解析成功
                const cleanedDataContent = dataContent.replace(/\s+/g, ' ');
                const data = JSON.parse(cleanedDataContent);
                console.log('解析工作流 SSE 数据：', data);
                
                // 检查是否有错误信息
                if (data?.error) {
                  console.error('Coze 工作流错误：', data.error);
                  // 检测是否为余额不足错误
                  if (data.error.includes('Insufficient coze credits balance') || data.error.includes('余额不足')) {
                    console.error('Coze 工作流余额不足，返回特定错误信息');
                    return 'Coze 工作流余额不足，请稍后再试';
                  }
                  return `Coze 工作流错误：${data.error}`;
                }
                
                // 尝试多种格式获取输出
                if (data?.content) {
                  try {
                    if (typeof data.content === 'string') {
                      try {
                        // 清理 content 中的空格和换行符，确保 JSON 解析成功
                        const cleanedContent = data.content.replace(/\s+/g, ' ');
                        const contentJson = JSON.parse(cleanedContent);
                        console.log('解析 content JSON：', contentJson);
                        
                        // 收集所有可能的输出字段
                        for (const [key, value] of Object.entries(contentJson)) {
                          if (typeof value === 'string' && value.trim() !== '') {
                            allOutputs[key] = value;
                            console.log(`找到工作流输出 ${key}：`, value);
                          }
                        }
                      } catch (jsonError) {
                        console.log('解析 content JSON 失败，使用原始字符串：', jsonError);
                        allOutputs.content = data.content;
                        console.log('直接使用 content 字段：', data.content);
                      }
                    }
                  } catch (e) {
                    console.log('处理 content 字段失败：', e);
                  }
                }
                
                if (data?.data?.outputs) {
                  const outputs = data.data.outputs;
                  console.log('工作流输出：', outputs);
                  
                  for (const [key, value] of Object.entries(outputs)) {
                    if (typeof value === 'string' && value.trim() !== '') {
                      allOutputs[key] = value;
                      console.log(`找到工作流输出 ${key}：`, value);
                    }
                  }
                }
                
                // 检查是否有直接的文本输出
                if (typeof data === 'string' && data.trim() !== '') {
                  allOutputs.text = data;
                  console.log('找到工作流输出 text：', data);
                }
              } catch (e) {
                console.log('解析工作流 SSE 数据失败：', e);
                // 即使解析失败，也尝试使用原始数据
                allOutputs.raw = line;
              }
            }
          }
        }
        
        buffer = lines[lines.length - 1];
      }
    }
    
    console.log('收集到的所有输出字段：', allOutputs);
    
    // 处理输出字段，去除 answerX: 前缀和 # 号
    const processedOutputs = {};
    for (const [key, value] of Object.entries(allOutputs)) {
      // 去除 answerX: 前缀
      let processedValue = value;
      if (key.startsWith('answer') && /answer\d+/.test(key)) {
        processedValue = value.replace(/^answer\d+:\s*/i, '');
      }
      // 去除所有 # 号（Markdown 标题标记）
      processedValue = processedValue.replace(/#/g, '');
      processedOutputs[key] = processedValue;
    }
    
    console.log('处理后的输出字段：', processedOutputs);
    
    // 优先使用 answer4 字段（根据图二的测试结果）
    if (processedOutputs.answer4 && processedOutputs.answer4.trim() !== '') {
      console.log('使用 answer4 字段：', processedOutputs.answer4);
      return processedOutputs.answer4;
    }
    
    // 如果没有 answer4，尝试使用其他 answer 字段
    for (let i = 1; i <= 10; i++) {
      const key = `answer${i}`;
      if (processedOutputs[key] && processedOutputs[key].trim() !== '') {
        console.log(`使用 ${key} 字段：`, processedOutputs[key]);
        return processedOutputs[key];
      }
    }
    
    // 如果没有找到任何 answer 字段，尝试使用其他字段
    for (const [key, value] of Object.entries(processedOutputs)) {
      if (value && value.trim() !== '') {
        console.log(`使用 ${key} 字段：`, value);
        return value;
      }
    }
    
    // 检查是否有任何输出，即使是空字符串
    if (Object.keys(allOutputs).length > 0) {
      console.log('找到输出字段但内容为空：', allOutputs);
      // 尝试直接返回所有内容的字符串表示
      const allContent = JSON.stringify(allOutputs);
      if (allContent && allContent !== '{}') {
        console.log('使用所有输出的字符串表示：', allContent);
        return allContent;
      }
    }
    
    // 如果没有找到任何输出，返回错误信息
    console.log('未找到工作流输出');
    return 'Coze 工作流未返回任何回答';
  } catch (error) {
    console.error('处理工作流流式响应失败：', error);
    console.error('错误堆栈：', error.stack);
    // 出错时返回错误信息
    return `Coze 工作流处理失败：${error.message}`;
  }
};

export const createChatRouter = () => {
  const router = express.Router();

  router.post('/chat', async (req, res) => {
    try {
      console.log('收到聊天请求原始数据：', req);
      console.log('收到聊天请求 headers：', req.headers);
      console.log('收到聊天请求 body：', req.body);
      const question = req.body?.question?.trim() || '';
      console.log('从请求体中获取的问题：', question);
      
      if (!question) {
        return res.status(400).json({ error: '缺少问题内容' });
      }
      
      // 检查缓存
      const cachedResponse = responseCache.get(question);
      if (cachedResponse) {
        console.log('使用缓存响应');
        res.setHeader('Content-Type', 'application/json');
        res.json(cachedResponse);
        return;
      }
      
      const cozeResponse = await callCozeWorkflow(question);
      
      let reply = await handleWorkflowStreamingResponse(res, cozeResponse);
      
      // 取消过滤，直接使用原始文本
      console.log('原始回答：', reply);
      
      const responseData = {
        reply,
        sources: [],
        citations: []
      };
      
      // 存入缓存
      responseCache.set(question, responseData);
      
      res.setHeader('Content-Type', 'application/json');
      
      res.json(responseData);
    } catch (error) {
      console.error('API 调用错误：', error);
      console.error('错误堆栈：', error.stack);
      
      // 出错时也检查缓存
      const question = req.body?.question?.trim() || '';
      const cachedResponse = responseCache.get(question);
      if (cachedResponse) {
        console.log('API 调用失败，使用缓存响应');
        res.status(200).json(cachedResponse);
        return;
      }
      
      // 出错时返回错误信息
      res.status(200).json({
        reply: `Coze API 调用失败：${error.message}`,
        sources: [],
        citations: []
      });
    }
  });

  // 清空缓存的路由（可选）
  router.post('/chat/clear-cache', (req, res) => {
    responseCache.clear();
    res.json({ success: true, message: '缓存已清空', cacheSize: responseCache.size() });
  });

  // 获取缓存状态的路由（可选）
  router.get('/chat/cache-status', (req, res) => {
    res.json({ success: true, cacheSize: responseCache.size() });
  });

  return router;
};
