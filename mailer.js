/* ==========================================================================
   PinDa 发信模块：SMTP 客户端 + 邮件模板 + 配置读取
   被 server.js（网站接口）与 配置邮箱.js（配置向导）共用，只用 Node 内置模块。
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');

const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'config.json');

/* ---------------- 常见邮箱服务商参数 ---------------- */
const PROVIDERS = {
  qq: { name: 'QQ 邮箱', host: 'smtp.qq.com', port: 465, secure: true, hint: 'QQ 邮箱网页版 → 设置 → 账号 → 开启「IMAP/SMTP服务」→ 生成 16 位授权码' },
  '163': { name: '网易 163 邮箱', host: 'smtp.163.com', port: 465, secure: true, hint: '163 邮箱 → 设置 → POP3/SMTP/IMAP → 开启 SMTP 服务 → 获取授权码' },
  exmail: { name: '腾讯企业邮 / 企业微信邮箱', host: 'smtp.exmail.qq.com', port: 465, secure: true, hint: '企业邮管理后台 → 客户端设置 → 生成专用密码' },
  outlook: { name: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false, hint: '需先在账号安全里开启两步验证，再生成「应用密码」' },
  gmail: { name: 'Gmail', host: 'smtp.gmail.com', port: 465, secure: true, hint: '需开启两步验证并生成「应用专用密码」' },
  custom: { name: '其它 / 自建 SMTP', host: '', port: 465, secure: true, hint: '请填写 SMTP 服务器地址与端口' }
};
// 显式声明顺序：JS 对象会把纯数字键（如 '163'）排到最前面，菜单不能依赖 Object.keys 的顺序
const PROVIDER_ORDER = ['qq', '163', 'exmail', 'outlook', 'gmail', 'custom'];

/* ---------------- 配置读取 ---------------- */
function isLoopbackHost(host) {
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].indexOf(String(host || '').toLowerCase()) >= 0;
}
function normalizeConfig(file) {
  file = file || {};
  const smtp = file.smtp || {};
  const envSecure = process.env.VEGA_SMTP_SECURE;
  const secure = envSecure != null
    ? String(envSecure).toLowerCase() !== 'false'
    : (smtp.secure !== undefined ? !!smtp.secure : true);
  const cfg = {
    host: process.env.VEGA_SMTP_HOST || smtp.host || '',
    port: Number(process.env.VEGA_SMTP_PORT || smtp.port || 465),
    secure: secure,
    user: process.env.VEGA_SMTP_USER || smtp.user || '',
    pass: process.env.VEGA_SMTP_PASS || smtp.pass || '',
    from: process.env.VEGA_MAIL_FROM || smtp.from || '',
    fromName: smtp.fromName || 'PinDa 校园互助平台',
    domains: file.allowedDomains || ['*.edu.cn', '*.edu'],
    codeTtlMinutes: Number(file.codeTtlMinutes || 10),
    resendSeconds: Number(file.resendSeconds || 60),
    dailyPerEmail: Number(file.dailyPerEmail || 10),
    dailyTotal: Number(file.dailyTotal || 300),       // 全站每日发信上限（防止被刷爆邮箱）
    hourlyPerIp: Number(file.hourlyPerIp || 30),
    allowedOrigins: file.allowedOrigins || [],        // 为空表示允许任何来源（本地/穿透用）
    maxAttempts: Number(file.maxAttempts || 5)
  };
  if (!cfg.from && cfg.user) cfg.from = cfg.user;
  const wantPlain = String(process.env.VEGA_SMTP_PLAINTEXT || smtp.plaintext || 'false') === 'true';
  cfg.plaintext = !!(wantPlain && isLoopbackHost(cfg.host));
  cfg.plaintextIgnored = wantPlain && !isLoopbackHost(cfg.host);
  cfg.mailReady = !!(cfg.host && cfg.user && cfg.pass && cfg.from);
  return cfg;
}
function loadConfig() {
  let file = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try { file = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch (e) {
      const err = new Error('config.json 格式有误（' + e.message + '）');
      err.code = 'BAD_JSON';
      throw err;
    }
  }
  return normalizeConfig(file);
}
function saveConfig(file) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(file, null, 2) + '\n', 'utf8'); }

/* ---------------- 极简 SMTP 客户端 ---------------- */
function wrap(socket) {
  const conn = { sock: socket, buf: '', queue: [], waiting: null };
  socket.setEncoding('utf8');
  socket.on('data', (d) => {
    conn.buf += d;
    let i;
    while ((i = conn.buf.indexOf('\r\n')) >= 0) {
      const line = conn.buf.slice(0, i);
      conn.buf = conn.buf.slice(i + 2);
      conn.queue.push(line);
      if (/^\d{3} /.test(line) && conn.waiting) {
        const cb = conn.waiting; conn.waiting = null;
        cb(conn.queue.splice(0));
      }
    }
  });
  socket.on('error', (err) => { if (conn.waiting) { const cb = conn.waiting; conn.waiting = null; cb(null, err); } });
  conn.cmd = function (text) {
    return new Promise((resolve, reject) => {
      conn.waiting = (lines, err) => (err ? reject(err) : resolve(lines));
      if (text != null) socket.write(text + '\r\n');
    });
  };
  return conn;
}
function codeOf(lines) { return Number(((lines && lines[0]) || '000').slice(0, 3)); }
function dial(host, port, secure, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('连接 ' + host + ':' + port + ' 超时，请检查网络或端口')), timeoutMs || 15000);
    const done = (sock) => { clearTimeout(timer); resolve(sock); };
    const fail = (err) => { clearTimeout(timer); reject(err); };
    let sock;
    if (secure) sock = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => done(sock));
    else sock = net.connect({ host, port }, () => done(sock));
    sock.once('error', fail);
  });
}
function b64(s) { return Buffer.from(String(s), 'utf8').toString('base64'); }
function wrap76(s) { return s.replace(/(.{76})/g, '$1\r\n'); }

function buildMessage(cfg, mail) {
  const headers = [
    'From: =?UTF-8?B?' + b64(cfg.fromName) + '?= <' + cfg.from + '>',
    'To: <' + mail.to + '>',
    'Subject: =?UTF-8?B?' + b64(mail.subject) + '?=',
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@pinda.local>',
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64'
  ].join('\r\n');
  return headers + '\r\n\r\n' + wrap76(Buffer.from(mail.html, 'utf8').toString('base64'));
}

/* 返回 { ok, stage, error } —— stage 用于把错误定位到具体环节 */
async function deliver(cfg, mail) {
  let stage = '连接服务器';
  let conn;
  try {
    conn = wrap(await dial(cfg.host, cfg.port, cfg.plaintext ? false : cfg.secure));
  } catch (e) {
    return { ok: false, stage, error: e.message };
  }
  try {
    stage = '握手';
    let r = await conn.cmd(null);
    if (codeOf(r) !== 220) return { ok: false, stage, error: '服务器未正常问候：' + r.join(' ') };

    stage = 'EHLO';
    let ehlo = await conn.cmd('EHLO pinda.local');
    if (codeOf(ehlo) !== 250) return { ok: false, stage, error: ehlo.join(' ') };

    if (!cfg.secure && !cfg.plaintext) {
      stage = 'STARTTLS';
      const st = await conn.cmd('STARTTLS');
      if (codeOf(st) !== 220) return { ok: false, stage, error: 'STARTTLS 失败：' + st.join(' ') };
      const upgraded = await new Promise((resolve, reject) => {
        const t = tls.connect({ socket: conn.sock, servername: cfg.host, rejectUnauthorized: false }, () => resolve(t));
        t.once('error', reject);
      }).catch((e) => { stage = 'TLS 升级'; throw e; });
      conn = wrap(upgraded);
      ehlo = await conn.cmd('EHLO pinda.local');
      if (codeOf(ehlo) !== 250) return { ok: false, stage: 'STARTTLS 后 EHLO', error: ehlo.join(' ') };
    }

    stage = '登录';
    const auth = await conn.cmd('AUTH LOGIN');
    if (codeOf(auth) !== 334) return { ok: false, stage, error: '服务器不支持账号密码登录：' + auth.join(' ') };
    const u = await conn.cmd(b64(cfg.user));
    if (codeOf(u) !== 334) return { ok: false, stage: '用户名', error: u.join(' ') };
    const p = await conn.cmd(b64(cfg.pass));
    if (codeOf(p) !== 235) return { ok: false, stage: '密码/授权码', error: p.join(' ') };

    stage = '发件人';
    const mf = await conn.cmd('MAIL FROM:<' + cfg.from + '>');
    if (codeOf(mf) !== 250) return { ok: false, stage, error: mf.join(' ') };
    stage = '收件人';
    const rcpt = await conn.cmd('RCPT TO:<' + mail.to + '>');
    if (codeOf(rcpt) !== 250 && codeOf(rcpt) !== 251) return { ok: false, stage, error: rcpt.join(' ') };
    stage = '投递内容';
    const data = await conn.cmd('DATA');
    if (codeOf(data) !== 354) return { ok: false, stage, error: data.join(' ') };
    const sent = await conn.cmd(buildMessage(cfg, mail) + '\r\n.');
    if (codeOf(sent) !== 250) return { ok: false, stage, error: sent.join(' ') };
    conn.cmd('QUIT').catch(() => {});
    conn.sock.end();
    return { ok: true };
  } catch (e) {
    return { ok: false, stage, error: e.message };
  }
}

/* 把技术错误翻译成人话 */
function diagnose(res, cfg) {
  const e = String((res && res.error) || '');
  if (res.ok) return '';
  if (/ECONNREFUSED/.test(e)) return '端口或地址不对：' + cfg.host + ':' + cfg.port + ' 没有响应。QQ/163 用 465（secure 为 true），Outlook 用 587（secure 为 false）。';
  if (/ETIMEDOUT|超时|ENOTFOUND|EAI_AGAIN/.test(e)) return '连不上服务器：检查网络，或确认 SMTP 地址是否写错（' + cfg.host + '）。';
  if (/wrong version number|EPROTO|SSL|handshake/i.test(e)) return '加密方式不匹配：改用另一组「端口 + secure」组合试试（465 → true，587 → false）。';
  if (/535|认证失败|Authentication|Username and Password|登录失败/i.test(e)) return '账号或授权码不对：请确认 pass 填的是邮箱「授权码 / 应用密码」，不是邮箱登录密码，并且服务商已开启 SMTP 服务。';
  if (/550|553|554|RCPT/i.test(e) && res.stage === '收件人') return '收件人被拒：确认收件邮箱地址是否存在，或被对方的反垃圾策略拦下。';
  if (/550|MAIL FROM/i.test(e)) return '发件人被拒：一般需要在邮箱后台确认发件地址与登录账号一致。';
  return '';
}

/* ---------------- 邮件模板 ---------------- */
function codeEmail(code, ttl, purpose) {
  return '<div style="font-family:-apple-system,Segoe UI,Microsoft YaHei,sans-serif;background:#FBF8F1;padding:28px">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #EAE3D4;border-radius:18px;overflow:hidden">' +
      '<div style="background:#17161A;padding:22px 26px">' +
        '<div style="color:#FBF7EF;font-family:Georgia,serif;font-size:22px;letter-spacing:4px">PinDa</div>' +
        '<div style="color:#C6A15B;font-size:11px;letter-spacing:3px;margin-top:4px">UNDER THE FIRMAMENT</div>' +
        '<div style="color:rgba(251,247,239,.72);font-size:12.5px;margin-top:10px">连接校园，让校园生活更简单</div>' +
      '</div>' +
      '<div style="padding:26px">' +
        '<p style="margin:0 0 14px;color:#1C1B1A;font-size:15px">你好，你正在进行<b>' + purpose + '</b>。验证码是：</p>' +
        '<div style="font-family:Consolas,Menlo,monospace;font-size:34px;letter-spacing:8px;font-weight:700;color:#8A6224;background:#FBF3E4;border-radius:12px;text-align:center;padding:16px 0">' + code + '</div>' +
        '<p style="color:#7A7466;font-size:13px;margin:16px 0 0">验证码 ' + ttl + ' 分钟内有效，每个验证码只能使用一次。</p>' +
        '<p style="color:#7A7466;font-size:13px;margin:8px 0 0">如果这不是你本人的操作，请忽略本邮件，你的账号不会有任何变化。</p>' +
        '<hr style="border:0;border-top:1px solid #EAE3D4;margin:20px 0">' +
        '<p style="color:#9A9484;font-size:12px;margin:0">PinDa 只会用这个验证码核验你的在校身份，永远不需要你的学校统一身份密码。</p>' +
      '</div>' +
    '</div>' +
    '<p style="text-align:center;color:#A9A395;font-size:11px;margin-top:14px">本邮件由 PinDa 校园互助平台自动发送</p>' +
  '</div>';
}
function testEmail(cfg) {
  return '<div style="font-family:-apple-system,Segoe UI,Microsoft YaHei,sans-serif;background:#FBF8F1;padding:28px">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #EAE3D4;border-radius:18px;padding:26px">' +
      '<div style="color:#17161A;font-family:Georgia,serif;font-size:20px;letter-spacing:3px">PinDa</div>' +
      '<h2 style="color:#1C1B1A;font-size:18px;margin:16px 0 10px">邮箱配置成功 ✅</h2>' +
      '<p style="color:#3B382F;font-size:14px;line-height:1.7;margin:0">' +
        '你收到这封邮件，说明 PinDa 已经可以正常发送验证码了。<br>' +
        '以后同学在注册页点「发送验证码」，就会收到和这封一样的品牌邮件。' +
      '</p>' +
      '<div style="background:#FBF3E4;border-radius:12px;padding:14px;margin-top:16px;color:#7A5B22;font-size:13px">' +
        '发件账号：' + cfg.from + '<br>SMTP 服务器：' + cfg.host + ':' + cfg.port + '（' + (cfg.secure ? 'SSL/TLS' : 'STARTTLS') + '）' +
      '</div>' +
      '<p style="color:#7A7466;font-size:12.5px;margin-top:16px">下一步：双击「启动本地预览.cmd」启动网站即可。</p>' +
    '</div>' +
  '</div>';
}
function maskEmail(e) {
  const parts = String(e || '').split('@');
  return (parts[0] || '').slice(0, 3) + '***@' + (parts[1] || '');
}

module.exports = {
  ROOT, CONFIG_PATH, PROVIDERS, PROVIDER_ORDER, normalizeConfig, loadConfig, saveConfig,
  deliver, diagnose, codeEmail, testEmail, maskEmail, isLoopbackHost
};
