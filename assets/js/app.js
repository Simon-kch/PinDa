/* ==========================================================================
   PinDa · 路由与业务动作
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  var app = document.getElementById('app');
  var pendingFocus = null;

  /* ====================== 路由 ====================== */
  var HOME = '/app';
  /* 星图只挂在首页首屏那块黑底上（hero 内自带 canvas） */
  var skyCtl = null;
  function syncSky() {
    if (skyCtl) { try { skyCtl.destroy(); } catch (e) { } skyCtl = null; }
    var canvas = document.getElementById('sky-hero');
    if (!canvas || !V.skymap) return;
    skyCtl = V.skymap.mount(canvas, {});
  }
  var GUARDED = { '/app': 1, '/pinpin': 1, '/daidai': 1, '/deals': 1, '/orders': 1, '/wallet': 1, '/messages': 1, '/me': 1, '/admin': 1 };
  var NAV = [
    ['/app', '工作台'], ['/pinpin', '拼拼'], ['/daidai', '代代'], ['/deals', '优惠'],
    ['/orders', '订单'], ['/wallet', '钱包'], ['/member', '会员'], ['/messages', '消息'], ['/me', '个人中心']
  ];

  function route() {
    var h = (location.hash || '').replace(/^#/, '').split('?')[0];
    if (!h) return '/';
    if (h.charAt(0) !== '/') h = '/' + h;
    return h;
  }

  function appShell(html, active) {
    var me = V.me();
    var unread = V.unreadCount(me.id);
    var nav = NAV.map(function (n) {
      var label = n[1] + (n[0] === '/messages' && unread ? '<span class="dot"></span>' : '');
      return '<a href="#' + n[0] + '" class="' + (active === n[0] ? 'on' : '') + '">' + label + '</a>';
    }).join('');
    if (me.role === 'admin') nav += '<a href="#/admin" class="' + (active === '/admin' ? 'on' : '') + '">管理台</a>';
    return '<header class="topbar"><div class="wrap topbar-in">' +
        V.views.brand() + '<nav class="nav">' + nav + '</nav>' +
        '<div class="topbar-right">' +
          V.i18n.button() +
          '<a class="btn ghost sm" href="#/messages">🔔' + (unread ? ' ' + unread : '') + '</a>' +
          '<a class="user-chip" href="#/me">' + U.avatar(me) +
            '<span class="who"><b>' + U.esc(me.nickname) + '</b>' +
            '<span>' + (V.isPro(me) ? '👑 会员 · 佣金 ' + U.pct(V.rateFor(me)) : '普通用户 · 佣金 ' + U.pct(V.rateFor(me))) + '</span></span></a>' +
          '<button class="btn outline sm" data-action="logout">退出</button>' +
        '</div>' +
      '</div></header>' +
      '<main id="main" class="main">' + html + '</main>' +
      '<footer class="footer"><div class="wrap between tiny" style="flex-wrap:wrap;gap:10px">' +
        '<span>© ' + new Date().getFullYear() + ' PinDa · 跨校园师生互助平台（演示）</span>' +
        '<span><a href="#/help">平台规则</a> · <a href="#/member">会员权益</a> · 佣金 ' + U.pct(V.s().commissionFree) + ' 起</span>' +
      '</div></footer>';
  }

  function render() {
    var r = route(), me = V.me(), html, active = r;
    if (GUARDED[r] && !me) {
      location.replace('#/login');
      return;
    }
    switch (r) {
      case '/login': html = V.views.login(); break;
      case '/register': html = V.views.register(); break;
      case '/help': html = V.views.help(!!me); break;
      case '/pinpin-intro': html = V.views.intro('pinpin'); break;
      case '/daidai-intro': html = V.views.intro('daidai'); break;
      case '/member': html = me ? appShell(V.views.member(), '/member') : V.views.publicTop('member') + '<main id="main" class="main">' + V.views.member() + '</main>' + V.views.publicFooter(); break;
      case '/app': html = appShell(V.views.home(), '/app'); break;
      case '/pinpin': html = appShell(V.views.pinpin(), '/pinpin'); break;
      case '/daidai': html = appShell(V.views.daidai(), '/daidai'); break;
      case '/deals': html = appShell(V.views.deals(), '/deals'); break;
      case '/orders': html = appShell(V.views.orders(), '/orders'); break;
      case '/wallet': html = appShell(V.views.wallet(), '/wallet'); break;
      case '/messages': html = appShell(V.views.messages(), '/messages'); break;
      case '/me': html = appShell(V.views.profile(), '/me'); break;
      case '/admin': html = appShell(V.views.admin(), '/admin'); break;
      default: html = V.views.landing(); active = '';
    }
    app.innerHTML = html;
    V.i18n.apply(app);
    syncSky();
    if (pendingFocus) {
      var el = document.getElementById(pendingFocus);
      if (el) { el.focus(); if (el.setSelectionRange && el.value) { var n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) { } } }
      pendingFocus = null;
    }
    if (V.state && V.state.prevRoute !== r) window.scrollTo(0, 0);
    V.state = V.state || {};
    V.state.prevRoute = r;
  }
  V.render = render;

  /* ====================== 业务动作 ====================== */
  function loginForm() { return document.querySelector('[data-form="login"]'); }
  function registerForm() { return document.querySelector('[data-form="register"]'); }
  function setBusy(el, on, text) {
    if (!el) return;
    if (el.dataset) el.dataset.busy = on ? '1' : '0';
    if (el.classList && el.classList.toggle) el.classList.toggle('is-disabled', !!on);
    if (text != null) el.textContent = text;
  }

  /* 师生身份核验：学号 + 校园邮箱验证码（不涉及学校统一身份密码） */
  function verifyFromForm(form, emailSel, codeSel) {
    var sid = (form.studentId ? form.studentId.value : '').trim();
    var email = (form.schoolEmail ? form.schoolEmail.value : '').trim().toLowerCase();
    var code = (form[codeSel] ? form[codeSel].value : '').trim();
    if (!V.studentIdValid(sid)) return { err: '请填写 6–12 位学号' };
    if (!V.isSchoolEmail(email)) return { err: '请填写校园邮箱（支持 .edu.cn / .edu）' };
    if (V.emailTaken(email) && email !== String((V.me() || {}).schoolEmail || '').toLowerCase()) return { err: '该邮箱已被其他账号使用' };
    if (!code) return { err: '请填写邮箱收到的验证码' };
    var res = V.checkCode(email, code);
    if (res === 'wrong') return { err: '验证码不正确' };
    if (res === 'expired') return { err: '验证码已过期，请重新发送' };
    if (res === 'empty') return { err: '请先点击「发送验证码」' };
    return { sid: sid, email: email };
  }

  function requireLogin() {
    if (!V.me()) { U.toast('请先登录', 'warn'); location.hash = '#/login'; return false; }
    return true;
  }
  function openPinpin(id) {
    var post = V.findPinpin(id);
    if (!post) return U.toast('信息不存在', 'bad');
    var d = V.views.detailPinpin(post);
    U.modal({ title: '拼拼详情', sub: post.title, size: 'wide', body: d.body, foot: d.foot });
  }
  function openDaidai(id) {
    var post = V.findDaidai(id);
    if (!post) return U.toast('信息不存在', 'bad');
    var d = V.views.detailDaidai(post);
    U.modal({ title: '代代详情', sub: post.title, size: 'wide', body: d.body, foot: d.foot });
  }
  function openOrder(id) {
    var order = V.db.orders.filter(function (o) { return o.id === id; })[0];
    if (!order) return U.toast('订单不存在', 'bad');
    var d = V.views.orderDetail(order);
    U.modal({ title: '订单详情', sub: order.no, size: 'wide', body: d.body, foot: d.foot });
  }

  function createOrder(o) {
    var seller = V.user(o.sellerId);
    var ctx = o.context || (o.refType === 'pinpin' ? 'groupbuy' : 'daidai');
    var q = V.feeFor(ctx, seller, o.amount);
    var order = {
      id: V.uid('o'), no: V.orderNo(), refType: o.refType, refId: o.refId, title: o.title,
      buyerId: o.buyerId, sellerId: o.sellerId, amount: V.round2(o.amount),
      context: ctx, feeMode: q.mode, feeLabel: q.label,
      rate: q.rate, commission: q.commission, net: q.net, status: o.status || 'processing',
      createdAt: new Date().toISOString(),
      timeline: [{ at: new Date().toISOString(), text: o.note || '订单创建' }]
    };
    V.db.orders.unshift(order);
    return order;
  }
  function step(order, text) {
    order.timeline = order.timeline || [];
    order.timeline.push({ at: new Date().toISOString(), text: text });
  }
  function canPost() {
    var me = V.me();
    if (V.postsLeft(me) <= 0) {
      U.toast('今日发布额度已用完，开通会员可提升到 ' + V.s().dailyPostPro + ' 条', 'warn');
      return false;
    }
    return true;
  }
  function upsell(text) {
    U.modal({
      title: '👑 这是会员特权',
      size: 'narrow',
      body: '<div class="center" style="font-size:34px">👑</div>' +
        '<p class="center mt-8">' + text + '</p>' +
        '<div class="table-wrap mt-16"><table class="tb" style="min-width:auto"><tbody>' +
        '<tr><td>成交佣金</td><td>' + U.pct(V.s().commissionFree) + ' → <b>' + U.pct(V.s().commissionPro) + '</b></td></tr>' +
        '<tr><td>查看联系方式</td><td>' + V.s().contactFreeDaily + ' 次/日 → <b>不限次</b></td></tr>' +
        '<tr><td>每日发布</td><td>' + V.s().dailyPostFree + ' 条 → <b>' + V.s().dailyPostPro + ' 条</b></td></tr>' +
        '<tr><td>信息展示</td><td><b>优先展示 + 会员标识</b></td></tr>' +
        '</tbody></table></div>',
      foot: '<button class="btn outline" data-action="modal-close">以后再说</button>' +
        '<button class="btn gold" data-action="member-buy" data-plan="term">开通学期卡 ' + U.money(V.s().priceTerm) + '</button>'
    });
  }

  var ACTIONS = {
    'modal-close': function () { U.closeModal(); },
    'lang-toggle': function () {
      V.i18n.toggle();
      U.closeModal();
      render();
    },
    'auth-mode': function (el) {
      var mode = el.dataset.value || 'phone';
      var form = (el.closest && el.closest('form')) || loginForm();
      if (!form) return;
      var hidden = form.querySelector('input[name="mode"]');
      if (hidden) hidden.value = mode;
      var seg = el.closest ? el.closest('.seg') : null;
      if (seg) Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) { b.classList.remove('on'); });
      if (el.classList) el.classList.add('on');
      Array.prototype.forEach.call(form.querySelectorAll('[data-auth]'), function (box) {
        box.classList.toggle('hide', box.dataset.auth !== mode);
      });
    },
    'send-code': function (el) {
      var form = (el.closest && el.closest('form')) || registerForm() || document.querySelector('[data-form="verify"]');
      if (!form) return;
      var sid = form.studentId ? form.studentId.value.trim() : '';
      var email = form.schoolEmail ? form.schoolEmail.value.trim().toLowerCase() : '';
      if (!V.studentIdValid(sid)) return U.toast('请先填写 6–12 位学号', 'warn');
      if (!V.isSchoolEmail(email)) return U.toast('请填写校园邮箱，例如 xxx@xxx.edu.cn', 'warn');
      if (V.emailTaken(email) && email !== String((V.me() || {}).schoolEmail || '').toLowerCase()) {
        return U.toast('该邮箱已被注册，请直接登录', 'bad');
      }
      var note = form.querySelector('[data-code-note]');
      if (el && el.dataset && el.dataset.busy === '1') return;
      var oldText = el ? el.textContent : '';
      setBusy(el, true, '发送中…');

      function countdown(sec) {
        if (!el) return;
        var left = sec;
        var timer = setInterval(function () {
          left--;
          if (left <= 0) {
            clearInterval(timer);
            setBusy(el, false, oldText || '重新发送');
          } else {
            setBusy(el, true, left + ' 秒后重发');
          }
        }, 1000);
      }

      V.api.sendCode(email).then(function (res) {
        if (!res || !res.ok) {
          setBusy(el, false, oldText || '发送验证码');
          var msg = (res && res.error) || '发送失败，请稍后再试';
          if (note) { note.classList.remove('hint'); note.innerHTML = '<b style="color:var(--danger)">' + U.esc(msg) + '</b>'; }
          U.toast(msg, 'bad');
          return;
        }
        if (note) {
          note.classList.remove('hint');
          if (res.delivered) {
            note.innerHTML = '✅ 验证码已发送到 <b>' + U.esc(email) + '</b>，' + (res.ttlMinutes || 10) +
              ' 分钟内有效。没收到请查看垃圾邮件，或稍后重新发送。';
          } else {
            note.innerHTML = '⚠️ 未配置邮箱服务（演示模式）：本次验证码为 <b style="color:var(--brand-700)">' +
              U.esc(res.demoCode || '') + '</b>，' + (res.ttlMinutes || 10) + ' 分钟内有效。' +
              '配置 SMTP 后验证码会真实发送到你的学校邮箱。';
          }
        }
        U.toast(res.delivered ? '验证码已发送到 ' + email : '演示模式：验证码已生成', res.delivered ? 'ok' : 'warn');
        countdown(res.resendSeconds || V.api.resendSeconds || 60);
      });
    },
    'verify-student': function () {
      if (!requireLogin()) return;
      var me = V.me();
      U.modal({
        title: '学生身份认证', size: 'narrow',
        sub: '仅需学号 + 校园邮箱，不涉及学校统一身份密码',
        body: '<form data-form="verify">' +
          '<div class="field"><label>学号</label><input class="input" name="studentId" value="' + U.esc(me.studentId || '') + '" placeholder="例如 2024128731"></div>' +
          '<div class="field mt-12"><label>校园邮箱</label><input class="input" name="schoolEmail" value="' + U.esc(me.schoolEmail || '') + '" placeholder="xxx@xxx.edu.cn"></div>' +
          '<div class="field mt-12"><label>邮箱验证码</label>' +
            '<div class="row" style="gap:8px"><input class="input" name="code" placeholder="6 位验证码" inputmode="numeric">' +
            '<button class="btn outline" type="button" data-action="send-code" style="flex:none">发送验证码</button></div>' +
            '<span class="hint" data-code-note>' + (V.api.mail
              ? '验证码会发送到该邮箱，认证后主页显示「已认证」'
              : '点「发送验证码」后验证码会显示在这里（本地演示模式）') + '</span></div>' +
          '<div class="notice mt-12">PinDa 只保存你的学号与校园邮箱用于身份核验，永远不会索要学校统一身份密码。</div>' +
          '</form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="verify-submit">完成认证</button>'
      });
    },
    'verify-submit': function () {
      var form = document.querySelector('[data-form="verify"]');
      if (!form) return;
      var r = verifyFromForm(form, 'schoolEmail', 'code');
      if (r.err) return U.toast(r.err, 'warn');
      var me = V.me();
      V.verifyStudent(me, r.sid, r.email);
      V.notify(me.id, '学生认证通过 ✅', '学号 ' + r.sid + ' 已完成邮箱验证，主页已展示「已认证」标识。', '#/me');
      V.save(); U.closeModal(); U.toast('认证成功，已获得「已认证」标识', 'ok'); render();
    },
    'why-no-ebridge': function () {
      U.modal({
        title: '为什么不用学校账号直接登录？',
        sub: '这是一个安全与合规问题，不是技术偷懒',
        body:
          '<div class="col" style="gap:12px">' +
          '<div class="notice warn">⚠️ 任何第三方平台（包括 PinDa）要你输入学校统一身份账号密码，都应该高度警惕——这正是钓鱼网站的典型特征。</div>' +
          '<div><b class="small">1. 学校没有开放第三方登录接口</b>' +
            '<p class="small muted mt-8">多数高校的统一身份系统（如西浦 e-Bridge）未提供官方 OAuth / OIDC 授权，任何"帮你去登录"的实现都需要平台经手你的密码，属于凭据代持。</p></div>' +
          '<div><b class="small">2. 风险落在同学身上</b>' +
            '<p class="small muted mt-8">密码一旦离开学校页面，就可能被记录、泄露或被滥用；未授权访问学校系统还可能触及《网络安全法》《刑法》285 条以及学校 IT 使用规范。</p></div>' +
          '<div><b class="small">3. PinDa 的做法</b>' +
            '<p class="small muted mt-8">用「学号 + 校园邮箱验证码」核验在校身份：平台只拿到学号与邮箱，密码始终只属于你自己。这也是多数校园平台的通行做法。</p></div>' +
          '<div><b class="small">4. 想要真正的一键登录？</b>' +
            '<p class="small muted mt-8">路径是向你所在学校的 IT / 学生事务申请官方 SSO 授权：用户跳转到学校官方页面完成登录，学校回传学号与邮箱，PinDa 全程接触不到密码。代码里已预留对接位置，拿到授权即可切换。</p></div>' +
          '</div>',
        foot: '<button class="btn primary" data-action="modal-close">我了解了</button>'
      });
    },
    'quick-login': function (el) {
      var u = V.user(el.dataset.user);
      if (!u) return;
      V.login(u.id); V.save();
      U.toast('欢迎回来，' + u.nickname, 'ok');
      U.closeModal();
      location.hash = '#/app';
      if (route() === HOME) render();
    },
    'logout': function () {
      V.logout(); V.save(); U.closeModal();
      U.toast('已退出登录');
      location.hash = '#/';
      render();
    },
    'forgot': function () {
      U.modal({
        title: '找回密码', size: 'narrow',
        body: '<div class="notice">演示环境不发送短信。请直接使用演示账号登录，或重新注册一个账号。</div>' +
          '<div class="col mt-16" style="gap:10px">' +
          ['u_lin', 'u_wang', 'u_admin'].map(function (id) {
            var u = V.user(id);
            return '<button class="btn outline block" data-action="quick-login" data-user="' + id + '">' + u.avatar + ' ' + u.nickname + '（' + u.phone + '）</button>';
          }).join('') + '</div>'
      });
    },

    /* ---------- 拼拼 ---------- */
    'pp-new': function () {
      if (!requireLogin()) return;
      if (!canPost()) return upsell('开通会员可把每日发布额度提升到 ' + V.s().dailyPostPro + ' 条。');
      U.modal({
        title: '发起拼拼', sub: '拼车 / 拼单 / 找搭子', size: 'wide',
        body: V.views.formPinpin({ type: V.state.pp && V.state.pp.type !== 'all' ? V.state.pp.type : 'carpool' }),
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="pp-submit">确认发布</button>'
      });
    },
    'pp-submit': function () { submitForm(document.querySelector('[data-form="pp-create"]')); },
    'pp-open': function (el) { openPinpin(el.dataset.id); },
    'pp-type': function (el) { V.state.pp.type = el.dataset.value; render(); },
    'pp-campus': function () { },
    'pp-mine': function () { V.state.pp.mine = !V.state.pp.mine; render(); },
    'pp-pro-filter': function () {
      if (!V.isPro(V.me())) return upsell('按会员身份、信用分等高级条件筛选，是会员专属能力。');
      V.state.pp.proOnly = !V.state.pp.proOnly; render();
    },
    'pp-join': function (el) {
      var post = V.findPinpin(el.dataset.id), me = V.me();
      if (!post) return;
      if (post.status !== 'open') return U.toast('该信息已停止招募', 'warn');
      if (post.ownerId === me.id) return U.toast('这是你自己发布的', 'warn');
      if (post.joined.indexOf(me.id) >= 0) return U.toast('你已经加入过了', 'warn');
      if (post.joined.length + 1 >= post.capacity) return U.toast('人数已满，试试联系发起人', 'warn');
      post.joined.push(me.id);
      if (post.joined.length + 1 >= post.capacity) post.status = 'full';
      V.notify(post.ownerId, '有同学申请加入你的拼拼', me.nickname + ' 申请加入「' + post.title + '」，当前 ' + (post.joined.length + 1) + '/' + post.capacity + ' 人。', '#/pinpin');
      V.save(); U.toast('申请已提交，等待发起人确认', 'ok');
      render(); openPinpin(post.id);
    },
    'pp-leave': function (el) {
      var post = V.findPinpin(el.dataset.id), me = V.me();
      if (!post) return;
      post.joined = post.joined.filter(function (id) { return id !== me.id; });
      if (post.status === 'full' && post.joined.length + 1 < post.capacity) post.status = 'open';
      V.notify(post.ownerId, '有成员退出了拼拼', me.nickname + ' 退出了「' + post.title + '」。', '#/pinpin');
      V.save(); U.toast('已退出'); U.closeModal(); render();
    },
    'pp-fav': function (el) {
      var me = V.me(), id = el.dataset.id;
      me.favs = me.favs || [];
      var i = me.favs.indexOf(id);
      if (i >= 0) { me.favs.splice(i, 1); U.toast('已取消收藏'); }
      else { me.favs.push(id); U.toast('已加入收藏', 'ok'); }
      V.save(); render();
    },
    'pp-contact': function (el) {
      var me = V.me(), post = V.findPinpin(el.dataset.id);
      if (!post) return;
      if (V.isPro(me)) { U.toast('会员不限次查看：' + (post.contact || '微信：' + V.user(post.ownerId).nickname), 'ok'); return; }
      if (V.contactsLeft(me) <= 0) return upsell('你今日的 ' + V.s().contactFreeDaily + ' 次查看联系方式额度已用完。');
      V.bumpContact(me); V.save();
      U.toast('已消耗 1 次额度：' + (post.contact || '微信：' + V.user(post.ownerId).nickname), 'ok');
      render(); openPinpin(post.id);
    },
    'pp-close': function (el) {
      var post = V.findPinpin(el.dataset.id);
      if (!post) return;
      post.status = 'closed'; V.save(); U.toast('已停止招募'); U.closeModal(); render();
    },
    'pp-delete': function (el) {
      var post = V.findPinpin(el.dataset.id);
      if (!post) return;
      U.confirm({ title: '删除这条拼拼信息？', body: '删除后无法恢复，已加入的成员会收到通知。', tone: 'danger', okText: '删除' }).then(function (ok) {
        if (!ok) return;
        (post.joined || []).forEach(function (uid) {
          V.notify(uid, '拼拼信息已被删除', '你参与的「' + post.title + '」已被发起人删除。', '#/pinpin');
        });
        V.db.pinpin = V.db.pinpin.filter(function (p) { return p.id !== post.id; });
        V.save(); U.closeModal(); U.toast('已删除'); render();
      });
    },
    'pp-settle': function (el) {
      var post = V.findPinpin(el.dataset.id), me = V.me();
      if (!post) return;
      var members = (post.joined || []).filter(function (id) { return id !== me.id; });
      if (post.type === 'partner' || !post.price || !members.length) {
        post.status = 'done'; V.save(); U.closeModal(); U.toast('已结束该拼拼'); render(); return;
      }
      var total = V.round2(post.price * members.length);
      var q = V.feeFor(post.type, me, total);
      U.confirm({
        title: '成团结算',
        okText: '生成账单',
        body: '将为 ' + members.length + ' 位成员各生成一笔 ' + U.money(post.price) + ' 的订单，合计 <b>' + U.money(total) + '</b>。<br>' +
          '当前阶段（' + V.stage().name + '）' + V.CONTEXT_LABEL[post.type] + '规则：<b>' + q.label + '</b>。' +
          (q.mode === 'free' ? '<br>本单平台不收费，你到手 <b>' + U.money(total) + '</b>。'
            : '<br>平台费用 <b>' + U.money(q.commission * members.length) + '</b>，结算后你到手 <b>' + U.money(total - q.commission * members.length) + '</b>。')
      }).then(function (ok) {
        if (!ok) return;
        members.forEach(function (uid) {
          var o = createOrder({
            refType: 'pinpin', refId: post.id, title: post.title, buyerId: uid, sellerId: me.id,
            amount: post.price, context: post.type, status: 'pending', note: '拼拼成团，生成账单待支付'
          });
          V.notify(uid, '拼拼已生成账单 ' + U.money(post.price), '「' + post.title + '」已成团，请在订单页完成支付。', '#/orders');
        });
        post.status = 'done';
        V.save(); U.closeModal(); U.toast('已生成 ' + members.length + ' 笔账单', 'ok');
        location.hash = '#/orders'; render();
      });
    },

    /* ---------- 代代 ---------- */
    'dd-new': function (el) {
      if (!requireLogin()) return;
      if (!canPost()) return upsell('开通会员可把每日发布额度提升到 ' + V.s().dailyPostPro + ' 条。');
      var kind = el.dataset.kind || 'request';
      U.modal({
        title: kind === 'trip' ? '挂出行程，接受代购' : '发布代购 / 代取需求',
        sub: kind === 'trip' ? '让需要的人主动来找你' : '写清清单与预算，接单更快',
        size: 'wide',
        body: V.views.formDaidai(kind),
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="dd-submit">确认发布</button>'
      });
    },
    'dd-submit': function () { submitForm(document.querySelector('[data-form="dd-create"]')); },
    'dd-open': function (el) { openDaidai(el.dataset.id); },
    'dd-kind': function (el) { V.state.dd.kind = el.dataset.value; render(); },
    'dd-cat': function (el) { V.state.dd.cat = el.dataset.value; render(); },
    'dd-mine': function () { V.state.dd.mine = !V.state.dd.mine; render(); },
    'dd-pro-filter': function () {
      if (!V.isPro(V.me())) return upsell('只看会员发布、按信用分筛选等高级查询是会员专属能力。');
      V.state.dd.proOnly = !V.state.dd.proOnly; render();
    },
    'dd-contact': function (el) {
      var me = V.me(), post = V.findDaidai(el.dataset.id);
      if (!post) return;
      if (V.isPro(me)) { U.toast('会员不限次查看', 'ok'); render(); openDaidai(post.id); return; }
      if (V.contactsLeft(me) <= 0) return upsell('你今日的 ' + V.s().contactFreeDaily + ' 次查看联系方式额度已用完。');
      V.bumpContact(me); V.save();
      U.toast('已消耗 1 次额度', 'ok'); render(); openDaidai(post.id);
    },
    'dd-take': function (el) {
      var post = V.findDaidai(el.dataset.id), me = V.me();
      if (!post) return;
      if (post.ownerId === me.id) return U.toast('这是你自己发布的', 'warn');
      if (post.status !== 'open') return U.toast('该信息已被接单', 'warn');
      var owner = V.user(post.ownerId);
      var goods = post.budget || 200;
      var fee = post.fee > 50 ? post.fee : V.round2(goods * post.fee / 100);
      var amount = V.round2(goods + fee);
      var isTrip = post.kind === 'trip';
      var buyerId = isTrip ? me.id : post.ownerId;
      var sellerId = isTrip ? post.ownerId : me.id;
      var dq = V.feeFor('daidai', V.user(sellerId), amount);
      U.confirm({
        title: isTrip ? '确认让我帮你代购' : '确认接下这一单',
        okText: isTrip ? '提交需求' : '接单',
        body: '商品预估 <b>' + U.money(goods) + '</b> + 代购费 <b>' + U.money(fee) + '</b> = <b>' + U.money(amount) + '</b><br>' +
          '当前阶段（' + V.stage().name + '）代代订单规则：<b>' + dq.label + '</b>' +
          (dq.mode === 'free' ? '，本单平台不收费。' : '。') + '<br>' +
          '<span class="tiny">商品费用可在交付时按小票多退少补。</span>'
      }).then(function (ok) {
        if (!ok) return;
        var order = createOrder({
          refType: 'daidai', refId: post.id, title: post.title, buyerId: buyerId, sellerId: sellerId,
          amount: amount, context: 'daidai', status: 'processing',
          note: isTrip ? '下单代购：' + goods + ' 元商品 + 代购费' : '接单成功，准备采购/取件'
        });
        if (isTrip) { post.taken = (post.taken || 0) + 1; }
        else { post.status = 'taken'; post.takerId = me.id; }
        V.notify(post.ownerId === me.id ? sellerId : post.ownerId,
          isTrip ? '有同学找TA代购' : '你的需求已被接单',
          me.nickname + ' ' + (isTrip ? '提交了代购需求：' : '接下了你的需求：') + post.title, '#/orders');
        V.save(); U.closeModal(); U.toast('订单已创建，可在订单页查看进度', 'ok');
        location.hash = '#/orders'; render(); openOrder(order.id);
      });
    },
    'dd-delete': function (el) {
      var post = V.findDaidai(el.dataset.id);
      if (!post) return;
      U.confirm({ title: '删除这条代代信息？', body: '删除后无法恢复。已生成的订单不受影响。', tone: 'danger', okText: '删除' }).then(function (ok) {
        if (!ok) return;
        V.db.daidai = V.db.daidai.filter(function (p) { return p.id !== post.id; });
        V.save(); U.closeModal(); U.toast('已删除'); render();
      });
    },

    /* ---------- 增值服务：信息加曝光（收入来源 4） ---------- */
    'boost-post': function (el) {
      if (!requireLogin()) return;
      var id = el.dataset.id, me = V.me();
      var post = V.findPinpin(id) || V.findDaidai(id);
      if (!post) return;
      if (post.ownerId !== me.id) return U.toast('只能给自己的信息加曝光', 'warn');
      var price = V.s().boostPrice, hours = V.s().boostHours;
      U.pay({
        title: '信息加曝光', sub: '置顶展示 ' + hours + ' 小时', amount: price,
        note: '加曝光后，你的信息会排在列表最前，并带「⚡ 已加曝光」标识。会员本身已享优先展示，无需重复购买。',
        onSuccess: function (method) {
          post.boostUntil = new Date(Date.now() + hours * 3600000).toISOString();
          var mLabel = method === 'balance' ? '平台余额' : method === 'wechat' ? '微信支付' : '支付宝';
          V.walletPush(me.id, 'expense', -price, '信息加曝光 ' + hours + ' 小时（' + mLabel + '）：' + post.title);
          if (method === 'balance') V.addBalance(me, -price);
          V.notify(me.id, '加曝光已生效', '「' + post.title + '」将在 ' + hours + ' 小时内置顶展示。', post.type ? '#/pinpin' : '#/daidai');
          V.save(); U.closeModal(); U.toast('加曝光已生效，置顶 ' + hours + ' 小时', 'ok'); render();
        }
      });
    },
    'share-trip': function (el) {
      var post = V.findPinpin(el.dataset.id);
      if (!post) return;
      var owner = V.user(post.ownerId);
      var text = '【PinDa 拼车】' + post.title + '\n' +
        '时间：' + U.fmtDateTime(post.departAt) + ' ' + U.weekday(post.departAt) + '\n' +
        '路线：' + post.from + ' → ' + post.to + '\n' +
        '同行：' + owner.nickname + '（信用分 ' + owner.credit + (owner.verified ? '，已认证' : '') + '）\n' +
        '人均：' + U.money(post.price) + ' · 已 ' + ((post.joined || []).length + 1) + '/' + post.capacity + ' 人\n' +
        '行程来自 PinDa 校园互助平台，如需同行请通过平台联系。';
      U.modal({
        title: '把行程分享给同学或家人', sub: '出行安全提示：上车前核对车牌与同行人', size: 'narrow',
        body: '<textarea class="textarea" id="share-text" style="min-height:170px">' + U.esc(text) + '</textarea>' +
          '<div class="notice mt-12">复制后发给同学或家人，让行程有人知晓，是拼车最实用的安全习惯。</div>',
        foot: '<button class="btn outline" data-action="modal-close">关闭</button>' +
          '<button class="btn primary" data-action="copy-share">复制行程文本</button>'
      });
    },
    'copy-share': function () {
      var ta = document.getElementById('share-text');
      if (!ta) return;
      try {
        ta.select();
        if (document.execCommand) document.execCommand('copy');
        U.toast('行程已复制，发给你信任的人', 'ok');
      } catch (e) { U.toast('请手动长按复制文本', 'warn'); }
    },

    /* ---------- 校园优惠（收入来源 3） ---------- */
    'deal-cat': function (el) { V.state.dealCat = el.dataset.value; render(); },
    'coupon-claim': function (el) {
      if (!requireLogin()) return;
      var c = V.couponById(el.dataset.id), me = V.me();
      if (!c) return;
      if (V.myCoupon(me.id, c.id)) return U.toast('你已经领过这张券了', 'warn');
      if ((c.stock || 0) - (c.claimed || 0) <= 0) return U.toast('这张券已领完', 'warn');
      c.claimed = (c.claimed || 0) + 1;
      V.db.couponClaims.unshift({
        id: V.uid('cc'), couponId: c.id, userId: me.id, code: V.couponCode(),
        claimedAt: new Date().toISOString(), usedAt: null
      });
      V.notify(me.id, '优惠券领取成功 🎫', c.title + '（' + (V.merchantById(c.merchantId) || {}).name + '），到店出示券码即可核销。', '#/deals');
      V.save(); U.toast('领取成功，到店出示券码即可', 'ok'); render();
    },
    'coupon-use': function (el) {
      var claim = V.db.couponClaims.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!claim) return;
      var c = V.couponById(claim.couponId) || { title: '优惠券', used: 0 };
      claim.usedAt = new Date().toISOString();
      c.used = (c.used || 0) + 1;
      V.save(); U.toast('已核销：' + c.title, 'ok'); render();
    },

    /* ---------- 订单 ---------- */
    'order-open': function (el) { if (el.dataset.id) openOrder(el.dataset.id); },
    'order-scope': function (el) { V.state.order.scope = el.dataset.value; render(); },
    'order-mine': function (el) { V.state.order.mine = el.dataset.value; render(); },
    'order-pay': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      U.pay({
        title: '支付订单 ' + order.no, amount: order.amount, sub: order.title,
        note: '收款方 ' + (V.user(order.sellerId) || {}).nickname + ' · 平台佣金由收款方承担',
        onSuccess: function (method) {
          order.status = 'processing';
          order.paid = true;
          var mLabel = method === 'balance' ? '平台余额' : method === 'wechat' ? '微信支付' : '支付宝';
          step(order, '付款成功（' + mLabel + '），等待交付');
          V.walletPush(order.buyerId, 'expense', -order.amount, '订单 ' + order.no + ' 支付（' + mLabel + '）', order.id);
          if (method === 'balance') V.addBalance(V.user(order.buyerId), -order.amount);
          V.notify(order.sellerId, '订单已付款 ' + U.money(order.amount), '「' + order.title + '」付款完成，请按约定交付。', '#/orders');
          V.save(); render(); openOrder(order.id);
        }
      });
    },
    'order-deliver': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      var me = V.me();
      var isSeller = order.sellerId === me.id;
      order.status = 'delivered';
      step(order, isSeller ? '服务方标记已交付' : '付款方确认已收到');
      V.notify(isSeller ? order.buyerId : order.sellerId, '订单待确认', '「' + order.title + '」' + (isSeller ? '已交付，请确认完成' : '双方已确认收到'), '#/orders');
      V.save(); U.toast('状态已更新'); render(); openOrder(order.id);
    },
    'order-progress': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      U.modal({
        title: '更新进度', size: 'narrow',
        body: '<form data-form="order-step"><div class="field"><label>本次进度说明</label>' +
          '<input class="input" name="text" placeholder="例如：已在山姆完成采购，正在回校" required></div>' +
          '<input type="hidden" name="orderId" value="' + order.id + '"></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="order-step-save" data-id="' + order.id + '">保存</button>'
      });
    },
    'order-step-save': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      var form = document.querySelector('[data-form="order-step"]');
      if (!order || !form) return;
      var text = form.text.value.trim();
      if (!text) return U.toast('请填写进度说明', 'warn');
      step(order, text);
      V.notify(order.buyerId === V.me().id ? order.sellerId : order.buyerId, '订单进度更新', text, '#/orders');
      V.save(); U.closeModal(); U.toast('已更新进度', 'ok'); render(); openOrder(order.id);
    },
    'order-complete': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      var seller = V.user(order.sellerId);
      var octx = order.context || (order.refType === 'pinpin' ? 'groupbuy' : 'daidai');
      var q = V.feeFor(octx, seller, order.amount);
      U.confirm({
        title: '确认完成并结算',
        okText: '确认完成',
        body: '成交金额 <b>' + U.money(order.amount) + '</b><br>' +
          (q.mode === 'free'
            ? '平台费用 <b>免费</b>（' + V.stage().name + '：' + V.CONTEXT_LABEL[octx] + '不收费）<br>'
            : '平台费用 <b>' + U.money(q.commission) + '</b>（' + q.label + '）<br>') +
          '收款方到手 <b>' + U.money(q.net) + '</b><br><span class="tiny">确认后立即结算，不可撤销。</span>'
      }).then(function (ok) {
        if (!ok) return;
        order.rate = q.rate; order.commission = q.commission; order.net = q.net;
        order.feeMode = q.mode; order.feeLabel = q.label; order.context = octx;
        order.status = 'completed';
        order.finishedAt = new Date().toISOString();
        step(order, q.mode === 'free' ? '交易完成，本单平台不收费（' + V.stage().name + '）' : '交易完成，平台费用 ' + U.money(q.commission) + '（' + q.feeLabel + '）');
        V.addBalance(seller, q.net);
        V.walletPush(seller.id, 'income', q.net, '订单 ' + order.no + ' 到账' + (q.commission ? '（已扣平台费用 ' + U.money(q.commission) + '）' : '（本单免费）'), order.id);
        seller.deals = (seller.deals || 0) + 1;
        V.notify(seller.id, '订单已结算，' + U.money(q.net) + ' 已到账',
          '订单 ' + order.no + ' 完成，成交 ' + U.money(order.amount) + '，平台费用 ' + (q.commission ? U.money(q.commission) : '免费') + '，到账 ' + U.money(q.net) + '。', '#/wallet');
        V.notify(order.buyerId, '订单已完成', '「' + order.title + '」已完成，欢迎给服务方评价。', '#/orders');
        V.save(); U.closeModal(); U.toast('已结算 ' + U.money(q.net) + ' 给收款方', 'ok');
        render(); openOrder(order.id);
      });
    },
    'order-cancel': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      U.confirm({ title: '取消订单？', body: '已支付的款项将全额退回付款方余额，已完成订单无法取消。', tone: 'danger', okText: '取消订单', cancelText: '再想想' }).then(function (ok) {
        if (!ok) return;
        if (order.paid) { V.addBalance(V.user(order.buyerId), order.amount); V.walletPush(order.buyerId, 'topup', order.amount, '订单 ' + order.no + ' 取消退款', order.id); }
        order.status = 'cancelled';
        step(order, '订单已取消' + (order.paid ? '，款项已退回' : ''));
        V.notify(order.buyerId === V.me().id ? order.sellerId : order.buyerId, '订单已取消', '「' + order.title + '」已被取消。', '#/orders');
        V.save(); U.closeModal(); U.toast('订单已取消'); render(); openOrder(order.id);
      });
    },
    'order-invoice': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      U.modal({
        title: '佣金明细', sub: order.no, size: 'narrow',
        body: '<div class="card flat" style="background:#FAFBFE"><div class="kv">' +
          '<dt>成交金额</dt><dd>' + U.money(order.amount) + '</dd>' +
          '<dt>适用身份</dt><dd>' + (order.rate === V.s().commissionPro ? '👑 会员' : '普通用户') + '</dd>' +
          '<dt>费率</dt><dd>' + U.pct(order.rate) + '</dd>' +
          '<dt>平台佣金</dt><dd><b>' + U.money(order.commission) + '</b></dd>' +
          '<dt>到手金额</dt><dd><b>' + U.money(order.net) + '</b></dd>' +
          '</div></div>' +
          '<p class="tiny muted mt-12">若你升级为会员（费率 ' + U.pct(V.s().commissionPro) + '），本单可多得 ' +
          U.money(V.round2(order.amount * (order.rate - V.s().commissionPro))) + '。</p>',
        foot: '<button class="btn outline" data-action="modal-close">关闭</button>' +
          (V.isPro(V.me()) ? '' : '<a class="btn gold" href="#/member" data-action="modal-close">升级会员</a>')
      });
    },
    'order-help': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      step(order, '已提交客服介入申请');
      V.notify('u_admin', '订单纠纷待处理', order.no + '「' + order.title + '」申请客服介入。', '#/admin');
      V.save();
      U.toast(V.isPro(V.me()) ? '会员已优先提交，客服将在 2 小时内介入' : '客服将在 24 小时内介入', 'ok');
      render(); openOrder(order.id);
    },
    'order-review': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      if (!order) return;
      U.modal({
        title: '评价这次交易', size: 'narrow',
        body: '<form data-form="review"><input type="hidden" name="orderId" value="' + order.id + '">' +
          '<div class="field"><label>评分</label><select class="select" name="score">' +
          [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '">' + n + ' 分 ' + '★'.repeat(n) + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="field mt-12"><label>评价内容</label><textarea class="textarea" name="text" placeholder="准时吗？沟通顺畅吗？"></textarea></div></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="review-save" data-id="' + order.id + '">提交评价</button>'
      });
    },
    'review-save': function (el) {
      var order = V.db.orders.filter(function (o) { return o.id === el.dataset.id; })[0];
      var form = document.querySelector('[data-form="review"]');
      if (!order || !form) return;
      var score = Number(form.score.value);
      var target = V.user(order.sellerId === V.me().id ? order.buyerId : order.sellerId);
      if (target) {
        var deals = target.deals || 1;
        target.rating = Math.round(((target.rating * deals) + score) / (deals + 1) * 10) / 10;
        target.deals = deals + 1;
        target.credit = Math.min(100, (target.credit || 80) + (score >= 4 ? 1 : -2));
        V.notify(target.id, '你收到一条新评价', score + ' 星：' + (form.text.value.trim() || '来自 ' + V.me().nickname + ' 的评价'), '#/me');
      }
      order.reviewed = true;
      V.save(); U.closeModal(); U.toast('评价已提交', 'ok'); render(); openOrder(order.id);
    },

    /* ---------- 钱包 ---------- */
    'wallet-type': function (el) { V.state.walletType = el.dataset.value; render(); },
    'wallet-topup': function () {
      U.modal({
        title: '模拟充值', size: 'narrow',
        body: '<form data-form="topup"><div class="field"><label>充值金额（元）</label>' +
          '<input class="input" name="amount" type="number" min="1" step="1" value="100"></div>' +
          '<div class="chips mt-12">' + [50, 100, 200, 500].map(function (n) {
            return '<button type="button" class="chip" data-quick-amount="' + n + '">¥' + n + '</button>';
          }).join('') + '</div>' +
          '<div class="notice mt-12">演示环境不会产生真实支付。</div></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="topup-go">确认充值</button>'
      });
    },
    'topup-go': function () {
      var form = document.querySelector('[data-form="topup"]');
      var amount = Number(form.amount.value);
      if (!amount || amount <= 0) return U.toast('请输入有效金额', 'warn');
      V.addBalance(V.me(), amount);
      V.walletPush(V.me().id, 'topup', amount, '模拟充值（微信支付）');
      V.save(); U.closeModal(); U.toast('充值成功 ' + U.money(amount), 'ok'); render();
    },
    'wallet-withdraw': function () {
      var me = V.me();
      U.modal({
        title: '提现', size: 'narrow',
        body: '<form data-form="withdraw"><div class="field"><label>提现金额（元）</label>' +
          '<input class="input" name="amount" type="number" min="1" step="1" value="' + Math.max(1, Math.floor(me.balance)) + '">' +
          '<span class="hint">当前可用 ' + U.money(me.balance) + '，最低提现 ¥10（演示环境即时到账）</span></div></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="withdraw-go">确认提现</button>'
      });
    },
    'withdraw-go': function () {
      var form = document.querySelector('[data-form="withdraw"]');
      var amount = Number(form.amount.value);
      if (!amount || amount < 10) return U.toast('最低提现 ¥10', 'warn');
      if (amount > V.me().balance) return U.toast('余额不足', 'bad');
      V.addBalance(V.me(), -amount);
      V.walletPush(V.me().id, 'withdraw', -amount, '提现到微信零钱');
      V.save(); U.closeModal(); U.toast('提现成功 ' + U.money(amount), 'ok'); render();
    },

    /* ---------- 会员 ---------- */
    'member-buy': function (el) {
      if (!requireLogin()) return;
      var plan = el.dataset.plan || 'term';
      var s = V.s();
      var amount = plan === 'term' ? s.priceTerm : s.priceMonthly;
      var months = plan === 'term' ? s.termMonths : 1;
      var me = V.me();
      U.pay({
        title: '开通 PinDa 会员', amount: amount,
        sub: (plan === 'term' ? '学期卡 · ' + months + ' 个月' : '月卡 · 1 个月'),
        note: '开通后：佣金 ' + U.pct(s.commissionFree) + ' → ' + U.pct(s.commissionPro) + '，信息优先展示，查看联系方式不限次。',
        footNote: '会员到期后自动降为普通用户，不会自动续费。',
        onSuccess: function (method) {
          V.activateMembership(me, plan);
          if (method === 'balance') V.addBalance(me, -amount);
          V.notify(me.id, '会员开通成功', 'PinDa 会员已开通 ' + months + ' 个月（' + U.money(amount) + '），佣金费率已降至 ' + U.pct(V.s().commissionPro) + '。', '#/member');
          V.save(); U.closeModal(); render();
        }
      });
    },

    /* ---------- 消息 ---------- */
    'msg-filter': function (el) { V.state.msgFilter = el.dataset.value; render(); },
    'msg-open': function (el) {
      var m = V.db.messages.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!m) return;
      m.read = true; V.save();
      if (m.link && route() !== m.link.replace('#', '')) { U.closeModal(); location.hash = m.link; }
      render();
    },
    'msg-read-all': function () {
      V.db.messages.forEach(function (m) { if (m.userId === V.me().id) m.read = true; });
      V.save(); U.toast('已全部标为已读', 'ok'); render();
    },

    /* ---------- 个人中心 ---------- */
    'profile-pwd': function () {
      U.modal({
        title: '修改密码', size: 'narrow',
        body: '<form data-form="pwd"><div class="field"><label>新密码</label><input class="input" name="pwd" type="password" placeholder="至少 6 位"></div></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="pwd-save">保存</button>'
      });
    },
    'pwd-save': function () {
      var form = document.querySelector('[data-form="pwd"]');
      if (!form.pwd.value || form.pwd.value.length < 6) return U.toast('密码至少 6 位', 'warn');
      V.me().password = form.pwd.value; V.save();
      U.closeModal(); U.toast('密码已更新', 'ok');
    },
    'data-reset': function () {
      U.confirm({ title: '重置全部演示数据？', body: '所有账号、发布信息、订单与钱包流水都会恢复到初始状态。', tone: 'danger', okText: '重置' }).then(function (ok) {
        if (!ok) return;
        V.reset();
        U.closeModal(); U.toast('已重置演示数据');
        location.hash = '#/';
        render();
      });
    },

    /* ---------- 管理台 ---------- */
    'admin-tab': function (el) { V.state.adminTab = el.dataset.value; render(); },
    'admin-content': function (el) { V.state.adminContent = el.dataset.value; render(); },
    'admin-member': function (el) {
      var u = V.user(el.dataset.id);
      var plan = el.dataset.plan;
      if (!u) return;
      if (plan === 'cancel') {
        u.isMember = false; u.memberExpire = null;
        V.notify(u.id, '会员状态已变更', '管理员已取消你的会员身份，如有疑问请联系平台。', '#/member');
        V.save(); U.toast('已取消会员'); render(); return;
      }
      var months = plan === 'term' ? V.s().termMonths : 1;
      var amount = plan === 'term' ? V.s().priceTerm : V.s().priceMonthly;
      var now = new Date();
      var base = (u.memberExpire && new Date(u.memberExpire) > now) ? new Date(u.memberExpire) : now;
      base.setMonth(base.getMonth() + months);
      u.isMember = true; u.memberExpire = base.toISOString();
      V.db.membershipOrders.push({ id: V.uid('mo'), userId: u.id, plan: plan, months: months, amount: amount, createdAt: new Date().toISOString(), method: '管理员开通' });
      V.notify(u.id, '会员已开通', '管理员已为你开通 PinDa 会员 ' + months + ' 个月。', '#/member');
      V.save(); U.toast('已开通 ' + months + ' 个月会员', 'ok'); render();
    },
    'admin-credit': function (el) {
      var u = V.user(el.dataset.id);
      if (!u) return;
      U.modal({
        title: '调整信用分', sub: u.nickname, size: 'narrow',
        body: '<form data-form="credit"><input type="hidden" name="userId" value="' + u.id + '"><div class="field"><label>信用分（60–100）</label>' +
          '<input class="input" name="credit" type="number" min="60" max="100" value="' + u.credit + '"></div>' +
          '<div class="notice mt-12">信用分影响信息排序与用户信任度。</div></form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="credit-save" data-id="' + u.id + '">保存</button>'
      });
    },
    'credit-save': function (el) {
      var u = V.user(el.dataset.id), form = document.querySelector('[data-form="credit"]');
      var v = Number(form.credit.value);
      if (isNaN(v) || v < 0 || v > 100) return U.toast('请输入 0–100 的数值', 'warn');
      u.credit = v; V.save(); U.closeModal(); U.toast('信用分已更新为 ' + v, 'ok'); render();
    },
    'admin-view': function (el) {
      if (el.dataset.type === 'pinpin') openPinpin(el.dataset.id); else openDaidai(el.dataset.id);
    },
    'admin-remove': function (el) {
      var type = el.dataset.type, id = el.dataset.id;
      U.confirm({ title: '下线该内容？', body: '内容将被删除，发布者会收到通知。', tone: 'danger', okText: '下线' }).then(function (ok) {
        if (!ok) return;
        var post = V.findPost(type, id);
        if (post) V.notify(post.ownerId, '内容已被平台下线', '「' + post.title + '」因违反平台规则被下线。', '#/help');
        if (type === 'pinpin') V.db.pinpin = V.db.pinpin.filter(function (p) { return p.id !== id; });
        else V.db.daidai = V.db.daidai.filter(function (p) { return p.id !== id; });
        V.save(); U.closeModal(); U.toast('已下线'); render();
      });
    },
    'admin-remove-report': function (el) {
      var r = V.db.reports.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!r) return;
      r.status = 'handled';
      var post = V.findPost(r.targetType, r.targetId);
      if (post) {
        V.notify(post.ownerId, '内容已被平台下线', '「' + post.title + '」因举报核实被下线。', '#/help');
        if (r.targetType === 'pinpin') V.db.pinpin = V.db.pinpin.filter(function (p) { return p.id !== post.id; });
        else V.db.daidai = V.db.daidai.filter(function (p) { return p.id !== post.id; });
      }
      V.save(); U.toast('已处理并下线内容', 'ok'); render();
    },
    'admin-dismiss-report': function (el) {
      var r = V.db.reports.filter(function (x) { return x.id === el.dataset.id; })[0];
      if (!r) return;
      r.status = 'dismissed'; V.save(); U.toast('已忽略该举报'); render();
    },

    /* ---------- 商业化与商家推广 ---------- */
    'admin-stage': function (el) {
      var n = Number(el.dataset.value);
      var stage = V.STAGES[n];
      if (!stage) return;
      U.confirm({
        title: '切换到' + stage.name + '？',
        okText: '切换阶段',
        body: stage.goal + '<br>' +
          ['carpool', 'groupbuy', 'partner', 'collab', 'daidai'].map(function (ctx) {
            var mode = stage.rules[ctx];
            return V.CONTEXT_LABEL[ctx] + '：' + (mode === 'free' ? '免费' : mode === 'service' ? U.money(V.s().serviceFee) + '/单' : '抽佣 ' + U.pct(V.s().commissionFree)) ;
          }).join('　·　') +
          '<br><span class="tiny">切换后新生成的订单按新阶段规则计费，已完成订单不受影响。</span>'
      }).then(function (ok) {
        if (!ok) return;
        V.s().stage = n;
        V.db.users.forEach(function (u) {
          if (u.role === 'admin') V.notify(u.id, '平台已切换到' + stage.name, stage.goal + '：' + stage.focus.join('；'), '#/admin');
        });
        V.save(); U.toast('已切换到' + stage.name, 'ok'); render();
      });
    },
    'admin-merchant-new': function () {
      U.modal({
        title: '新增合作商家', sub: '校园商家推广（收入来源 3）', size: 'narrow',
        body: '<form data-form="merchant">' +
          '<div class="field"><label>商家名称 *</label><input class="input" name="name" placeholder="例如：第三空间咖啡（南校区店）"></div>' +
          '<div class="form-grid mt-12" style="gap:14px">' +
            '<div class="field"><label>图标（emoji）</label><input class="input" name="logo" value="🏪"></div>' +
            '<div class="field"><label>分类</label><input class="input" name="category" placeholder="咖啡饮品 / 夜宵烧烤 …"></div>' +
            '<div class="field"><label>所属校区 / 区域</label><select class="select" name="campus">' +
              V.s().campuses.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label>月度推广费（元）</label><input class="input" name="monthlyFee" type="number" min="0" value="' + V.s().merchantMonthly + '"></div>' +
          '</div>' +
          '<div class="field mt-12"><label>联系方式</label><input class="input" name="contact" placeholder="微信 / 电话（仅后台可见）"></div>' +
          '</form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="merchant-save">保存并上架</button>'
      });
    },
    'merchant-save': function () {
      var form = document.querySelector('[data-form="merchant"]');
      if (!form) return;
      var name = form.name.value.trim();
      if (!name) return U.toast('请填写商家名称', 'warn');
      V.db.merchants.push({
        id: V.uid('mc'), name: name, logo: form.logo.value.trim() || '🏪',
        category: form.category.value.trim() || '校园生活', campus: form.campus.value,
        monthlyFee: Math.max(0, Number(form.monthlyFee.value) || 0),
        active: true, since: new Date().toISOString(), contact: form.contact.value.trim()
      });
      V.save(); U.closeModal(); U.toast('商家已上架', 'ok'); render();
    },
    'admin-merchant-toggle': function (el) {
      var m = V.merchantById(el.dataset.id);
      if (!m) return;
      m.active = !m.active;
      V.save(); U.toast(m.active ? '已恢复推广' : '已暂停推广', 'ok'); render();
    },
    'admin-coupon-new': function () {
      U.modal({
        title: '新增优惠券', size: 'narrow',
        body: '<form data-form="coupon">' +
          '<div class="field"><label>所属商家 *</label><select class="select" name="merchantId">' +
            V.db.merchants.map(function (m) { return '<option value="' + m.id + '">' + m.logo + ' ' + U.esc(m.name) + '</option>'; }).join('') +
          '</select></div>' +
          '<div class="field mt-12"><label>券名 *</label><input class="input" name="title" placeholder="例如：咖啡满 20 减 5"></div>' +
          '<div class="form-grid mt-12" style="gap:14px">' +
            '<div class="field"><label>面值文案</label><input class="input" name="valueText" value="-¥5" placeholder="-¥5 / 8 折 / 半价"></div>' +
            '<div class="field"><label>发放库存</label><input class="input" name="stock" type="number" min="1" value="200"></div>' +
            '<div class="field"><label>有效期（天）</label><input class="input" name="days" type="number" min="1" value="30"></div>' +
          '</div>' +
          '<div class="field mt-12"><label>使用说明</label><input class="input" name="desc" placeholder="例如：堂食外带均可，不与其它优惠同享"></div>' +
          '</form>',
        foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
          '<button class="btn primary" data-action="coupon-save">保存并上架</button>'
      });
    },
    'coupon-save': function () {
      var form = document.querySelector('[data-form="coupon"]');
      if (!form) return;
      var title = form.title.value.trim();
      if (!title) return U.toast('请填写券名', 'warn');
      V.db.coupons.push({
        id: V.uid('cp'), merchantId: form.merchantId.value, title: title,
        valueText: form.valueText.value.trim() || '优惠', desc: form.desc.value.trim() || '详见门店说明',
        stock: Math.max(1, Number(form.stock.value) || 1), claimed: 0, used: 0,
        expireAt: V.iso(Math.max(1, Number(form.days.value) || 30)), active: true
      });
      V.save(); U.closeModal(); U.toast('优惠券已上架', 'ok'); render();
    },
    'admin-coupon-toggle': function (el) {
      var c = V.couponById(el.dataset.id);
      if (!c) return;
      c.active = !c.active;
      V.save(); U.toast(c.active ? '已上架' : '已下架', 'ok'); render();
    }
  };

  /* ====================== 表单处理 ====================== */
  function collect(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      // 跳过隐藏的类型区块（例如拼拼表单里未被选中的另外两类字段）
      if (el.closest && el.closest('.hide')) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    });
    return out;
  }
  function splitTags(s) {
    return String(s || '').split(/[,，\s]+/).filter(Boolean).slice(0, 6);
  }
  function fmtLocalToIso(v) {
    if (!v) return V.iso(2, 12, 0);
    var d = new Date(v);
    return isNaN(d) ? V.iso(2, 12, 0) : d.toISOString();
  }

  function submitForm(form) {
    if (!form) return U.toast('表单未找到', 'bad');
    var data = collect(form);
    var kind = form.dataset.form;
    var me = V.me();

    if (kind === 'login') {
      var mode = data.mode || 'phone';
      var u, pwd;
      if (mode === 'sid') {
        u = V.userByStudentId(data.studentId);
        pwd = data.sidPassword;
        if (!u || u.password !== pwd) return U.toast('学号或密码不正确（这里要用 PinDa 平台密码，不是学校统一身份密码）', 'bad');
      } else {
        u = V.userByPhone((data.phone || '').trim());
        pwd = data.password;
        if (!u || u.password !== pwd) return U.toast('手机号或密码不正确', 'bad');
      }
      V.login(u.id); V.save(); U.toast('欢迎回来，' + u.nickname, 'ok');
      location.hash = '#/app'; render();
      return;
    }
    if (kind === 'register') {
      var phone = (data.phone || '').trim();
      if (!/^\d{6,15}$/.test(phone)) return U.toast('请输入正确的手机号', 'bad');
      if ((data.password || '').length < 6) return U.toast('密码至少 6 位', 'bad');
      if (V.userByPhone(phone)) return U.toast('该手机号已注册，请直接登录', 'bad');
      // 学生认证（可选）：填了学号/邮箱就必须验证通过
      var sid = (data.studentId || '').trim();
      var semail = (data.schoolEmail || '').trim().toLowerCase();
      var scode = (data.code || '').trim();
      // 创建账号并进入平台
      var createAccount = function (isVerified) {
        var collegeValue = data.college === V.OTHER_MAJOR ? String(data.collegeOther || '').trim() : data.college;
        var nu = {
          id: V.uid('u'), phone: phone, password: data.password, nickname: (data.nickname || '').trim() || '同学',
          avatar: '🙂', color: '#6C4CF1', campus: data.campus, college: collegeValue || V.UNDECIDED_MAJOR, grade: data.grade,
          role: 'student', isMember: false, memberExpire: null, verified: isVerified,
          studentId: sid, schoolEmail: semail, verifiedBy: null, verifiedAt: null,
          credit: isVerified ? 88 : 80, rating: 5, deals: 0,
          balance: 0, favs: [], postCount: 0, contactCount: 0, quotaDate: V.dayKey(),
          joinedAt: new Date().toISOString(), intro: data.intro || ''
        };
        V.db.users.push(nu);
        if (isVerified) V.verifyStudent(nu, sid, semail);
        V.login(nu.id);
        V.addBalance(nu, 100);
        V.walletPush(nu.id, 'topup', 100, '新用户注册赠送体验金');
        V.notify(nu.id, '欢迎加入 PinDa 🎉', '注册成功，已赠送 ¥100 体验金。去「拼拼」或「代代」发布你的第一条信息吧。', '#/app');
        if (isVerified) V.notify(nu.id, '学生认证通过 ✅', '学号 ' + sid + ' 已完成邮箱验证，主页会展示「已认证」标识。', '#/me');
        else V.notify(nu.id, '还差一步：身份认证', '补充学号与校园邮箱验证码即可获得「已认证」标识，成交率更高。', '#/me');
        if (data.plan && data.plan !== 'free') {
          var res = V.activateMembership(nu, data.plan);
          V.notify(nu.id, '会员开通成功', 'PinDa 会员已开通 ' + res.months + ' 个月，佣金费率降至 ' + U.pct(V.s().commissionPro) + '。', '#/member');
        }
        V.save();
        U.toast((data.plan && data.plan !== 'free' ? '注册成功，会员已开通' : '注册成功，已赠送 ¥100 体验金') + (isVerified ? '，学生认证已通过' : ''), 'ok');
        location.hash = '#/app'; render();
      };

      if (!(sid || semail || scode)) { createAccount(false); return; }

      if (!V.studentIdValid(sid)) return U.toast('学号应为 6–12 位数字', 'bad');
      if (!V.isSchoolEmail(semail)) return U.toast('请输入校园邮箱，例如 xxx@xxx.edu.cn', 'bad');
      if (V.emailTaken(semail)) return U.toast('该邮箱已被注册', 'bad');
      if (V.userByStudentId(sid)) return U.toast('该学号已被注册', 'bad');
      if (!scode) return U.toast('请填写邮箱验证码，或清空学号与邮箱稍后再认证', 'warn');

      // 后端在线时：验证码由服务端校验（前端无法绕过）
      if (V.api.available) {
        V.api.verifyCode(semail, scode).then(function (r) {
          if (!r || !r.ok) return U.toast((r && r.error) || '验证码校验失败', 'bad');
          createAccount(true);
        });
        return;
      }
      // 离线演示：本地校验
      var cr = V.checkCode(semail, scode);
      if (cr !== 'ok') {
        return U.toast(cr === 'wrong' ? '验证码不正确' : cr === 'expired' ? '验证码已过期，请重新发送' : '请先点击「发送验证码」', 'bad');
      }
      createAccount(true);
      return;
    }
    if (kind === 'pp-create') {
      if (!canPost()) return;
      var type = data.type || 'carpool';
      var post = {
        id: V.uid('p'), type: type, ownerId: me.id,
        title: (data.title || '').trim(), desc: (data.desc || '').trim(),
        joined: [],
        contact: data.contact || ('微信：' + me.nickname),
        campus: data.campus, tags: splitTags(data.tags), status: 'open',
        createdAt: new Date().toISOString()
      };
      if (type === 'carpool') {
        post.from = data.pp_from; post.to = data.pp_to;
        post.departAt = fmtLocalToIso(data.pp_departAt);
        post.capacity = Math.max(2, Number(data.pp_capacity) || 4);
        post.price = Number(data.pp_price) || 0;
        post.extra = data.pp_extra || '';
      } else if (type === 'groupbuy') {
        post.store = data.gb_store; post.deadline = fmtLocalToIso(data.gb_deadline);
        post.capacity = Math.max(2, Number(data.gb_capacity) || 6);
        post.price = Number(data.gb_price) || 0;
      } else if (type === 'collab') {
        post.goal = data.cl_goal; post.deadline = fmtLocalToIso(data.cl_deadline);
        post.capacity = Math.max(2, Number(data.cl_capacity) || 3);
        post.price = Number(data.cl_price) || 0;
      } else {
        post.goal = data.pt_goal; post.deadline = fmtLocalToIso(data.pt_deadline);
        post.capacity = Math.max(2, Number(data.pt_capacity) || 3);
        post.price = Number(data.pt_price) || 0;
      }
      if (!post.title) return U.toast('请填写标题', 'warn');
      if (!post.desc) return U.toast('请填写详细说明，信息完整的帖子成交更快', 'warn');
      if (type === 'carpool' && !post.from) return U.toast('请填写出发地', 'warn');
      if (type === 'groupbuy' && !post.store) return U.toast('请填写店铺 / 平台', 'warn');
      if (type === 'collab' && !post.goal) return U.toast('请填写合作方向，例如「找 1 位会 Tableau 的同学」', 'warn');
      V.db.pinpin.unshift(post);
      V.bumpPost(me);
      V.notify(me.id, '发布成功', '「' + post.title + '」已发布' + (V.isPro(me) ? '，作为会员已优先展示。' : '，开通会员可优先展示。'), '#/pinpin');
      V.save(); U.closeModal(); U.toast('发布成功', 'ok');
      V.state.pp.type = type === V.state.pp.type ? type : V.state.pp.type;
      if (route() !== '/pinpin') location.hash = '#/pinpin'; else render();
      if (route() === '/pinpin') openPinpin(post.id);
      return;
    }
    if (kind === 'dd-create') {
      if (!canPost()) return;
      var isTrip = data.kind === 'trip';
      var dd = {
        id: V.uid('d'), kind: data.kind, category: data.category, ownerId: me.id,
        title: (data.title || '').trim(), desc: (data.desc || '').trim(),
        from: data.from, to: data.to, expectAt: fmtLocalToIso(data.expectAt),
        fee: Number(data.fee) || 0, budget: Number(data.budget) || 0,
        contact: data.contact || ('微信：' + me.nickname), tags: splitTags(data.tags),
        status: 'open', createdAt: new Date().toISOString()
      };
      if (isTrip) { dd.capacity = Number(data.capacity) || 10; dd.taken = 0; }
      if (!dd.title) return U.toast('请填写标题', 'warn');
      V.db.daidai.unshift(dd);
      V.bumpPost(me);
      V.notify(me.id, '发布成功', '「' + dd.title + '」已发布。', '#/daidai');
      V.save(); U.closeModal(); U.toast('发布成功', 'ok');
      if (route() !== '/daidai') location.hash = '#/daidai'; else render();
      return;
    }
    if (kind === 'profile') {
      me.nickname = (data.nickname || '').trim() || me.nickname;
      me.phone = (data.phone || '').trim() || me.phone;
      me.campus = data.campus; me.grade = data.grade; me.intro = data.intro;
      if (data.college === V.OTHER_MAJOR) {
        var customMajor = String(data.collegeOther || '').trim();
        if (!customMajor) return U.toast('请填写你的专业名称', 'warn');
        me.college = customMajor;
      } else {
        me.college = data.college;
      }
      if (data.avatar) me.avatar = data.avatar;
      V.save(); U.toast('资料已保存', 'ok'); render();
      return;
    }
    if (kind === 'settings') {
      var s = V.s();
      s.commissionFree = Math.max(0, Number(data.commissionFree) / 100) || 0;
      s.commissionPro = Math.max(0, Number(data.commissionPro) / 100) || 0;
      s.priceMonthly = Math.max(0, Number(data.priceMonthly)) || 0;
      s.priceTerm = Math.max(0, Number(data.priceTerm)) || 0;
      s.termMonths = Math.max(1, Number(data.termMonths)) || 4;
      s.proPeriodMinutes = Math.max(0, Number(data.proPeriodMinutes)) || 0;
      s.dailyPostFree = Math.max(0, Number(data.dailyPostFree)) || 0;
      s.dailyPostPro = Math.max(0, Number(data.dailyPostPro)) || 0;
      s.contactFreeDaily = Math.max(0, Number(data.contactFreeDaily)) || 0;
      s.proPriority = !!data.proPriority;
      V.save(); U.toast('平台设置已保存', 'ok'); render();
      return;
    }
    // 弹窗内的表单：交给对应动作处理，保证按回车也能提交
    if (kind === 'topup') return ACTIONS['topup-go']();
    if (kind === 'withdraw') return ACTIONS['withdraw-go']();
    if (kind === 'pwd') return ACTIONS['pwd-save']();
    if (kind === 'order-step') return ACTIONS['order-step-save']({ dataset: { id: (data.orderId || '') } });
    if (kind === 'review') return ACTIONS['review-save']({ dataset: { id: (data.orderId || '') } });
    if (kind === 'credit') return ACTIONS['credit-save']({ dataset: { id: (data.userId || '') } });
  }

  /* ====================== 事件绑定 ====================== */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (el) {
      var name = el.dataset.action;
      if (ACTIONS[name]) {
        if (el.tagName === 'A' && !el.getAttribute('href')) e.preventDefault();
        if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
        ACTIONS[name](el, e);
        return;
      }
    }
    var av = e.target.closest('[data-avatar]');
    if (av) {
      var wrap = av.closest('.chips');
      if (wrap) Array.prototype.forEach.call(wrap.querySelectorAll('[data-avatar]'), function (c) { c.classList.remove('on'); });
      av.classList.add('on');
      return;
    }
    var rt = e.target.closest('[data-route-from]');
    if (rt) {
      var rf = rt.closest('form');
      if (rf) {
        var fromEl = rf.querySelector('input[name="pp_from"]'), toEl = rf.querySelector('input[name="pp_to"]');
        if (fromEl) fromEl.value = rt.dataset.routeFrom;
        if (toEl) toEl.value = rt.dataset.routeTo;
        U.toast('已填入线路：' + rt.dataset.routeFrom + ' → ' + rt.dataset.routeTo, 'ok');
      }
      return;
    }
    var ppType = e.target.closest('[data-pp-type]');
    if (ppType) {
      var form = ppType.closest('form');
      if (form) {
        var wrap2 = ppType.closest('.chips');
        Array.prototype.forEach.call(wrap2.querySelectorAll('[data-pp-type]'), function (c) { c.classList.remove('on'); });
        ppType.classList.add('on');
        var val = ppType.dataset.ppType;
        Array.prototype.forEach.call(form.querySelectorAll('.pp-only'), function (box) {
          box.classList.toggle('hide', box.dataset.for !== val);
        });
        var radio = ppType.querySelector('input[type=radio]');
        if (radio) radio.checked = true;
      }
      return;
    }
    var plan = e.target.closest('[data-plan-card]');
    if (plan) {
      var grid = plan.parentNode;
      Array.prototype.forEach.call(grid.querySelectorAll('[data-plan-card]'), function (c) { c.classList.remove('on'); });
      plan.classList.add('on');
      var r = plan.querySelector('input[type=radio]');
      if (r) r.checked = true;
      return;
    }
    var qa = e.target.closest('[data-quick-amount]');
    if (qa) {
      var f = document.querySelector('[data-form="topup"]');
      if (f) f.amount.value = qa.dataset.quickAmount;
      return;
    }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.dataset && form.dataset.form) {
      e.preventDefault();
      try { submitForm(form); } catch (err) { U.toast('操作失败：' + err.message, 'bad'); }
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.filter) return;
    var f = el.dataset.filter;
    if (f === 'pp-q') { V.state.pp.q = el.value; pendingFocus = 'pp-q'; render(); }
    if (f === 'dd-q') { V.state.dd.q = el.value; pendingFocus = 'dd-q'; render(); }
  }, true);

  document.addEventListener('change', function (e) {
    var el = e.target;
    /* 「其它专业」：选中后显示手填输入框 */
    if (el.matches && el.matches('[data-major-select]')) {
      var mf = el.closest('form');
      var other = mf && mf.querySelector('[data-other-major-input]');
      if (other) {
        var isOther = el.value === V.OTHER_MAJOR;
        other.classList.toggle('hide', !isOther);
        if (isOther) other.focus();
      }
      return;
    }
    if (!el.dataset || !el.dataset.filter) return;
    if (el.dataset.filter === 'pp-campus') { V.state.pp.campus = el.value; render(); }
    if (el.dataset.filter === 'pp-credit' || el.dataset.filter === 'dd-credit') {
      var isPP = el.dataset.filter === 'pp-credit';
      var target = isPP ? V.state.pp : V.state.dd;
      if (!V.isPro(V.me())) {
        target.credit = 0;
        el.value = '0';
        upsell('按信用分精准筛选，是会员专属的高级查询能力。');
        return;
      }
      target.credit = Number(el.value) || 0;
      render();
    }
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') U.closeModal();
  });
  window.addEventListener('hashchange', render);

  /* ====================== 启动 ====================== */
  V.load();
  V.i18n.load();
  V.i18n.setLang(V.i18n.lang);
  if (!location.hash) location.replace('#/');
  render();

  // 探测后端：有服务器且已配置 SMTP 时，验证码会真实发送到邮箱
  V.api.probe().then(function (api) {
    if (api.available) render();
  });

  // 会员中心「算一算能省多少」实时计算
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'calc-amount') {
      var out = document.getElementById('calc-out');
      if (out) out.innerHTML = V.calcBox(Number(e.target.value) || 0);
    }
  });

  // 供自动化测试使用（不影响页面功能）
  V._test = { actions: ACTIONS, submitForm: submitForm, collect: collect, render: render };
})();
