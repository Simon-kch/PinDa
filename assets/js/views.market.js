/* ==========================================================================
   PinDa · 拼拼 / 代代 / 工作台
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  V.views = V.views || {};
  V.state = V.state || {
    pp: { q: '', type: 'all', campus: 'all', proOnly: false, mine: false, credit: 0 },
    dd: { q: '', kind: 'request', cat: 'all', proOnly: false, mine: false, credit: 0 }
  };

  /* ====================== 卡片 ====================== */
  function pinpinCard(post) {
    var owner = V.user(post.ownerId) || {};
    var meta = U.PP_META[post.type];
    var boost = U.isProBoost(post, owner);
    var joined = (post.joined || []).length;
    var cap = post.capacity || 1;
    var priceText = post.type === 'carpool' ? '人均 ' + U.money(post.price)
      : post.type === 'groupbuy' ? (post.price ? '预估 ' + U.money(post.price) + '/人' : '按小票均摊')
        : (post.price ? 'AA ' + U.money(post.price) : '免费');
    var mine = V.me() && V.me().id === post.ownerId;
    return '<article class="post' + (boost ? ' pro-post' : '') + '" data-action="pp-open" data-id="' + post.id + '">' +
      '<div class="post-top">' +
        '<span class="emoji">' + meta.icon + '</span>' +
        '<div class="grow">' +
          '<div class="row" style="gap:6px;flex-wrap:wrap">' +
            '<span class="badge brand" style="background:' + meta.color + '1a;color:' + meta.color + '">' + meta.label + '</span>' +
            U.proTagHTML(boost) +
            U.boostTagHTML(post) +
            (post.status !== 'open' ? '<span class="badge">' + (post.status === 'full' ? '已满员' : post.status === 'done' ? '已结束' : '已关闭') + '</span>' : '') +
            (mine ? '<span class="badge info">我发布的</span>' : '') +
          '</div>' +
          '<h3 class="mt-8">' + U.esc(post.title) + '</h3>' +
          '<p class="desc clip-2">' + U.esc(post.desc) + '</p>' +
          '<div class="post-meta">' +
            (post.type === 'carpool'
              ? '<span><i>出发</i> ' + U.fmtDateTime(post.departAt) + ' ' + U.weekday(post.departAt) + '</span>' +
                '<span><i>路线</i> ' + U.esc(post.from) + ' → ' + U.esc(post.to) + '</span>'
              : post.type === 'groupbuy'
                ? '<span><i>店铺</i> ' + U.esc(post.store || '') + '</span>' +
                  '<span><i>截止</i> ' + U.fmtDateTime(post.deadline) + ' · ' + U.countdown(post.deadline) + '</span>'
                : '<span><i>' + (post.type === 'collab' ? '合作方向' : '目标') + '</i> ' + U.esc(post.goal || '') + '</span>' +
                  '<span><i>截止</i> ' + U.countdown(post.deadline) + '</span>') +
            '<span><i>进度</i> ' + (joined + 1) + '/' + cap + ' 人</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="post-foot">' +
        '<div class="row" style="gap:8px;min-width:0">' + U.avatar(owner, 'sm') +
          '<span class="small"><b>' + U.esc(owner.nickname || '') + '</b> <span class="muted tiny">信用 ' + (owner.credit || 0) + '</span></span></div>' +
        '<div class="row" style="gap:8px"><b style="color:var(--brand-700)">' + priceText + '</b>' +
          '<span class="btn sm ' + (post.status === 'open' ? 'primary' : 'outline') + '">' + (mine ? '管理' : '查看') + '</span></div>' +
      '</div>' +
    '</article>';
  }

  function daidaiCard(post) {
    var owner = V.user(post.ownerId) || {};
    var boost = U.isProBoost(post, owner);
    var st = U.DD_STATUS[post.status] || { label: post.status, cls: '' };
    var isTrip = post.kind === 'trip';
    var fresh = post.status === 'open' && (Date.now() - new Date(post.createdAt).getTime()) < (V.s().proPeriodMinutes || 30) * 60000;
    var mine = V.me() && V.me().id === post.ownerId;
    var taken = post.taken || 0, cap = post.capacity || 0;
    return '<article class="post' + (boost ? ' pro-post' : '') + '" data-action="dd-open" data-id="' + post.id + '">' +
      '<div class="post-top">' +
        '<span class="emoji">' + U.ddIcon(post) + '</span>' +
        '<div class="grow">' +
          '<div class="row" style="gap:6px;flex-wrap:wrap">' +
            '<span class="badge ' + (isTrip ? 'ok' : 'info') + '">' + (isTrip ? '🧳 可代购行程' : '🎯 代购需求') + '</span>' +
            (fresh ? '<span class="badge warn">⚡ 新发布</span>' : '') +
            '<span class="tag">' + U.esc(post.category) + '</span>' +
            U.proTagHTML(boost) +
            '<span class="badge ' + st.cls + '">' + st.label + '</span>' +
            (mine ? '<span class="badge info">我发布的</span>' : '') +
          '</div>' +
          '<h3 class="mt-8">' + U.esc(post.title) + '</h3>' +
          '<p class="desc clip-2">' + U.esc(post.desc) + '</p>' +
          '<div class="post-meta">' +
            '<span><i>' + (isTrip ? '出发地' : '需要从') + '</i> ' + U.esc(post.from) + '</span>' +
            (post.to ? '<span><i>送到</i> ' + U.esc(post.to) + '</span>' : '') +
            '<span><i>期望时间</i> ' + U.fmtDateTime(post.expectAt) + '</span>' +
            (post.budget ? '<span><i>预算</i> ' + U.money(post.budget) + '</span>' : '') +
            (isTrip && cap ? '<span><i>名额</i> ' + taken + '/' + cap + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="post-foot">' +
        '<div class="row" style="gap:8px;min-width:0">' + U.avatar(owner, 'sm') +
          '<span class="small"><b>' + U.esc(owner.nickname || '') + '</b> <span class="muted tiny">' + (V.isPro(owner) ? '👑 会员' : '普通') + ' · 信用 ' + (owner.credit || 0) + '</span></span></div>' +
        '<div class="row" style="gap:8px">' +
          '<b style="color:var(--accent)">代购费 ' + (post.fee > 50 ? U.money(post.fee) : post.fee + '%') + '</b>' +
          '<span class="btn sm ' + (post.status === 'open' && !mine ? 'primary' : 'outline') + '">' +
          (mine ? '管理' : post.status === 'open' ? (isTrip ? '找TA代购' : '我要接单') : '查看') + '</span></div>' +
      '</div>' +
    '</article>';
  }
  V.cardPinpin = pinpinCard; V.cardDaidai = daidaiCard;

  /* ====================== 工作台 ====================== */
  V.views.home = function () {
    var me = V.me(), s = V.s(), st = V.platformStats();
    var myOrders = V.ordersOf(me.id);
    var doing = myOrders.filter(function (o) { return o.status !== 'completed' && o.status !== 'cancelled'; });
    var myPinpin = V.pinpin().filter(function (p) { return p.ownerId === me.id || (p.joined || []).indexOf(me.id) >= 0; });
    var myDaidai = V.daidai().filter(function (p) { return p.ownerId === me.id || p.takerId === me.id; });
    var fee = V.feeFor('daidai', me, 100);
    var recPP = U.sortByPriority(V.pinpin().filter(function (p) { return p.status === 'open'; }), function (p) { return V.user(p.ownerId); }).slice(0, 3);
    var recDD = U.sortByPriority(V.daidai().filter(function (p) { return p.status === 'open'; }), function (p) { return V.user(p.ownerId); }).slice(0, 3);

    return '<div class="wrap">' +
      '<div class="card pad-lg" style="background:linear-gradient(120deg,#1B1240,#3A1C6E 55%,#5A3AE0);color:#fff;border:0">' +
        '<div class="between" style="align-items:flex-start;flex-wrap:wrap;gap:16px">' +
          '<div>' +
            '<div class="row" style="gap:10px">' + U.avatar(me, 'lg') +
              '<div><div class="row" style="gap:8px;flex-wrap:wrap"><h1 style="font-size:22px;font-weight:800">你好，' + U.esc(me.nickname) + '</h1>' +
              (V.isPro(me) ? '<span class="badge pro">👑 PinDa 会员 · 剩 ' + V.memberDaysLeft(me) + ' 天</span>' : '<span class="badge">普通用户</span>') + '</div>' +
              '<div class="small" style="color:rgba(255,255,255,.72)">' + U.esc(me.college) + ' · ' + U.esc(me.grade) + ' · ' + U.esc(me.campus) +
              ' · 信用 ' + me.credit + ' · 成交 ' + me.deals + ' 单</div></div></div>' +
            '<div class="row mt-16" style="gap:10px;flex-wrap:wrap">' +
              '<button class="btn primary" data-action="pp-new">🧩 发布拼拼</button>' +
              '<button class="btn outline" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff" data-action="dd-new" data-kind="request">🎒 发布代购需求</button>' +
              '<button class="btn outline" style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff" data-action="dd-new" data-kind="trip">🧳 挂出行程接单</button>' +
            '</div>' +
          '</div>' +
          '<div class="card" style="min-width:250px;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);color:#fff">' +
            '<div class="between"><b class="small">' + V.stage().name + '</b>' +
              (V.isPro(me) ? '<span class="badge pro">会员费率 ' + U.pct(s.commissionPro) + '</span>' : '<a class="badge pro" href="#/member">升级降佣金</a>') + '</div>' +
            '<div class="small mt-12" style="color:rgba(255,255,255,.8)">今日发布 ' + (V.dailyPostLimit(me) - V.postsLeft(me)) + '/' + V.dailyPostLimit(me) +
              ' · 查看联系方式 ' + (V.contactsLeft(me) === Infinity ? '不限次' : V.contactsLeft(me) + ' 次') + '</div>' +
            '<div class="mt-12">' + U.progress(V.dailyPostLimit(me) - V.postsLeft(me), V.dailyPostLimit(me), V.isPro(me)) + '</div>' +
            '<div class="tiny mt-12" style="color:rgba(255,255,255,.72)">' + V.stage().name + '：代代订单 ¥100 平台费用 ' +
              (fee.commission ? U.money(fee.commission) + '，你到手 ' + U.money(fee.net) : '免费') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="grid c4 mt-16">' +
        U.stat('我的钱包余额', U.money(me.balance), '可提现 / 可支付', 'brand') +
        U.stat('进行中订单', doing.length + ' 单', '拼拼 ' + myPinpin.length + ' · 代代 ' + myDaidai.length) +
        U.stat('平台在架信息', st.posts + ' 条', '拼拼 ' + V.pinpin().length + ' · 代代 ' + V.daidai().length) +
        U.stat('平台累计佣金', U.money(st.commission), '会员费收入 ' + U.money(st.memberRevenue), 'gold') +
      '</div>' +

      '<div class="grid side mt-16">' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-head"><div class="card-title">🧩 拼拼 · 推荐给你' + (s.proPriority ? ' <span class="badge pro">会员优先</span>' : '') + '</div>' +
            '<a class="link-plain small" href="#/pinpin">查看全部 →</a></div>' +
            (recPP.length ? '<div class="grid" style="gap:12px">' + recPP.map(pinpinCard).join('') + '</div>' : U.empty('暂无拼拼信息')) +
          '</div>' +
          '<div class="card"><div class="card-head"><div class="card-title">🎒 代代 · 最新需求与行程</div>' +
            '<a class="link-plain small" href="#/daidai">查看全部 →</a></div>' +
            (recDD.length ? '<div class="grid" style="gap:12px">' + recDD.map(daidaiCard).join('') + '</div>' : U.empty('暂无代代信息')) +
          '</div>' +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">🔔 最新通知</div>' +
            '<div class="mt-12">' + V.db.messages.filter(function (m) { return m.userId === me.id; }).slice(0, 4).map(function (m) {
              return '<div class="item hoverable" style="padding:10px;cursor:pointer" data-action="msg-open" data-id="' + m.id + '">' +
                '<div class="grow"><div class="row" style="gap:6px"><b class="small">' + U.esc(m.title) + '</b>' +
                (!m.read ? '<span class="badge danger">新</span>' : '') + '</div>' +
                '<div class="tiny muted mt-8 clip-2">' + U.esc(m.body) + '</div>' +
                '<div class="tiny muted mt-8">' + U.timeAgo(m.createdAt) + '</div></div></div>';
            }).join('') + '</div>' +
            '<a class="btn outline block mt-12" href="#/messages">全部消息</a></div>' +
          '<div class="card"><div class="card-title">⚡ 快捷入口</div>' +
            '<div class="col mt-12" style="gap:8px">' +
              '<a class="item hoverable" href="#/orders" style="padding:12px"><span class="grow small"><b>我的订单</b><div class="tiny muted">查看状态与佣金明细</div></span><span>→</span></a>' +
              '<a class="item hoverable" href="#/wallet" style="padding:12px"><span class="grow small"><b>钱包与流水</b><div class="tiny muted">收入、支出、提现</div></span><span>→</span></a>' +
              '<a class="item hoverable" href="#/deals" style="padding:12px"><span class="grow small"><b>校园优惠</b><div class="tiny muted">周边商家优惠券，到店出示核销</div></span><span>→</span></a>' +
              '<a class="item hoverable" href="#/member" style="padding:12px"><span class="grow small"><b>会员中心</b><div class="tiny muted">降佣金、优先展示</div></span><span>→</span></a>' +
              (me.role === 'admin' ? '<a class="item hoverable" href="#/admin" style="padding:12px"><span class="grow small"><b>平台管理台</b><div class="tiny muted">用户、内容、佣金统计</div></span><span>→</span></a>' : '') +
            '</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /* ====================== 拼拼列表 ====================== */
  V.views.pinpin = function () {
    var f = V.state.pp, me = V.me();
    var all = V.pinpin();
    var list = all.filter(function (p) {
      if (f.mine && p.ownerId !== me.id && (p.joined || []).indexOf(me.id) < 0) return false;
      if (f.type !== 'all' && p.type !== f.type) return false;
      if (f.campus !== 'all') {
        var owner = V.user(p.ownerId);
        var hay = [(p.from || ''), (p.to || ''), (p.store || ''), (owner ? owner.campus : '')].join(' ');
        // 线路文本里出现太仓 / 园区字样时，也归入对应校区，筛选更符合直觉
        if (/太仓|TC/.test(hay)) hay += ' TC';
        if (/南校区|北校区|独墅湖|园区|SIP/.test(hay)) hay += ' SIP';
        if (hay.indexOf(f.campus) < 0) return false;
      }
      if (f.q) {
        var text = (p.title + p.desc + (p.from || '') + (p.to || '') + (p.store || '') + (p.goal || '')).toLowerCase();
        if (text.indexOf(f.q.toLowerCase()) < 0) return false;
      }
      if (f.proOnly && !V.isPro(V.user(p.ownerId))) return false;
      if (f.credit && (V.user(p.ownerId).credit || 0) < f.credit) return false;
      return true;
    });
    list = U.sortByPriority(list, function (p) { return V.user(p.ownerId); });

    var types = [
      { k: 'all', label: '全部' }, { k: 'carpool', label: '🚗 拼车出行' },
      { k: 'groupbuy', label: '🛒 拼单购物' }, { k: 'partner', label: '👥 找搭子' },
      { k: 'collab', label: '🤝 合作机会' }
    ];
    var mineCount = all.filter(function (p) { return p.ownerId === me.id || (p.joined || []).indexOf(me.id) >= 0; }).length;

    return '<div class="wrap">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        '<div><div class="sec-title">🧩 拼拼</div><div class="sec-sub">拼车 · 拼单 · 找搭子，和同校、跨校的同学凑在一起</div></div>' +
        '<div class="row" style="gap:10px"><button class="btn outline" data-action="pp-new">发布信息</button>' +
        '<button class="btn primary" data-action="pp-new">＋ 发起拼拼</button></div>' +
      '</div>' +
      '<div class="card mt-16" style="padding:14px">' +
        '<div class="row" style="gap:10px;flex-wrap:wrap">' +
          '<input class="input grow" id="pp-q" placeholder="搜索：机场、山姆、图书馆、羽毛球…" value="' + U.esc(f.q) + '" data-filter="pp-q" style="max-width:340px">' +
          '<select class="select" data-filter="pp-campus" style="max-width:170px">' +
            ['all'].concat(V.s().campuses).map(function (c) {
              return '<option value="' + c + '"' + (f.campus === c ? ' selected' : '') + '>' + (c === 'all' ? '全部校区 / 区域' : c) + '</option>';
            }).join('') + '</select>' +
          '<label class="chip ' + (f.proOnly ? 'on' : '') + '" data-action="pp-pro-filter"><span class="pro-star">★</span> 只看会员发布</label>' +
          '<select class="select" data-filter="pp-credit" style="max-width:200px">' +
            [[0, '👑 高级筛选：信用分不限'], [80, '👑 信用分 ≥ 80'], [90, '👑 信用分 ≥ 90'], [95, '👑 信用分 ≥ 95']].map(function (o) {
              return '<option value="' + o[0] + '"' + (Number(f.credit) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
            }).join('') + '</select>' +
          '<label class="chip ' + (f.mine ? 'on' : '') + '" data-action="pp-mine">我的拼拼 ' + mineCount + '</label>' +
        '</div>' +
        '<div class="chips mt-12">' + types.map(function (t) {
          return '<button class="chip ' + (f.type === t.k ? 'on' : '') + '" data-action="pp-type" data-value="' + t.k + '">' + t.label + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="grid side mt-16">' +
        '<div>' +
          '<div class="between small muted" style="margin:0 4px 10px"><span>共 ' + list.length + ' 条' +
            (V.s().proPriority ? ' · 会员信息优先展示' : '') + '</span><span>点击卡片查看详情</span></div>' +
          (list.length ? '<div class="grid" style="gap:12px">' + list.map(pinpinCard).join('') + '</div>' : U.empty('没有匹配的拼拼信息，换个筛选条件或自己发一条')) +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">📌 发布一条拼拼</div>' +
            '<p class="small muted mt-8">拼车写清出发时间与空位；拼单写清截止时间与店铺；找搭子写清频率与目标。</p>' +
            U.quotaLine(me) +
            '<button class="btn primary block mt-12" data-action="pp-new">立即发布</button></div>' +
          '<div class="card"><div class="card-title">💰 关于费用</div>' +
            '<p class="small muted mt-8">当前阶段（' + V.stage().name + '）拼拼收费规则：</p>' +
            '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
              ['carpool', 'groupbuy', 'partner', 'collab'].map(function (ctx) {
                var mode = V.chargeMode(ctx);
                return '<tr><td>' + V.CONTEXT_LABEL[ctx] + '</td><td>' + (mode === 'free' ? '<b>免费</b>'
                  : mode === 'service' ? U.money(V.s().serviceFee) + '/单' + (V.isPro(me) ? '（会员免收）' : '') : U.pct(V.s().commissionFree)) + '</td></tr>';
              }).join('') +
            '</tbody></table></div>' +
            '<div class="tiny muted mt-12">' + V.stage().note + '</div>' +
            (V.isPro(me) ? '<div class="notice ok mt-12">会员已享：优先展示、不限次查看联系方式、拼单服务费免收。</div>'
              : '<a class="btn gold block mt-12" href="#/member">👑 开通会员，享优先展示与服务费减免</a>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /* ====================== 代代列表 ====================== */
  V.views.daidai = function () {
    var f = V.state.dd, me = V.me();
    var cats = ['all'].concat(V.DD_CATS);
    var list = V.daidai().filter(function (p) {
      if (p.kind !== f.kind) return false;
      if (f.mine && p.ownerId !== me.id && p.takerId !== me.id) return false;
      if (f.cat !== 'all' && p.category !== f.cat) return false;
      if (f.q) {
        var text = (p.title + p.desc + p.from + (p.to || '') + p.category).toLowerCase();
        if (text.indexOf(f.q.toLowerCase()) < 0) return false;
      }
      if (f.proOnly && !V.isPro(V.user(p.ownerId))) return false;
      if (f.credit && (V.user(p.ownerId).credit || 0) < f.credit) return false;
      return true;
    });
    list = U.sortByPriority(list, function (p) { return V.user(p.ownerId); });
    // 会员优先派送：刚发布的新需求置顶（非会员仍可见，只是排在后面）
    if (V.isPro(me)) {
      var win = (V.s().proPeriodMinutes || 0) * 60000;
      list.sort(function (a, b) {
        var fa = (Date.now() - new Date(a.createdAt).getTime()) < win ? 1 : 0;
        var fb = (Date.now() - new Date(b.createdAt).getTime()) < win ? 1 : 0;
        if (fa !== fb) return fb - fa;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    var reqCount = V.daidai().filter(function (p) { return p.kind === 'request'; }).length;
    var tripCount = V.daidai().filter(function (p) { return p.kind === 'trip'; }).length;

    return '<div class="wrap">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        '<div><div class="sec-title">🎒 代代</div><div class="sec-sub">让别人出国顺便带货，或让别人顺路帮你带一份</div></div>' +
        '<div class="row" style="gap:10px">' +
          '<button class="btn outline" data-action="dd-new" data-kind="trip">🧳 我要接单（挂行程）</button>' +
          '<button class="btn primary" data-action="dd-new" data-kind="request">＋ 发布代购需求</button></div>' +
      '</div>' +
      '<div class="card mt-16" style="padding:14px">' +
        '<div class="seg">' +
          '<button class="' + (f.kind === 'request' ? 'on' : '') + '" data-action="dd-kind" data-value="request">🎯 需要代购 / 代取（' + reqCount + '）</button>' +
          '<button class="' + (f.kind === 'trip' ? 'on' : '') + '" data-action="dd-kind" data-value="trip">🧳 可以帮带（' + tripCount + '）</button>' +
        '</div>' +
        '<div class="row mt-12" style="gap:10px;flex-wrap:wrap">' +
          '<input class="input grow" id="dd-q" placeholder="搜索：日本、山姆、菜鸟驿站、香水…" value="' + U.esc(f.q) + '" data-filter="dd-q" style="max-width:340px">' +
          '<label class="chip ' + (f.proOnly ? 'on' : '') + '" data-action="dd-pro-filter"><span class="pro-star">★</span> 只看会员</label>' +
          '<select class="select" data-filter="dd-credit" style="max-width:200px">' +
            [[0, '👑 高级筛选：信用分不限'], [80, '👑 信用分 ≥ 80'], [90, '👑 信用分 ≥ 90'], [95, '👑 信用分 ≥ 95']].map(function (o) {
              return '<option value="' + o[0] + '"' + (Number(f.credit) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
            }).join('') + '</select>' +
          '<label class="chip ' + (f.mine ? 'on' : '') + '" data-action="dd-mine">我的代代</label>' +
        '</div>' +
        '<div class="chips mt-12">' + cats.map(function (c) {
          return '<button class="chip ' + (f.cat === c ? 'on' : '') + '" data-action="dd-cat" data-value="' + c + '">' +
            (c === 'all' ? '全部分类' : (V.CAT_LABEL[c] || '') + ' ' + c) + '</button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="grid side mt-16">' +
        '<div>' +
          '<div class="between small muted" style="margin:0 4px 10px"><span>共 ' + list.length + ' 条' +
            (V.s().proPriority ? ' · 会员信息优先展示' : '') + '</span><span>大额代购建议先付定金</span></div>' +
          (list.length ? '<div class="grid" style="gap:12px">' + list.map(daidaiCard).join('') + '</div>' : U.empty('这里还没有信息，试试切换分类或发布一条')) +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">💡 代代怎么用</div>' +
            '<ul class="col small muted" style="gap:8px">' +
              '<li>🎯 <b>需要代购</b>：写清商品、预算、最晚时间，接单同学会联系你。</li>' +
              '<li>🧳 <b>可以帮带</b>：把出行行程挂出来，让需要的人主动下单。</li>' +
              '<li>🧾 交易时上传小票，价格按实际结算，避免扯皮。</li>' +
              (V.isPro(me)
                ? '<li>⚡ <b>会员优先派送</b>：刚发布 ' + (V.s().proPeriodMinutes || 30) + ' 分钟内的新需求会置顶给你。</li>'
                : '<li>⚡ <b>会员优先派送</b>：新需求发布后优先推给会员，会员接单更快。</li>') +
            '</ul></div>' +
          '<div class="card"><div class="card-title">💰 佣金规则</div>' +
            '<p class="small muted mt-8">当前阶段（' + V.stage().name + '）代代订单规则：<b>' + V.feeFor('daidai', me, 100).label + '</b>。</p>' +
            (V.chargeMode('daidai') === 'free'
              ? '<div class="notice ok mt-12">启动期免费撮合：平台不向任何一方收费，先把订单量和复购率跑起来。</div>'
              : '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
                '<tr><td>成交 ¥100</td><td>平台费用 <b>' + U.money(100 * V.rateFor(me)) + '</b></td><td>到手 ' + U.money(100 * (1 - V.rateFor(me))) + '</td></tr>' +
                '</tbody></table></div>') +
            (V.isPro(me) ? '<div class="notice ok mt-12">会员费率 ' + U.pct(V.s().commissionPro) + '，比普通用户每 ¥100 多拿 ' + U.money(100 * (V.s().commissionFree - V.s().commissionPro)) + '。</div>'
              : '<a class="btn gold block mt-12" href="#/member">👑 会员费率仅 ' + U.pct(V.s().commissionPro) + '</a>') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /* ====================== 发布：拼拼 ====================== */
  V.views.formPinpin = function (preset) {
    preset = preset || { type: 'carpool' };
    var s = V.s();
    function sel(name, opts, cur) {
      return '<select class="select" name="' + name + '">' + opts.map(function (o) {
        return '<option value="' + o + '"' + (o === cur ? ' selected' : '') + '>' + o + '</option>';
      }).join('') + '</select>';
    }
    return '<form data-form="pp-create">' +
        '<div class="field"><label>类型</label><div class="chips" style="overflow:visible">' +
        [['carpool', '🚗 拼车出行'], ['groupbuy', '🛒 拼单购物'], ['partner', '👥 找搭子'], ['collab', '🤝 合作机会']].map(function (t) {
          return '<label class="chip ' + (preset.type === t[0] ? 'on' : '') + '" data-pp-type="' + t[0] + '">' + t[1] +
            '<input type="radio" name="type" value="' + t[0] + '" ' + (preset.type === t[0] ? 'checked' : '') + ' class="hide"></label>';
        }).join('') + '</div></div>' +
      '<div class="form-grid mt-16">' +
        '<div class="field full"><label>标题 *</label><input class="input" name="title" required placeholder="例如：10/18 苏州 → 上海虹桥 T2 机场拼车"></div>' +
        '<div class="field full"><label>详细说明 *</label><textarea class="textarea" name="desc" required placeholder="集合地点、能否放行李、是否中途接人、费用怎么算…"></textarea></div>' +
        '<div class="pp-only full" data-for="carpool"><div>' +
          '<div class="tiny muted" style="margin-bottom:8px">常用线路（点一下自动填入）：</div>' +
          '<div class="row" style="gap:8px;flex-wrap:wrap">' +
            [['TC 太仓校区', 'SIP 南校区'], ['SIP 南校区', 'TC 太仓校区'], ['SIP 南校区', '上海虹桥机场 T2'],
             ['SIP 南校区', '上海浦东机场 T1'], ['SIP 北校区', '苏州站'], ['SIP 南校区', '无锡硕放机场']]
              .map(function (r) {
                return '<span class="route-chip" data-route-from="' + r[0] + '" data-route-to="' + r[1] + '">' +
                  r[0] + ' → ' + r[1] + '</span>';
              }).join('') +
          '</div>' +
        '</div></div>' +
        '<div class="pp-only full" data-for="carpool"><div class="form-grid" style="gap:14px">' +
          '<div class="field"><label>出发地 *</label><input class="input" name="pp_from" placeholder="SIP 南校区"></div>' +
          '<div class="field"><label>目的地 *</label><input class="input" name="pp_to" placeholder="上海虹桥机场 T2"></div>' +
          '<div class="field"><label>出发时间 *</label><input class="input" type="datetime-local" name="pp_departAt" value="' + U.toLocalInput(V.iso(2, 8, 0)) + '"></div>' +
          '<div class="field"><label>可坐人数（含发起人）</label><input class="input" type="number" name="pp_capacity" min="2" max="7" value="4"></div>' +
          '<div class="field"><label>人均费用（元）</label><input class="input" type="number" name="pp_price" min="0" value="80"></div>' +
          '<div class="field"><label>车型 / 备注</label><input class="input" name="pp_extra" placeholder="SUV，后备箱可放 2 个 28 寸箱"></div>' +
        '</div></div>' +
        '<div class="pp-only full hide" data-for="groupbuy"><div class="form-grid" style="gap:14px">' +
          '<div class="field"><label>店铺 / 平台 *</label><input class="input" name="gb_store" placeholder="山姆会员商店（苏州）"></div>' +
          '<div class="field"><label>截止时间 *</label><input class="input" type="datetime-local" name="gb_deadline" value="' + U.toLocalInput(V.iso(2, 20, 0)) + '"></div>' +
          '<div class="field"><label>成团人数</label><input class="input" type="number" name="gb_capacity" min="2" max="50" value="6"></div>' +
          '<div class="field"><label>预估人均（元）</label><input class="input" type="number" name="gb_price" min="0" value="60"></div>' +
        '</div></div>' +
        '<div class="pp-only full hide" data-for="partner"><div class="form-grid" style="gap:14px">' +
          '<div class="field"><label>搭子目标 *</label><input class="input" name="pt_goal" placeholder="期末周互相监督，每天 8:00-22:00 图书馆"></div>' +
          '<div class="field"><label>期望开始 / 截止</label><input class="input" type="datetime-local" name="pt_deadline" value="' + U.toLocalInput(V.iso(7, 22, 0)) + '"></div>' +
          '<div class="field"><label>需要几人（含发起人）</label><input class="input" type="number" name="pt_capacity" min="2" max="20" value="3"></div>' +
          '<div class="field"><label>费用（元，0 表示免费）</label><input class="input" type="number" name="pt_price" min="0" value="0"></div>' +
        '</div></div>' +
        '<div class="pp-only full hide" data-for="collab"><div class="form-grid" style="gap:14px">' +
          '<div class="field"><label>合作方向 *</label><input class="input" name="cl_goal" placeholder="例如：BUS107 小组作业，找 1 位会 Tableau 的同学"></div>' +
          '<div class="field"><label>期望截止时间</label><input class="input" type="datetime-local" name="cl_deadline" value="' + U.toLocalInput(V.iso(7, 22, 0)) + '"></div>' +
          '<div class="field"><label>需要几人（含发起人）</label><input class="input" type="number" name="cl_capacity" min="2" max="20" value="3"></div>' +
          '<div class="field"><label>是否涉及费用</label><select class="select" name="cl_price">' +
            '<option value="0">不涉及费用（免费合作）</option><option value="20">有少量分摊费用（如场地 / 材料）</option>' +
          '</select></div>' +
        '</div></div>' +
        '<div class="field"><label>校区</label>' + sel('campus', s.campuses, V.me().campus) +
          '<span class="hint">SIP = 苏州工业园区校区 · TC = 太仓校区</span></div>' +
        '<div class="field"><label>联系方式（成团后对方可见）</label><input class="input" name="contact" value="微信：' + U.esc(V.me().nickname) + '"></div>' +
        '<div class="field full"><label>标签（逗号分隔）</label><input class="input" name="tags" placeholder="可放行李,准点出发,女生同车"></div>' +
      '</div>' +
      '<div class="notice mt-16">发布前请确认信息真实。今日剩余发布额度：<b>' + V.postsLeft(V.me()) + ' 条</b>。</div>' +
      '</form>';
  };

  /* ====================== 发布：代代 ====================== */
  V.views.formDaidai = function (kind) {
    var me = V.me();
    var isTrip = kind === 'trip';
    var cats = V.DD_CATS;
    return '<form data-form="dd-create">' +
      '<input type="hidden" name="kind" value="' + kind + '">' +
      '<div class="notice ' + (isTrip ? 'ok' : '') + '">' + (isTrip
        ? '🧳 你即将发布「可以帮带」行程：同学下单后你会收到通知，代购费由你设定。'
        : '🎯 你即将发布「需要代购 / 代取」需求：接单同学会带着你的清单去办。') + '</div>' +
      '<div class="form-grid mt-16">' +
        '<div class="field"><label>分类 *</label><select class="select" name="category">' +
          cats.map(function (c) { return '<option value="' + c + '">' + (V.CAT_LABEL[c] || '') + ' ' + c + '（' + (V.CAT_DESC[c] || '') + '）</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>代购费 *</label><input class="input" name="fee" type="number" min="0" step="0.5" value="' + (isTrip ? 10 : 15) + '">' +
          '<span class="hint">≤50 视为百分比（10 = 10%），&gt;50 视为固定金额</span></div>' +
        (isTrip ? '<div class="field"><label>可接单名额</label><input class="input" name="capacity" type="number" min="1" value="10"></div>' : '') +
        '<div class="field"><label>' + (isTrip ? '出发地 / 所在城市' : '需要从哪里买') + ' *</label>' +
          '<input class="input" name="from" placeholder="' + (isTrip ? '日本东京' : '山姆会员商店（苏州）') + '"></div>' +
        '<div class="field"><label>送到哪里</label><input class="input" name="to" placeholder="SIP 南校区"></div>' +
        '<div class="field"><label>' + (isTrip ? '预计回校时间' : '期望到手时间') + ' *</label>' +
          '<input class="input" type="datetime-local" name="expectAt" value="' + U.toLocalInput(V.iso(5, 20, 0)) + '"></div>' +
        '<div class="field"><label>预算金额（元）</label><input class="input" name="budget" type="number" min="0" value="' + (isTrip ? 2000 : 300) + '"></div>' +
        '<div class="field full"><label>标题 *</label><input class="input" name="title" required placeholder="' +
          (isTrip ? '10/19–10/22 我在日本，可帮带化妆品/药品' : '求带日本药妆：大阪心斋桥退税店清单') + '"></div>' +
        '<div class="field full"><label>详细说明 *</label><textarea class="textarea" name="desc" required placeholder="' +
          (isTrip ? '能带什么、不能带什么、是否需要定金、怎么交付' : '商品清单、型号颜色、可接受的价格范围') + '"></textarea></div>' +
        '<div class="field"><label>联系方式</label><input class="input" name="contact" value="微信：' + U.esc(me.nickname) + '"></div>' +
        '<div class="field"><label>标签（逗号分隔）</label><input class="input" name="tags" placeholder="要小票,可拍照,免税店"></div>' +
      '</div>' +
      '<div class="notice warn mt-16">禁止代购烟酒、处方药、管制物品与活体动物。今日剩余发布额度：<b>' + V.postsLeft(me) + ' 条</b>。</div>' +
      '</form>';
  };

  /* ====================== 详情：拼拼 ====================== */
  V.views.detailPinpin = function (post) {
    var me = V.me();
    var owner = V.user(post.ownerId);
    var joined = post.joined || [];
    var isOwner = owner.id === me.id;
    var inList = isOwner || joined.indexOf(me.id) >= 0;
    var cap = post.capacity || 1;
    var members = [owner].concat(joined.map(V.user).filter(Boolean));
    var contact = post.contact || ('微信：' + owner.nickname);
    var label = U.PP_META[post.type];

    var body =
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<span class="badge brand" style="background:' + label.color + '1a;color:' + label.color + '">' + label.icon + ' ' + label.label + '</span>' +
        (post.status === 'open' ? '<span class="badge ok">可加入</span>' : '<span class="badge">' + (post.status === 'done' ? '已结束' : '已关闭') + '</span>') +
        (U.isProBoost(post, owner) ? U.proTagHTML(true) : '') +
      '</div>' +
      '<h2 style="font-size:19px;font-weight:800;margin-top:12px">' + U.esc(post.title) + '</h2>' +
      '<p class="small mt-8" style="color:var(--ink-2);white-space:pre-wrap">' + U.esc(post.desc) + '</p>' +
      '<div class="divider"></div>' +
      '<dl class="kv">' +
        (post.type === 'carpool'
          ? '<dt>路线</dt><dd>' + U.esc(post.from) + ' → ' + U.esc(post.to) + '</dd>' +
            '<dt>出发时间</dt><dd>' + U.fmtDateTime(post.departAt) + ' ' + U.weekday(post.departAt) + '</dd>'
          : post.type === 'groupbuy'
            ? '<dt>店铺</dt><dd>' + U.esc(post.store || '') + '</dd>' +
              '<dt>截止时间</dt><dd>' + U.fmtDateTime(post.deadline) + ' · ' + U.countdown(post.deadline) + '</dd>'
            : '<dt>搭子目标</dt><dd>' + U.esc(post.goal || '') + '</dd>' +
              '<dt>期望周期</dt><dd>' + U.fmtDateTime(post.deadline) + '</dd>') +
        '<dt>费用</dt><dd>' + (post.type === 'carpool' ? '人均 ' + U.money(post.price) : post.price ? '人均约 ' + U.money(post.price) : '免费 / AA') + '</dd>' +
        '<dt>人数</dt><dd>' + members.length + ' / ' + cap + ' 人' + (members.length >= cap ? '（已满）' : '') + '</dd>' +
        '<dt>发布</dt><dd>' + U.timeAgo(post.createdAt) + '</dd>' +
        (post.tags && post.tags.length ? '<dt>标签</dt><dd>' + post.tags.map(function (t) { return '<span class="tag">' + U.esc(t) + '</span>'; }).join(' ') + '</dd>' : '') +
      '</dl>' +
      '<div class="mt-12">' + U.progress(members.length, cap, V.isPro(owner)) + '</div>' +
      '<div class="divider"></div>' +
      '<div class="small strong">已加入成员</div>' +
      '<div class="col mt-8" style="gap:8px">' + members.map(function (m) {
        return '<div class="row" style="gap:8px">' + U.avatar(m, 'sm') +
          '<span class="grow small"><b>' + U.esc(m.nickname) + '</b>' + (m.id === post.ownerId ? ' <span class="badge brand">发起人</span>' : '') +
          '<div class="tiny muted">' + U.esc(m.college) + ' · 信用 ' + m.credit + '</div></span>' +
          (m.id === me.id ? '<span class="badge">我</span>' : '') + '</div>';
      }).join('') + '</div>' +
      '<div class="divider"></div>' +
      '<div class="row" style="gap:12px">' + U.avatar(owner) +
        '<div class="grow small"><b>' + U.esc(owner.nickname) + '</b> ' + (V.isPro(owner) ? '<span class="badge pro">会员</span>' : '') +
        '<div class="tiny muted">' + U.esc(owner.intro || '这个人很懒，什么都没写') + '</div></div></div>' +
      '<div class="item mt-12" style="align-items:center">' +
        '<span class="grow small"><b>联系方式</b><div class="muted">' + (inList ? U.esc(contact) : U.maskContact(contact)) + '</div></span>' +
        (inList ? '' : '<button class="btn sm primary" data-action="pp-contact" data-id="' + post.id + '">查看联系方式</button>') +
      '</div>' +
      (post.status === 'open' && !isOwner && !inList && members.length < cap
        ? '<div class="notice ok mt-12">加入后，发起人会收到通知并确认；费用在成团结算时支付。</div>' : '') +
      (inList && !isOwner && post.status === 'open'
        ? '<div class="notice mt-12">你已在成员名单中。若无法参加，请及时退出，避免影响他人安排。</div>' : '');

    // 拼车出行安全提示（来自策划组用户痛点：顺风车价格高又不放心）
    if (post.type === 'carpool') {
      body += '<div class="safe-card mt-12"><h4>🚗 出行安全提示</h4>' +
        '<ul class="col mt-8" style="gap:6px">' +
          '<li>· 发起人 ' + (V.isPro(owner) ? '为会员' : '为普通用户') + (owner.verified ? '，已完成学生认证' : '，未完成学生认证') + '，信用分 ' + (owner.credit || 0) + '</li>' +
          '<li>· 上车前核对车牌与同行人，行程可一键分享给同学或家人</li>' +
          '<li>· 建议白天出行，长途线路提前告知家人预计到达时间</li>' +
          '<li>· 平台提供信息撮合与行程留痕，承运责任按交通法规处理</li>' +
        '</ul></div>';
    }

    if (!isOwner) {
      var ctx = post.type;
      var q = V.feeFor(ctx, me, post.price || 0);
      body += '<div class="notice gold mt-12">费用说明：' + (post.type === 'carpool' ? '人均 ' + U.money(post.price) + '，' : post.price ? '人均约 ' + U.money(post.price) + '，' : '免费，') +
        '当前阶段（' + V.stage().name + '）' + ctx + '规则为 <b>' + q.label + '</b>' +
        (q.mode === 'free' ? '，平台本单不收费。' : q.mode === 'service' ? '，成团时由发起人承担。' : '，由发起人收款时扣除。') + '</div>';
    }

    var foot;
    if (isOwner) {
      foot = '<button class="btn outline danger" data-action="pp-delete" data-id="' + post.id + '">删除</button>' +
        (post.status === 'open' ? '<button class="btn outline" data-action="pp-close" data-id="' + post.id + '">停止招募</button>' : '') +
        (post.type === 'carpool' ? '<button class="btn outline" data-action="share-trip" data-id="' + post.id + '">分享行程</button>' : '') +
        (V.isPro(me) || U.isBoosted(post) ? '' : '<button class="btn outline" data-action="boost-post" data-id="' + post.id + '">⚡ 加曝光 ' + U.money(V.s().boostPrice) + '</button>') +
        '<button class="btn primary" data-action="pp-settle" data-id="' + post.id + '">' + (post.type === 'partner' || post.type === 'collab' ? '确认结束' : '成团并结算') + '</button>';
    } else if (inList) {
      foot = '<button class="btn outline danger" data-action="pp-leave" data-id="' + post.id + '">退出拼拼</button>' +
        (post.type === 'carpool' ? '<button class="btn outline" data-action="share-trip" data-id="' + post.id + '">分享行程</button>' : '') +
        '<button class="btn primary" data-action="pp-contact" data-id="' + post.id + '">查看发起人联系方式</button>';
    } else {
      var full = members.length >= cap || post.status !== 'open';
      foot = '<button class="btn outline" data-action="pp-fav" data-id="' + post.id + '">收藏</button>' +
        (post.type === 'carpool' ? '<button class="btn outline" data-action="share-trip" data-id="' + post.id + '">分享行程</button>' : '') +
        '<button class="btn primary" data-action="pp-join" data-id="' + post.id + '"' + (full ? ' disabled' : '') + '>' +
        (post.status !== 'open' ? '已停止招募' : members.length >= cap ? '已满员' : '申请加入') + '</button>';
    }
    return { body: body, foot: foot };
  };

  /* ====================== 详情：代代 ====================== */
  V.views.detailDaidai = function (post) {
    var me = V.me();
    var owner = V.user(post.ownerId);
    var isTrip = post.kind === 'trip';
    var isOwner = owner.id === me.id;
    var isTaker = post.takerId === me.id;
    var st = U.DD_STATUS[post.status] || { label: post.status, cls: '' };
    var order = V.db.orders.filter(function (o) { return o.refType === 'daidai' && o.refId === post.id; })[0];
    var contact = post.contact || ('微信：' + owner.nickname);
    var canSee = isOwner || isTaker || V.isPro(me);
    var feeText = post.fee > 50 ? U.money(post.fee) + ' 固定' : post.fee + '% 按小票';

    var body =
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<span class="badge ' + (isTrip ? 'ok' : 'info') + '">' + (isTrip ? '🧳 可代购行程' : '🎯 代购需求') + '</span>' +
        '<span class="tag">' + U.esc(post.category) + '</span>' +
        '<span class="badge ' + st.cls + '">' + st.label + '</span>' +
        (U.isProBoost(post, owner) ? U.proTagHTML(true) : '') +
        U.boostTagHTML(post) +
      '</div>' +
      (V.CAT_DESC[post.category] ? '<div class="tiny muted mt-8">' + V.CAT_DESC[post.category] + '</div>' : '') +
      '<h2 style="font-size:19px;font-weight:800;margin-top:12px">' + U.esc(post.title) + '</h2>' +
      '<p class="small mt-8" style="color:var(--ink-2);white-space:pre-wrap">' + U.esc(post.desc) + '</p>' +
      '<div class="divider"></div>' +
      '<dl class="kv">' +
        '<dt>' + (isTrip ? '出发地' : '需要从') + '</dt><dd>' + U.esc(post.from) + '</dd>' +
        (post.to ? '<dt>送到</dt><dd>' + U.esc(post.to) + '</dd>' : '') +
        '<dt>时间</dt><dd>' + U.fmtDateTime(post.expectAt) + '</dd>' +
        '<dt>代购费</dt><dd><b style="color:var(--accent)">' + feeText + '</b></dd>' +
        '<dt>预算</dt><dd>' + (post.budget ? U.money(post.budget) : '未填写') + '</dd>' +
        (post.tags && post.tags.length ? '<dt>标签</dt><dd>' + post.tags.map(function (t) { return '<span class="tag">' + U.esc(t) + '</span>'; }).join(' ') + '</dd>' : '') +
        '<dt>发布</dt><dd>' + U.timeAgo(post.createdAt) + '</dd>' +
      '</dl>' +
      (order ? '<div class="divider"></div><div class="item"><div class="grow small"><b>关联订单 ' + order.no + '</b>' +
        '<div class="muted mt-8">状态：' + (U.ORDER_STATUS[order.status] || {}).label + ' · 金额 ' + U.money(order.amount) +
        ' · 佣金 ' + U.money(order.commission) + '（' + U.pct(order.rate) + '）</div></div>' +
        '<button class="btn sm outline" data-action="order-open" data-id="' + order.id + '">查看订单</button></div>' : '') +
      '<div class="divider"></div>' +
      '<div class="row" style="gap:12px">' + U.avatar(owner) +
        '<div class="grow small"><b>' + U.esc(owner.nickname) + '</b> ' + U.proBadge(owner) +
        '<div class="tiny muted mt-8">' + U.esc(owner.intro || '这个人很懒，什么都没写') + '</div></div></div>' +
      '<div class="item mt-12" style="align-items:center">' +
        '<span class="grow small"><b>联系方式</b><div class="muted">' + (canSee ? U.esc(contact) : U.maskContact(contact)) + '</div>' +
        (canSee ? '' : '<div class="tiny muted">普通用户每日 ' + V.s().contactFreeDaily + ' 次，会员不限次</div>') + '</span>' +
        (canSee ? '' : '<button class="btn sm primary" data-action="dd-contact" data-id="' + post.id + '">消耗 1 次查看</button>') +
      '</div>';

    if (!isOwner && post.fee) {
      var refAmount = post.budget || 200;
      var est = post.fee > 50 ? post.fee : V.round2(refAmount * post.fee / 100);
      var dq = V.feeFor('daidai', owner, refAmount + est);
      body += '<div class="notice gold mt-12">费用预估：商品 ' + U.money(refAmount) + ' + 代购费 ' + U.money(est) +
        ' ≈ ' + U.money(refAmount + est) + '。当前阶段（' + V.stage().name + '）代代订单规则为 <b>' + dq.label + '</b>' +
        (dq.mode === 'free' ? '，平台本单不收费。' : '，订单完成后从代购方收入中扣除。') + '</div>';
    }

    var foot;
    if (isOwner) {
      foot = '<button class="btn outline danger" data-action="dd-delete" data-id="' + post.id + '">删除</button>' +
        (V.isPro(me) || U.isBoosted(post) ? '' : '<button class="btn outline" data-action="boost-post" data-id="' + post.id + '">⚡ 加曝光 ' + U.money(V.s().boostPrice) + '</button>') +
        (order ? '<button class="btn primary" data-action="order-open" data-id="' + order.id + '">查看订单</button>' : '');
    } else if (post.status === 'open') {
      foot = '<button class="btn outline" data-action="dd-contact" data-id="' + post.id + '">先问一句</button>' +
        '<button class="btn primary" data-action="dd-take" data-id="' + post.id + '">' +
        (isTrip ? '我要代购（下单）' : '我接这一单') + '</button>';
    } else {
      foot = order ? '<button class="btn primary" data-action="order-open" data-id="' + order.id + '">查看订单</button>' : '';
    }
    return { body: body, foot: foot };
  };
})();
