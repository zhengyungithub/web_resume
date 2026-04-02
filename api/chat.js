import express from 'express';

// Coze 工作流 API 调用函数
const callCozeWorkflow = async (question) => {
  console.log('调用 Coze 工作流 API，问题：', question);
  
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
  
  const response = await fetch('https://api.coze.cn/v1/workflow/stream_run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'Bearer pat_SU5rApDuFgIcn98BYruKMeX8cVlWTJNgNWC3Gdfay08lxzxVLDG44P2My6vHx3lb'
    },
    body: requestBodyStr
  });
  
  console.log('Coze 工作流 API 响应状态：', response.status);
  return response;
};

const handleWorkflowStreamingResponse = async (res, cozeResponse) => {
  try {
    if (!cozeResponse.body) {
      console.error('Coze 响应没有 body');
      return '你好！我是基于 Coze 工作流的智能助手。\n你可以问我关于简历的任何问题，或者从下方快捷问题开始。';
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
                const data = JSON.parse(dataContent);
                console.log('解析工作流 SSE 数据：', data);
                
                // 尝试多种格式获取输出
                if (data?.content) {
                  try {
                    if (typeof data.content === 'string') {
                      try {
                        const contentJson = JSON.parse(data.content);
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
    
    // 直接返回所有字段，不做拼接和过滤
    const allFields = Object.entries(processedOutputs).map(([key, value]) => {
      return `${value}`;
    }).join('\n\n');
    
    console.log('工作流流式响应处理完成，所有字段：', allFields);
    
    // 如果没有找到任何输出，返回默认问候语
    if (!allFields || allFields.trim() === '') {
      console.log('未找到工作流输出，使用默认响应');
      return '你好！我是基于 Coze 工作流的智能助手。\n你可以问我关于简历的任何问题，或者从下方快捷问题开始。';
    }
    
    return allFields;
  } catch (error) {
    console.error('处理工作流流式响应失败：', error);
    // 出错时返回默认响应
    return '你好！我是基于 Coze 工作流的智能助手。\n你可以问我关于简历的任何问题，或者从下方快捷问题开始。';
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
      
      const cozeResponse = await callCozeWorkflow(question);
      
      let reply = await handleWorkflowStreamingResponse(res, cozeResponse);
      
      // 取消过滤，直接使用原始文本
      console.log('原始回答：', reply);
      
      res.setHeader('Content-Type', 'application/json');
      
      res.json({
        reply,
        sources: [],
        citations: []
      });
    } catch (error) {
      console.error('API 调用错误：', error);
      // 出错时返回默认响应
      res.status(200).json({
        reply: '你好！我是基于 Coze 工作流的智能助手。\n你可以问我关于简历的任何问题，或者从下方快捷问题开始。',
        sources: [],
        citations: []
      });
    }
  });

  return router;
};
