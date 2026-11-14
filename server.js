/* ==========================================================================
   PinDa 本地服务器：静态站点 + 邮箱验证码接口
   - 只用 Node 内置模块，不需要 npm install
   - 真实发信：双击「配置邮箱.cmd」填好邮箱账号与授权码后即可
   - 未配置时自动进入演示模式：验证码直接显示在页面上
   - 验证码由服务端生成与校验，前端无法绕过；带频率限制
   ========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const mailer = require('./mailer.js');

const ROOT = __dirname;
const PORT = Number(process.env.PinDa_PORT || 5173);

/* 局域网：让同一 Wi-Fi 下的手机 / 其它电脑也能打开（可用 config.json 的 lan:false 关闭） */
function readLanFlag() {
  try {
    const f = path.join(ROOT, 'config.json');
    if (!fs.existsSync(f)) return true;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    return j.lan !== false;
  } catch (e) { return true; }
}
function lanAddresses() {
  const out = [];
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach(function (name) {
    (ifs[name] || []).forEach(function (a) {
      if (a.family === 'IPv4' && !a.internal) out.push({ name: name, address: a.address });
    });
  });
  return out;
}
const LAN_ON = readLanFlag();

let CFG;
try {
  CFG = mailer.loadConfig();
} catch (e) {
  console.error('\n[PinDa] ' + e.message);
  console.error('请删除或修正 config.json，或重新双击「配置邮箱.cmd」生成一份。\n');
  process.exit(1);
}

/* ---------------- 验证码存储（内存） ---------------- */
const codes = new Map();
const ipHits = new Map();
let sentTotalToday = 0;
let totalDay = new Date().toISOString().slice(0, 10);
function today() { return new Date().toISOString().slice(0, 10); }
function genCode() { return String(crypto.randomInt(100000, 1000000)); }
function isSchoolEmail(email, domains) {
  const m = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/.exec(String(email || '').trim());
  if (!m) return false;
  const domain = m[1].toLowerCase();
  return (domains || []).some(function (d) {
    const rule = String(d || '').toLowerCase();
    if (rule.indexOf('*.') === 0) return domain === rule.slice(2) || domain.slice(-(rule.length - 1)) === rule.slice(1);
    return domain === rule;
  });
}

/* ---------------- 基础工具 ---------------- */
function json(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8');
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': buf.length });
  res.end(buf);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > (limit || 4096)) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('JSON 解析失败')); }
    });
    req.on('error', reject);
  });
}
function clientIp(req) { return (req.socket.remoteAddress || 'unknown').replace('::ffff:', ''); }
/* 可选来源白名单：config.json 里配了 allowedOrigins 才生效（部署到固定域名时建议配置） */
function originAllowed(req) {
  const list = CFG.allowedOrigins || [];
  if (!list.length) return true;
  const origin = req.headers.origin || req.headers.referer || '';
  if (!origin) return true;                     // 直接访问 API 的情况交给限流处理
  return list.some(function (o) { return origin.indexOf(o) === 0; });
}
function ipAllowed(ip) {
  const now = Date.now();
  const rec = ipHits.get(ip) || { windowStart: now, count: 0 };
  if (now - rec.windowStart > 3600000) { rec.windowStart = now; rec.count = 0; }
  if (rec.count >= CFG.hourlyPerIp) return false;
  rec.count++; ipHits.set(ip, rec);
  return true;
}

/* ---------------- 接口 ---------------- */
async function handleSendCode(req, res) {
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
  const email = String(body.email || '').trim().toLowerCase();
  if (!originAllowed(req)) return json(res, 403, { ok: false, error: '来源不被允许' });
  if (!isSchoolEmail(email, CFG.domains)) {
    return json(res, 400, { ok: false, error: '请使用校园邮箱（' + CFG.domains.map((d) => d.replace('*', '')).join(' / ') + '）' });
  }
  if (!ipAllowed(clientIp(req))) return json(res, 429, { ok: false, error: '请求过于频繁，请稍后再试' });

  if (totalDay !== today()) { totalDay = today(); sentTotalToday = 0; }
  if (sentTotalToday >= CFG.dailyTotal) {
    console.log('[PinDa] 已达到全站每日发信上限，暂停发信');
    return json(res, 429, { ok: false, error: '平台今日验证码发送量已达上限，请明天再试' });
  }

  const now = Date.now();
  const rec = codes.get(email) || { sendsToday: 0, day: today() };
  if (rec.day !== today()) { rec.sendsToday = 0; rec.day = today(); }
  if (rec.sentAt && now - rec.sentAt < CFG.resendSeconds * 1000) {
    const wait = Math.ceil((CFG.resendSeconds * 1000 - (now - rec.sentAt)) / 1000);
    return json(res, 429, { ok: false, error: '请 ' + wait + ' 秒后再重新发送' });
  }
  if (rec.sendsToday >= CFG.dailyPerEmail) {
    return json(res, 429, { ok: false, error: '该邮箱今日发送次数已达上限，请明天再试' });
  }

  const code = genCode();
  const prev = { code: rec.code, expiresAt: rec.expiresAt, attempts: rec.attempts, sentAt: rec.sentAt, sendsToday: rec.sendsToday };
  rec.code = code;
  rec.expiresAt = now + CFG.codeTtlMinutes * 60000;
  rec.attempts = 0;
  rec.sentAt = now;
  rec.sendsToday++;
  codes.set(email, rec);

  if (!CFG.mailReady) {
    console.log('[PinDa][演示模式] 验证码 ' + code + ' → ' + mailer.maskEmail(email) + '（未配置 SMTP，验证码直接返回给页面）');
    return json(res, 200, { ok: true, delivered: false, demoCode: code, ttlMinutes: CFG.codeTtlMinutes });
  }
  const result = await mailer.deliver(CFG, { to: email, subject: '【PinDa】邮箱验证码', html: mailer.codeEmail(code, CFG.codeTtlMinutes, '校园身份认证') });
  if (result.ok) {
    sentTotalToday++;
    console.log('[PinDa] 验证码已发送 → ' + mailer.maskEmail(email));
    return json(res, 200, { ok: true, delivered: true, ttlMinutes: CFG.codeTtlMinutes, resendSeconds: CFG.resendSeconds });
  }
  // 发信失败要回滚，否则同学在配置修好前会被冷却挡住
  rec.code = prev.code; rec.expiresAt = prev.expiresAt; rec.attempts = prev.attempts;
  rec.sentAt = prev.sentAt; rec.sendsToday = prev.sendsToday;
  codes.set(email, rec);
  const hint = mailer.diagnose(result, CFG);
  console.error('[PinDa] 发信失败（' + result.stage + '）：' + result.error);
  return json(res, 502, { ok: false, error: '邮件发送失败（' + result.stage + '）' + (hint ? '：' + hint : '：' + result.error) });
}

async function handleVerifyCode(req, res) {
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
  const email = String(body.email || '').trim().toLowerCase();
  const code = String(body.code || '').trim();
  const rec = codes.get(email);
  if (!rec || !rec.code) return json(res, 400, { ok: false, error: '请先点击「发送验证码」' });
  if (Date.now() > rec.expiresAt) { codes.delete(email); return json(res, 400, { ok: false, error: '验证码已过期，请重新发送' }); }
  rec.attempts = (rec.attempts || 0) + 1;
  if (rec.attempts > CFG.maxAttempts) { codes.delete(email); return json(res, 429, { ok: false, error: '尝试次数过多，请重新发送验证码' }); }
  if (code !== rec.code) return json(res, 400, { ok: false, error: '验证码不正确' });
  codes.delete(email);
  return json(res, 200, { ok: true });
}

/* ---------------- 静态文件 ---------------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon', '.webp': 'image/webp'
};
const BLOCKED_FILES = ['config.json', 'mailer.js', 'server.js'];
function serveStatic(req, res, urlPath) {
  // 支持带品牌字样的路径：/pinda/…（新）与 /vega/…（旧链接兼容）
  let p = urlPath;
  ['/pinda', '/vega'].forEach(function (prefix) {
    if (p === prefix || p === prefix + '/') p = '/';
    else if (p.indexOf(prefix + '/') === 0) p = p.slice(prefix.length);
  });
  const rel = p === '/' ? 'index.html' : p.replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end('forbidden'); return; }
  if (BLOCKED_FILES.indexOf(path.basename(file)) >= 0) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('forbidden');
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

/* ---------------- 启动 ---------------- */
async function handleRequest(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  if (urlPath === '/api/status') {
    return json(res, 200, {
      ok: true, mail: CFG.mailReady, demoMode: !CFG.mailReady,
      domains: CFG.domains, ttlMinutes: CFG.codeTtlMinutes,
      resendSeconds: CFG.resendSeconds, from: CFG.mailReady ? mailer.maskEmail(CFG.from) : null
    });
  }
  if (urlPath === '/api/send-code') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: '请使用 POST' });
    return handleSendCode(req, res);
  }
  if (urlPath === '/api/verify-code') {
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: '请使用 POST' });
    return handleVerifyCode(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end('method not allowed'); return; }
  serveStatic(req, res, urlPath);
}

/* 监听地址：
   · 0.0.0.0 —— 本机（含 127.0.0.1）与局域网，同一 Wi-Fi 的设备可访问
   · ::1     —— 浏览器把 pinda.localhost 解析成 ::1 时也能连上
   关闭局域网访问（config.json 里 "lan": false）时只监听回环地址。 */
const LISTENS = LAN_ON
  ? [{ host: '0.0.0.0' }, { host: '::1' }]
  : [{ host: '127.0.0.1' }, { host: '::1' }];
let listening = 0;
const servers = LISTENS.map(function (target) {
  const s = http.createServer((req, res) => { handleRequest(req, res).catch(function () { try { res.writeHead(500).end('server error'); } catch (e) {} }); });
  s.on('error', function (e) { console.warn('  [提醒] 无法监听 ' + target.host + '：' + e.message); });
  s.listen(PORT, target.host, function () {
    listening++;
    if (listening >= LISTENS.length) banner();
  });
  return s;
});
setTimeout(function () { if (listening && listening < LISTENS.length) banner(); }, 300);
let bannerShown = false;
function banner() {
  if (bannerShown) return;
  bannerShown = true;
  console.log('');
  console.log('  PinDa 已启动，打开下面任意一个地址即可：');
  console.log('    本机：★ http://pinda.localhost:' + PORT + '/    （域名带 pinda，推荐）');
  console.log('          http://127.0.0.1:' + PORT + '/pinda/    （路径带 pinda，备用）');
  if (LAN_ON) {
    var lans = lanAddresses();
    if (lans.length) {
      lans.forEach(function (a) {
        console.log('    手机 / 其它设备（需接同一个 Wi-Fi）：http://' + a.address + ':' + PORT + '/   [' + a.name + ']');
      });
    } else {
      console.log('    手机 / 其它设备：未检测到局域网地址，请确认已连接 Wi-Fi');
    }
  } else {
    console.log('    局域网访问已关闭（config.json 里 "lan": false）');
  }
  if (CFG.mailReady) {
    console.log('');
    console.log('  邮箱验证码：真实发送（' + CFG.host + ':' + CFG.port + '，发件人 ' + mailer.maskEmail(CFG.from) + '）');
  } else {
    console.log('');
    console.log('  邮箱验证码：演示模式（未配置 SMTP，验证码直接显示在页面上）');
    console.log('  想真实发到邮箱：双击同目录下的「配置邮箱.cmd」');
  }
  if (CFG.plaintextIgnored) console.warn('  [提醒] 已忽略 plaintext 选项：只有本机 SMTP 才能关闭 TLS');
  if (LAN_ON) console.log('  [提示] 局域网内的设备可以访问本服务；验证码接口有限流（每 IP 每小时 ' + CFG.hourlyPerIp + ' 次、每邮箱每天 ' + CFG.dailyPerEmail + ' 次）');
  console.log('  按 Ctrl + C 结束');
  console.log('');
}
process.on('SIGINT', function () { servers.forEach(function (s) { try { s.close(); } catch (e) {} }); process.exit(0); });
