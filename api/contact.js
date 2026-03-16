// api/contact.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // 调用 Resend 发邮件
    const data = await resend.emails.send({
      from: '网站留言 <onboarding@resend.dev>', // 官方测试地址，必过
      to: ['zhengyun_0629@qq.com'], // 你的接收邮箱
      reply_to: email,
      subject: `[网站留言] ${subject || '新消息'}`,
      html: `
        <p><strong>姓名：</strong>${name}</p>
        <p><strong>邮箱：</strong>${email}</p>
        <p><strong>主题：</strong>${subject}</p>
        <p><strong>内容：</strong>${message}</p>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("发送失败:", error);
    return res.status(500).json({ error: error.message });
  }
}
