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
    const reader = cozeResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let replyText = '';
    let allOutputs = {};
    
    console.log('开始处理工作流流式响应');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
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
              
              if (data?.content) {
                try {
                  const contentJson = JSON.parse(data.content);
                  console.log('解析 content JSON：', contentJson);
                  
                  // 收集所有输出字段
                  if (typeof contentJson?.output_pro === 'string' && contentJson.output_pro.trim() !== '') {
                    allOutputs.output_pro = contentJson.output_pro;
                    console.log('找到工作流输出 output_pro：', contentJson.output_pro);
                  }
                  if (typeof contentJson?.output_greet === 'string' && contentJson.output_greet.trim() !== '') {
                    allOutputs.output_greet = contentJson.output_greet;
                    console.log('找到工作流输出 output_greet：', contentJson.output_greet);
                  }
                  if (typeof contentJson?.output_contact === 'string' && contentJson.output_contact.trim() !== '') {
                    allOutputs.output_contact = contentJson.output_contact;
                    console.log('找到工作流输出 output_contact：', contentJson.output_contact);
                  }
                  if (typeof contentJson?.output_guide === 'string' && contentJson.output_guide.trim() !== '') {
                    allOutputs.output_guide = contentJson.output_guide;
                    console.log('找到工作流输出 output_guide：', contentJson.output_guide);
                  }
                  if (typeof contentJson?.greeting === 'string' && contentJson.greeting.trim() !== '') {
                    allOutputs.greeting = contentJson.greeting;
                    console.log('找到工作流输出 greeting：', contentJson.greeting);
                  }
                  if (typeof contentJson?.project === 'string' && contentJson.project.trim() !== '') {
                    allOutputs.project = contentJson.project;
                    console.log('找到工作流输出 project：', contentJson.project);
                  }
                  if (typeof contentJson?.contact === 'string' && contentJson.contact.trim() !== '') {
                    allOutputs.contact = contentJson.contact;
                    console.log('找到工作流输出 contact：', contentJson.contact);
                  }
                  if (typeof contentJson?.guide === 'string' && contentJson.guide.trim() !== '') {
                    allOutputs.guide = contentJson.guide;
                    console.log('找到工作流输出 guide：', contentJson.guide);
                  }
                  if (typeof contentJson?.invalid === 'string' && contentJson.invalid.trim() !== '') {
                    allOutputs.invalid = contentJson.invalid;
                    console.log('找到工作流输出 invalid：', contentJson.invalid);
                  }
                  if (typeof contentJson?.output_invalid === 'string' && contentJson.output_invalid.trim() !== '') {
                    allOutputs.output_invalid = contentJson.output_invalid;
                    console.log('找到工作流输出 output_invalid：', contentJson.output_invalid);
                  }
                } catch (jsonError) {
                  console.log('解析 content JSON 失败：', jsonError);
                  if (typeof data.content === 'string') {
                    allOutputs.content = data.content;
                    console.log('直接使用 content 字段：', data.content);
                  }
                }
              }
              else if (data?.data?.outputs) {
                const outputs = data.data.outputs;
                console.log('工作流输出：', outputs);
                
                if (typeof outputs?.content === 'string') {
                  allOutputs.content = outputs.content;
                  console.log('找到工作流输出 content：', outputs.content);
                }
                else if (typeof outputs?.text === 'string') {
                  allOutputs.text = outputs.text;
                  console.log('找到工作流输出 text：', outputs.text);
                }
                else if (typeof outputs?.greeting === 'string') {
                  allOutputs.greeting = outputs.greeting;
                  console.log('找到工作流输出 greeting：', outputs.greeting);
                }
              }
            } catch (e) {
              console.log('解析工作流 SSE 数据失败：', e);
            }
          }
        }
      }
      
      buffer = lines[lines.length - 1];
    }
    
    console.log('收集到的所有输出字段：', allOutputs);
    
    // 按照Coze工作流的输出字段顺序拼接所有内容
    const outputOrder = ['output_pro', 'output_greet', 'output_contact', 'output_guide', 'greeting', 'project', 'contact', 'guide', 'invalid', 'output_invalid', 'content', 'text'];
    
    for (const field of outputOrder) {
      if (allOutputs[field] && typeof allOutputs[field] === 'string' && allOutputs[field].trim() !== '') {
        if (replyText) {
          replyText += '\n\n' + allOutputs[field];
        } else {
          replyText = allOutputs[field];
        }
        console.log('添加字段到回答：', field, '内容：', allOutputs[field]);
      }
    }
    
    console.log('工作流流式响应处理完成，最终回答：', replyText);
    
    return replyText;
  } catch (error) {
    console.error('处理工作流流式响应失败：', error);
    throw error;
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
      
      if (!reply || reply.trim() === '') {
        throw new Error('Coze 工作流未返回任何回答');
      }
      
      reply = reply.replace(/^\s*#+\s*/gm, '');
      console.log('处理后的回答：', reply);
      
      res.setHeader('Content-Type', 'application/json');
      
      res.json({
        reply,
        sources: [],
        citations: []
      });
    } catch (error) {
      console.error('API 调用错误：', error);
      res.status(500).json({
        error: 'Coze 工作流调用失败',
        details: error?.message || String(error)
      });
    }
  });

  return router;
};