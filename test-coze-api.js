import fetch from 'node-fetch';

// 测试 Coze API 调用
async function testCozeAPI() {
  try {
    const question = '技能';
    const requestBody = {
      workflow_id: "7620101882899824655",
      parameters: {
        input: question
      }
    };

    console.log('测试 Coze API，问题：', question);
    console.log('请求体：', JSON.stringify(requestBody));

    const response = await fetch('https://api.coze.cn/v1/workflow/stream_run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer pat_pCxfEqh8sg0RIXlJkCFdJ8Iyxj68spTigjUFxYtggxP6MS0Qcn6ibL5SEaQQR0vE'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Coze API 响应状态：', response.status);
    console.log('Coze API 响应头部：', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API 请求失败：', errorText);
      return;
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    console.log('开始处理流式响应...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log('收到流式数据：', chunk);
      }
    }

    console.log('完整响应：', buffer);
  } catch (error) {
    console.error('测试 Coze API 失败：', error);
    console.error('错误堆栈：', error.stack);
  }
}

testCozeAPI();
