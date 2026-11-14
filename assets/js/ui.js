/* ==========================================================================
   PinDa · UI 组件与工具
   ========================================================================== */
(function () {
  var V = (window.Vega = window.Vega || {});
  var U = (V.ui = V.ui || {});

  /* ---------------- 文本 / 格式化 ---------------- */
  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  U.money = function (n) {
    var v = Math.round((Number(n) || 0) * 100) / 100;
    return '¥' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
  };
  U.num = function (n) { return Number(n || 0).toLocaleString('zh-CN'); };
  U.pct = function (r) { return (Math.round((Number(r) || 0) * 1000) / 10) + '%'; };
  U.pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  U.fmtDateTime = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (V.i18n && V.i18n.lang === 'en') {
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };
  U.fmtDate = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
  };
  U.fmtTime = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };
  U.weekday = function (iso) {
    if (V.i18n && V.i18n.lang === 'en') {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso).getDay()];
    }
    var w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return w[new Date(iso).getDay()];
  };
  U.timeAgo = function (iso) {
    if (!iso) return '';
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
    return U.fmtDate(iso);
  };
  U.countdown = function (iso) {
    if (!iso) return '';
    var ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return '已截止';
    var h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) return '剩 ' + Math.floor(h / 24) + ' 天 ' + (h % 24) + ' 小时';
    return '剩 ' + h + ' 小时 ' + m + ' 分';
  };
  U.yuan = function (n) { return Math.round((Number(n) || 0) * 100) / 100; };

  /* ---------------- 用户展示 ---------------- */
  /* PinDa 标识：拱门 + 圆环 + 四芒星（对齐品牌海报） */
  U.logoMark = function (size, tone) {
    var s = size || 30;
    var c = tone === 'cream' ? '#FBF7EF' : '#C6A15B';
    return '<svg class="logo-mark" width="' + s + '" height="' + Math.round(s * 0.66) + '" viewBox="0 0 120 79" fill="none" aria-hidden="true">' +
      '<path d="M12 70 A48 48 0 0 1 108 70" stroke="' + c + '" stroke-width="4.4" stroke-linecap="round"/>' +
      '<path d="M2 70 H118" stroke="' + c + '" stroke-width="4.4" stroke-linecap="round"/>' +
      '<circle cx="60" cy="46" r="18.5" stroke="' + c + '" stroke-width="2.6"/>' +
      '<path d="M60 29.5 L63.4 42.6 L76.5 46 L63.4 49.4 L60 62.5 L56.6 49.4 L43.5 46 L56.6 42.6 Z" fill="' + c + '"/>' +
      '</svg>';
  };
  U.logoLockup = function (opts) {
    opts = opts || {};
    var onDark = opts.tone === 'cream';   // 深色底上用米白字，浅色底上用墨色字
    var box = opts.box || 44;
    return '<span class="logo-lockup">' +
      '<span class="brand-mark" style="width:' + box + 'px;height:' + box + 'px">' +
        U.logoMark(Math.round(box * 0.68), 'gold') + '</span>' +
      '<span class="tags">' +
        '<span class="brand-name" style="' + (onDark ? 'color:#FBF7EF;' : '') + 'font-size:' + (opts.size || 20) + 'px">PinDa</span>' +
        '<span class="brand-sub">UNDER THE FIRMAMENT</span>' +
      '</span>' +
    '</span>';
  };

  U.avatar = function (user, size) {
    if (!user) user = { avatar: '👤', color: '#9AA0B4', nickname: '已注销' };
    var cls = 'avatar' + (size ? ' ' + size : '');
    var crown = V.isPro(user) ? '<span class="crown" title="PinDa 会员">👑</span>' : '';
    return '<span class="avatar-wrap"><span class="' + cls + '" style="background:' + U.esc(user.color || '#EDEFF7') + '22;color:' + U.esc(user.color || '#6B7385') + '">' +
      U.esc(user.avatar || '🙂') + '</span>' + crown + '</span>';
  };
  U.proBadge = function (user) {
    return V.isPro(user) ? '<span class="badge pro">👑 PinDa 会员</span>' : '<span class="badge">普通用户</span>';
  };
  U.userLine = function (user, opts) {
    opts = opts || {};
    if (!user) return '';
    return U.avatar(user) +
      '<div class="grow"><div class="row" style="gap:6px"><b>' + U.esc(user.nickname) + '</b>' +
      (V.isPro(user) ? '<span class="badge pro">会员</span>' : '') +
      (user.verified ? '<span class="badge ok">已认证</span>' : '') +
      '</div><div class="tiny muted">' + U.esc(user.campus || '') +
      ' · 信用 ' + (user.credit || 0) + ' · ' + (user.rating || 0).toFixed(1) + ' 分 · 成交 ' + (user.deals || 0) + ' 单</div></div>' +
      (opts.extra || '');
  };
  U.stars = function (score) {
    var full = Math.round(Number(score) || 0);
    var s = '';
    for (var i = 0; i < 5; i++) s += i < full ? '★' : '☆';
    return '<span style="color:#E3B84A;letter-spacing:1px">' + s + '</span>';
  };

  /* ---------------- 业务标签 ---------------- */
  U.PP_META = {
    carpool: { icon: '🚗', label: '拼车出行', color: '#B98A3C', sub: '上下课 / 机场 / 周边游' },
    groupbuy: { icon: '🛒', label: '拼单购物', color: '#C98A16', sub: '团购 / 省钱 / 更划算' },
    partner: { icon: '👥', label: '找搭子', color: '#A2762E', sub: '学习 / 运动 / 生活' },
    collab: { icon: '🤝', label: '合作机会', color: '#8A6224', sub: '项目 / 资源 / 互助' }
  };
  U.DD_STATUS = {
    open: { label: '待接单', cls: 'brand' },
    taken: { label: '已接单', cls: 'info' },
    delivering: { label: '进行中', cls: 'warn' },
    delivered: { label: '已送达', cls: 'info' },
    completed: { label: '已完成', cls: 'ok' },
    cancelled: { label: '已取消', cls: '' },
    closed: { label: '已关闭', cls: '' }
  };
  U.ORDER_STATUS = {
    pending: { label: '待支付', cls: 'warn' },
    processing: { label: '进行中', cls: 'info' },
    delivered: { label: '待确认', cls: 'brand' },
    completed: { label: '已完成', cls: 'ok' },
    cancelled: { label: '已取消', cls: '' }
  };
  U.statusTag = function (map, key) {
    var m = map[key] || { label: key, cls: '' };
    return '<span class="badge ' + m.cls + '">' + m.label + '</span>';
  };
  U.ddIcon = function (post) {
    if (post.category && V.CAT_LABEL[post.category]) return V.CAT_LABEL[post.category];
    return post.kind === 'trip' ? '🧳' : '🎯';
  };
  U.isBoosted = function (post) {
    return !!(post && post.boostUntil && new Date(post.boostUntil) > new Date());
  };
  U.boostTagHTML = function (post) {
    return U.isBoosted(post) ? '<span class="badge boost">⚡ 已加曝光</span>' : '';
  };

  /* ---------------- 排序：会员优先 ---------------- */
  U.sortByPriority = function (list, getOwner) {
    var pro = V.s().proPriority;
    return list.slice().sort(function (a, b) {
      var ba = U.isBoosted(a) ? 1 : 0, bb = U.isBoosted(b) ? 1 : 0;
      if (ba !== bb) return bb - ba;          // 付费加曝光优先
      if (pro) {
        var pa = V.isPro(getOwner(a)) ? 1 : 0, pb = V.isPro(getOwner(b)) ? 1 : 0;
        if (pa !== pb) return pb - pa;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };
  U.isProBoost = function (post, owner) {
    if (!V.isPro(owner)) return false;
    var mins = V.s().proPeriodMinutes || 0;
    if (!mins) return true;
    return (Date.now() - new Date(post.createdAt).getTime()) < mins * 60000;
  };
  U.proTagHTML = function (boost) {
    return boost ? '<span class="badge pro">👑 会员优先</span>' : '';
  };

  /* ---------------- Toast ---------------- */
  U.toast = function (msg, kind) {
    var root = document.getElementById('toast-root');
    if (!root) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = V.i18n ? V.i18n.t(msg) : msg;
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 2300);
  };

  /* ---------------- Modal ---------------- */
  U.modal = function (opts) {
    var root = document.getElementById('modal-root');
    root.className = 'modal-root open';
    var size = opts.size ? ' ' + opts.size : '';
    root.innerHTML =
      '<div class="modal-mask" data-action="modal-close"></div>' +
      '<div class="modal' + size + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><div class="grow"><h2>' + (opts.title || '') + '</h2>' +
          (opts.sub ? '<div class="sub">' + opts.sub + '</div>' : '') + '</div>' +
          '<button class="x" data-action="modal-close" aria-label="关闭">✕</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') +
      '</div>';
    var first = root.querySelector('.input,.select,.textarea,button');
    if (first && opts.focus !== false && first.classList.contains('input')) first.focus();
    document.body.style.overflow = 'hidden';
    if (V.i18n) V.i18n.apply(root);
    return root;
  };
  U.closeModal = function () {
    var root = document.getElementById('modal-root');
    if (root) { root.className = 'modal-root'; root.innerHTML = ''; }
    document.body.style.overflow = '';
  };
  U.confirm = function (opts) {
    return new Promise(function (resolve) {
      var root = document.getElementById('modal-root');
      root.className = 'modal-root open';
      root.innerHTML =
        '<div class="modal-mask" data-action="modal-close"></div>' +
        '<div class="modal narrow">' +
          '<div class="modal-head"><div class="grow"><h2>' + (opts.title || '请确认') + '</h2></div></div>' +
          '<div class="modal-body"><div class="' + (opts.tone === 'warn' ? 'notice warn' : '') + '">' + (opts.body || '') + '</div></div>' +
          '<div class="modal-foot">' +
            '<button class="btn outline" data-action="confirm-no">' + (opts.cancelText || '取消') + '</button>' +
            '<button class="btn ' + (opts.tone === 'danger' ? 'danger' : 'primary') + '" data-action="confirm-yes">' + (opts.okText || '确定') + '</button>' +
          '</div>' +
        '</div>';
      document.body.style.overflow = 'hidden';
      function done(v) { U.closeModal(); resolve(v); }
      root.querySelector('[data-action="confirm-yes"]').onclick = function () { done(true); };
      root.querySelector('[data-action="confirm-no"]').onclick = function () { done(false); };
      root.querySelector('.modal-mask').onclick = function () { done(false); };
      if (V.i18n) V.i18n.apply(root);
    });
  };

  /* ---------------- 模拟支付弹窗 ---------------- */
  U.pay = function (opts) {
    var me = V.me();
    var balance = me ? (me.balance || 0) : 0;
    var useBalance = opts.allowBalance !== false && balance >= opts.amount;
    var body =
      '<div class="center" style="padding:6px 0 14px">' +
        '<div class="tiny muted">' + (opts.label || '应付金额') + '</div>' +
        '<div style="font-size:38px;font-weight:800;letter-spacing:-1px">' + U.money(opts.amount) + '</div>' +
        (opts.note ? '<div class="small muted mt-8">' + opts.note + '</div>' : '') +
      '</div>' +
      '<div class="col" style="gap:10px">' +
        (useBalance
          ? '<label class="radio-card on" data-pay-option="balance"><span class="ic">💳</span><span><b>平台余额</b><span>当前可用 ' + U.money(balance) + '，支付后剩余 ' + U.money(balance - opts.amount) + '</span></span><input type="radio" name="paym" value="balance" checked style="margin-left:auto"></label>'
          : '<label class="radio-card" data-pay-option="wechat"><span class="ic">💚</span><span><b>微信支付</b><span>演示环境不会真实扣款</span></span><input type="radio" name="paym" value="wechat" checked style="margin-left:auto"></label>') +
        (useBalance ? '<label class="radio-card" data-pay-option="wechat"><span class="ic">💚</span><span><b>微信支付</b><span>演示环境不会真实扣款</span></span><input type="radio" name="paym" value="wechat" style="margin-left:auto"></label>' : '') +
        '<label class="radio-card" data-pay-option="alipay"><span class="ic">💙</span><span><b>支付宝</b><span>演示环境不会真实扣款</span></span><input type="radio" name="paym" value="alipay" style="margin-left:auto"></label>' +
      '</div>' +
      (opts.footNote ? '<div class="notice mt-16">' + opts.footNote + '</div>' : '');
    var root = U.modal({
      title: opts.title || '确认支付',
      sub: opts.sub || '',
      size: 'narrow',
      body: body,
      foot: '<button class="btn outline" data-action="modal-close">取消</button>' +
        '<button class="btn primary lg" id="pay-go">确认支付 ' + U.money(opts.amount) + '</button>'
    });
    root.querySelectorAll('[data-pay-option]').forEach(function (card) {
      card.onclick = function () {
        root.querySelectorAll('[data-pay-option]').forEach(function (c) { c.classList.remove('on'); });
        card.classList.add('on');
        card.querySelector('input').checked = true;
      };
    });
    root.querySelector('#pay-go').onclick = function () {
      var method = (root.querySelector('input[name="paym"]:checked') || {}).value || 'wechat';
      U.closeModal();
      U.toast('支付成功 · ' + (method === 'balance' ? '平台余额' : method === 'wechat' ? '微信支付' : '支付宝'), 'ok');
      if (opts.onSuccess) opts.onSuccess(method);
    };
  };

  /* ---------------- 其它小元件 ---------------- */
  U.empty = function (text, icon) {
    return '<div class="empty"><div class="ic">' + (icon || '🍃') + '</div><div>' + text + '</div></div>';
  };
  U.stat = function (k, v, d, tone) {
    return '<div class="stat ' + (tone || '') + '"><div class="k">' + k + '</div><div class="v">' + v + '</div>' +
      (d ? '<div class="d">' + d + '</div>' : '') + '</div>';
  };
  U.barChart = function (data, tone) {
    var max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    return '<div class="bar-chart">' + data.map(function (d) {
      var h = Math.max(3, Math.round((d.value / max) * 100));
      return '<div class="b ' + (tone || '') + '" title="' + d.label + '：' + U.money(d.value) + '">' +
        '<i style="height:' + h + '%"></i><span>' + d.label + '</span></div>';
    }).join('') + '</div>';
  };
  U.progress = function (v, max, gold) {
    var p = max ? Math.min(100, Math.round((v / max) * 100)) : 0;
    return '<div class="progress ' + (gold ? 'gold' : '') + '"><i style="width:' + p + '%"></i></div>';
  };
  U.quotaLine = function (user) {
    var left = V.postsLeft(user), limit = V.dailyPostLimit(user);
    var cLeft = V.contactsLeft(user);
    return '<div class="row tiny muted" style="gap:14px;flex-wrap:wrap">' +
      '<span>今日发布额度 <b>' + (limit - left) + '/' + limit + '</b></span>' +
      '<span>查看联系方式 ' + (cLeft === Infinity ? '<b>不限次</b>' : '<b>' + cLeft + '</b> 次剩余') + '</span>' +
      (V.isPro(user) ? '<span class="badge pro">佣金 ' + U.pct(V.s().commissionPro) + '</span>' : '<span class="badge">佣金 ' + U.pct(V.s().commissionFree) + '</span>') +
      '</div>';
  };
  U.maskContact = function (contact) {
    var c = String(contact || '微信：pinda_demo');
    return c.replace(/[0-9a-zA-Z]/g, function (ch, i) { return i % 2 === 0 ? ch : '•'; });
  };

  /* ---------------- 日期选择辅助 ---------------- */
  U.toLocalInput = function (iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()) + 'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };
})();
