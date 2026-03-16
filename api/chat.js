import express from 'express';

// Coze 工作流 API 调用函数
const callCozeWorkflow = async (question) => {
  console.log('调用 Coze 工作流 API，问题：', question);
  
  // 确保问题是字符串类型，并且正确处理中文编码
  const questionStr = String(question || '').trim();
  console.log('处理后的问题字符串：', questionStr);
  
  // 工作流 API 请求体
  const requestBody = {
    workflow_id: "7617082079243649066",
    parameters: {
      question: questionStr
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

// 处理工作流 API 流式响应
const handleWorkflowStreamingResponse = async (res, cozeResponse) => {
  try {
    const reader = cozeResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let replyText = '抱歉，我暂时无法回答这个问题。';
    
    console.log('开始处理工作流流式响应');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      console.log('收到工作流流式数据：', chunk);
      
      // 处理 SSE 格式
      const lines = buffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data:')) {
          const dataContent = line.substring(5).trim();
          if (dataContent) {
            try {
              const data = JSON.parse(dataContent);
              console.log('解析工作流 SSE 数据：', data);
              
              // 检查是否是工作流的输出
              if (data?.content) {
                // 尝试解析 content 字段，因为它是一个 JSON 字符串
                try {
                  const contentJson = JSON.parse(data.content);
                  console.log('解析 content JSON：', contentJson);
                  
                  // 检查各种输出字段
                  if (typeof contentJson?.output_greet === 'string' && contentJson.output_greet.trim() !== '') {
                    replyText = contentJson.output_greet;
                    console.log('找到工作流输出 output_greet：', replyText);
                  }
                  else if (typeof contentJson?.output_pro === 'string' && contentJson.output_pro.trim() !== '') {
                    replyText = contentJson.output_pro;
                    console.log('找到工作流输出 output_pro：', replyText);
                  }
                  else if (typeof contentJson?.output_contact === 'string' && contentJson.output_contact.trim() !== '') {
                    replyText = contentJson.output_contact;
                    console.log('找到工作流输出 output_contact：', replyText);
                  }
                  else if (typeof contentJson?.output_guide === 'string' && contentJson.output_guide.trim() !== '') {
                    replyText = contentJson.output_guide;
                    console.log('找到工作流输出 output_guide：', replyText);
                  }
                  else if (typeof contentJson?.output_invalid === 'string' && contentJson.output_invalid.trim() !== '') {
                    replyText = contentJson.output_invalid;
                    console.log('找到工作流输出 output_invalid：', replyText);
                  }
                } catch (jsonError) {
                  console.log('解析 content JSON 失败：', jsonError);
                  // 如果解析失败，直接使用 content 字段
                  if (typeof data.content === 'string') {
                    replyText = data.content;
                    console.log('直接使用 content 字段：', replyText);
                  }
                }
              }
              // 也检查 data.data.outputs 格式
              else if (data?.data?.outputs) {
                const outputs = data.data.outputs;
                console.log('工作流输出：', outputs);
                
                // 从outputs中提取content字段，这是工作流画布中定义的输出变量
                if (typeof outputs?.content === 'string') {
                  replyText = outputs.content;
                  console.log('找到工作流输出 content：', replyText);
                }
                // 也检查其他可能的输出字段
                else if (typeof outputs?.text === 'string') {
                  replyText = outputs.text;
                  console.log('找到工作流输出 text：', replyText);
                }
                else if (typeof outputs?.greeting === 'string') {
                  replyText = outputs.greeting;
                  console.log('找到工作流输出 greeting：', replyText);
                }
              }
            } catch (e) {
              console.log('解析工作流 SSE 数据失败：', e);
              // 继续处理下一行
            }
          }
        }
      }
      
      // 保留最后一行，可能是不完整的
      buffer = lines[lines.length - 1];
    }
    
    console.log('工作流流式响应处理完成，最终回答：', replyText);
    
    // 如果没有获取到回答，使用默认值
    if (!replyText || replyText.trim() === '') {
      replyText = '抱歉，我暂时无法回答这个问题。';
    }
    
    return replyText;
  } catch (error) {
    console.error('处理工作流流式响应失败：', error);
    return '抱歉，我暂时无法回答这个问题。';
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
      
      // 调用 Coze 工作流 API
      const cozeResponse = await callCozeWorkflow(question);
      
      // 处理工作流响应
      let reply = await handleWorkflowStreamingResponse(res, cozeResponse);
      
      // 如果没有获取到回答，使用默认值
      if (!reply || reply.trim() === '') {
        reply = '抱歉，我暂时无法回答这个问题。';
      }
      
      // 去除Markdown格式的#符号，提高用户体验
      reply = reply.replace(/^\s*#+\s*/gm, '');
      console.log('处理后的回答：', reply);
      
      // 设置响应头
      res.setHeader('Content-Type', 'application/json');
      
      // 返回结果
      res.json({
        reply,
        sources: [],
        citations: []
      });
    } catch (error) {
      console.error('API 调用错误：', error);
      res.status(500).json({
        error: 'AI 暂时开小差了，请稍后再试。',
        details: error?.message || String(error)
      });
    }
  });

  return router;
};