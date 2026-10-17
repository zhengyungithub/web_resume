import { Resend } from 'resend';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  const { name, email, subject, message, _gotcha } = req.body || {};

  // 蜜罐字段：机器人会填，正常人看不见
  if (_gotcha) {
    return res.status(200).json({ success: true });
  }

  if (!String(name || '').trim() || !isEmail(email) || !String(message || '').trim()) {
    return res.status(400).json({ error: '请填写姓名、有效邮箱和留言内容' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] 未配置 RESEND_API_KEY');
    return res.status(503).json({ error: '留言服务暂未配置好，请直接发邮件联系' });
  }

  const to = (process.env.CONTACT_TO || 'zhengyun_0629@qq.com')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const from = process.env.CONTACT_FROM || '网站留言 <contact@zhengyun.online>';

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from,
      to,
      reply_to: String(email).trim(),
      subject: `[网站留言] ${String(subject || '新消息').slice(0, 80)}`,
      html: `
        <h3>你有新的网站访客留言</h3>
        <p><strong>姓名：</strong>${escapeHtml(name)}</p>
        <p><strong>邮箱：</strong>${escapeHtml(email)}</p>
        <p><strong>主题：</strong>${escapeHtml(subject)}</p>
        <p><strong>内容：</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    // 详细原因只写日志，不返回给浏览器
    console.error('[contact] 发送失败：', error);
    return res.status(500).json({ error: '留言发送失败，请稍后重试或直接发邮件' });
  }
}
