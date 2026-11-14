/* ==========================================================================
   PinDa 邮箱配置向导（配合「配置邮箱.cmd」使用）
   问三个问题 → 写好 config.json → 立刻发一封测试邮件 → 给出中文诊断
   授权码只在你的电脑上输入与保存，不会出现在聊天记录或任何网络请求里。
   ========================================================================== */
const fs = require('fs');
const readline = require('readline');
const mailer = require('./mailer.js');

const C = {
  reset: '\u001b[0m', dim: '\u001b[2m', bold: '\u001b[1m',
  gold: '\u001b[33m', green: '\u001b[32m', red: '\u001b[31m', cyan: '\u001b[36m'
};
const line = () => console.log(C.dim + '──────────────────────────────────────────────' + C.reset);
const keys = Object.keys(mailer.PROVIDERS);

const PROVIDER_KEYS = mailer.PROVIDER_ORDER;

/* 输入层：只建立一个读取器，避免管道/批量输入时后续回答被丢弃 */
const answerQueue = [];
let stdinEnded = false;
let waitingFor = null;
if (!process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  rl.on('line', (l) => {
    const v = String(l).replace(/\r$/, '');
    if (waitingFor) { const cb = waitingFor; waitingFor = null; cb(v); }
    else answerQueue.push(v);
  });
  rl.on('close', () => {
    stdinEnded = true;
    if (waitingFor) { const cb = waitingFor; waitingFor = null; cb(''); }
  });
}
function nextLine() {
  return new Promise((resolve) => {
    if (answerQueue.length) return resolve(answerQueue.shift());
    if (stdinEnded) return resolve('');
    waitingFor = resolve;
  });
}

function ask(question, options) {
  options = options || {};
  return new Promise((resolve) => {
    const q = question + (options.default ? C.dim + '（直接回车用 ' + options.default + '）' + C.reset : '') + '：';
    if (options.secret && process.stdin.isTTY) {
      process.stdout.write(q);
      const stdin = process.stdin;
      stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
      let buf = '';
      const cleanup = () => { stdin.removeListener('data', onData); stdin.setRawMode(false); stdin.pause(); };
      const onData = (ch) => {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') { cleanup(); process.stdout.write('\n'); resolve(buf.trim() || options.default || ''); }
        else if (ch === '\u0003') { cleanup(); process.stdout.write('\n'); process.exit(1); }
        else if (ch === '\u007f' || ch === '\b') { if (buf.length) { buf = buf.slice(0, -1); process.stdout.write('\b \b'); } }
        else { buf += ch; process.stdout.write('*'); }
      };
      stdin.on('data', onData);
    } else {
      process.stdout.write(q);
      nextLine().then((a) => resolve(String(a).trim() || options.default || ''));
    }
  });
}

async function main() {
  console.log('');
  console.log(C.gold + '  PinDa · 邮箱配置向导' + C.reset);
  console.log(C.dim + '  连接西浦，让校园生活更简单' + C.reset);
  line();
  console.log('  这个向导会帮你生成 config.json，并当场发一封测试邮件。');
  console.log('  需要准备的只有一样：你的邮箱' + C.bold + '授权码' + C.reset + '（不是邮箱登录密码）。');
  console.log('');

  let existing = null;
  if (fs.existsSync(mailer.CONFIG_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(mailer.CONFIG_PATH, 'utf8'));
      const cur = (existing.smtp || {}).user;
      if (cur) console.log(C.cyan + '  已检测到旧配置（发件邮箱 ' + cur + '），直接回车可沿用原来的值。' + C.reset + '\n');
    } catch (e) { existing = null; }
  }
  const oldSmtp = (existing && existing.smtp) || {};

  console.log('  请选择你用来发信的邮箱：');
  PROVIDER_KEYS.forEach((k, i) => {
    const p = mailer.PROVIDERS[k];
    console.log('    ' + (i + 1) + ') ' + p.name + C.dim + (p.host ? '  ' + p.host + ':' + p.port : '') + C.reset);
  });
  const pickRaw = await ask('  输入序号', { default: '1' });
  const pickIdx = Math.min(Math.max(parseInt(pickRaw, 10) || 1, 1), PROVIDER_KEYS.length) - 1;
  const providerKey = PROVIDER_KEYS[pickIdx];
  let provider = mailer.PROVIDERS[providerKey];
  console.log('  ' + C.green + '✓' + C.reset + ' 已选择：' + provider.name);
  if (provider.hint) console.log('    ' + C.dim + '授权码怎么拿：' + provider.hint + C.reset);
  console.log('');

  let host = provider.host || oldSmtp.host || '';
  let port = provider.port || Number(oldSmtp.port) || 465;
  let secure = provider.secure;
  if (providerKey === 'custom') {
    host = await ask('  SMTP 服务器地址', { default: host || '' });
    port = Number(await ask('  端口', { default: String(port) })) || 465;
    const sec = await ask('  使用 SSL/TLS 直连？(465 端口填 y，587 端口填 n)', { default: secure ? 'y' : 'n' });
    secure = String(sec).toLowerCase().indexOf('n') !== 0;
  }

  const user = await ask('  发件邮箱地址', { default: oldSmtp.user || '' });
  if (!user) { console.log(C.red + '\n  没有填写发件邮箱，已取消。' + C.reset + '\n'); process.exit(1); }
  const pass = await ask('  邮箱授权码', { secret: true, default: oldSmtp.pass || '' });
  if (!pass) { console.log(C.red + '\n  没有填写授权码，已取消。' + C.reset + '\n'); process.exit(1); }

  const isLoopback = mailer.isLoopbackHost(host);
  const config = {
    smtp: {
      host: host, port: port, secure: secure,
      user: user, pass: pass, from: user,
      fromName: (existing && existing.smtp && existing.smtp.fromName) || 'PinDa 校园互助平台'
    },
    allowedDomains: (existing && existing.allowedDomains) || ['student.xjtlu.edu.cn', 'xjtlu.edu.cn'],
    codeTtlMinutes: (existing && existing.codeTtlMinutes) || 10,
    resendSeconds: (existing && existing.resendSeconds) || 60,
    dailyPerEmail: (existing && existing.dailyPerEmail) || 10,
    hourlyPerIp: (existing && existing.hourlyPerIp) || 30,
    maxAttempts: (existing && existing.maxAttempts) || 5
  };
  if (isLoopback) config.smtp.plaintext = true;   // 本机调试用
  mailer.saveConfig(config);
  console.log('\n  ' + C.green + '✓' + C.reset + ' 已写入 config.json');
  console.log('    ' + C.dim + '发件邮箱 ' + user + ' · 服务器 ' + host + ':' + port +
    '（' + (secure ? 'SSL/TLS' : 'STARTTLS') + '）· 授权码 ' + '*'.repeat(Math.min(String(pass).length, 12)) + C.reset);
  line();

  const to = await ask('  测试邮件发到哪个邮箱', { default: user });
  console.log('\n  正在连接 ' + host + ':' + port + ' 并发送测试邮件…\n');
  const cfg = mailer.normalizeConfig(config);
  const res = await mailer.deliver(cfg, {
    to: to, subject: '【PinDa】邮箱配置测试', html: mailer.testEmail(cfg)
  });

  if (res.ok) {
    console.log('  ' + C.green + C.bold + '🎉 发送成功！' + C.reset);
    console.log('  测试邮件已发往 ' + to + '，去收件箱看看（第一次可能在垃圾邮件里）。');
    console.log('');
    console.log('  接下来：' + C.bold + '双击「启动本地预览.cmd」' + C.reset + '，');
    console.log('  启动后窗口里出现「邮箱验证码：真实发送」就说明已经生效了。');
  } else {
    console.log('  ' + C.red + C.bold + '✗ 发送失败（出错环节：' + res.stage + '）' + C.reset);
    console.log('  ' + C.dim + res.error + C.reset);
    const hint = mailer.diagnose(res, cfg);
    if (hint) console.log('\n  ' + C.gold + '怎么办：' + C.reset + hint);
    console.log('\n  改好后' + C.bold + '再双击一次「配置邮箱.cmd」' + C.reset + '即可重新填写。');
  }
  line();
  console.log('');
  process.exit(res.ok ? 0 : 2);
}

main().catch((e) => {
  console.error('\n  向导运行出错：' + e.message + '\n');
  process.exit(1);
});
