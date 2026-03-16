import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { name, email, subject, message } = req.body;

    console.log("接收到表单数据:", { name, email, subject, message });
    console.log("Resend API Key:", process.env.RESEND_API_KEY ? "已配置" : "未配置");

    // 在函数内部创建Resend实例，确保环境变量已加载
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: '网站留言 <contact@zhengyun.online>', // ✅ 你的自定义域名邮箱
      to: ['zhengyun_0629@qq.com'], // ✅ 你的接收邮箱
      reply_to: email, // 方便你直接回复访客
      subject: `[网站留言] ${subject || '新消息'}`,
      html: `
        <h3>你有新的网站访客留言！</h3>
        <p><strong>姓名：</strong>${name}</p>
        <p><strong>邮箱：</strong>${email}</p>
        <p><strong>主题：</strong>${subject}</p>
        <p><strong>内容：</strong>${message}</p>
      `,
    });

    console.log("邮件发送成功:", data);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("发送邮件失败:", error);
    console.error("错误详情:", error.response ? error.response.data : error);
    return res.status(500).json({ error: error.message, details: error.response ? error.response.data : null });
  }
}
