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

    // ⚠️ resend SDK 的 send() 不会抛异常：失败时把错误放在返回值的 error 里。
    // 只写 try/catch 会让「域名未验证」「key 失效」这类错误伪装成成功，
    // 前端显示已发送、用户却收不到信，排查时完全没有线索。
    const { data, error } = await resend.emails.send({
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

    if (error) {
      // 常见原因：域名未在 Resend 验证、key 被吊销、额度用尽、收件人被拒
      console.error('[contact] Resend 返回错误：', JSON.stringify(error));
      return res.status(500).json({ error: '留言发送失败，请稍后重试或直接发邮件' });
    }

    console.log('[contact] 已投递，resend id =', data?.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    // 只有网络层异常会走到这里
    console.error('[contact] 发送异常：', error);
    return res.status(500).json({ error: '留言发送失败，请稍后重试或直接发邮件' });
  }
}
