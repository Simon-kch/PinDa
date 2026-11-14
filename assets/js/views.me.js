/* ==========================================================================
   PinDa · 订单 / 钱包 / 会员中心 / 消息 / 个人中心
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  V.views = V.views || {};
  V.state = V.state || {};
  V.state.order = { scope: 'all', mine: 'all' };

  function roleOf(order, me) {
    if (order.buyerId === me.id && order.sellerId === me.id) return '双方';
    if (order.buyerId === me.id) return '我付款';
    return '我收款';
  }

  function orderItem(order) {
    var me = V.me();
    var st = U.ORDER_STATUS[order.status] || { label: order.status, cls: '' };
    var counterpartId = order.buyerId === me.id ? order.sellerId : order.buyerId;
    var other = V.user(counterpartId) || { nickname: '平台', avatar: '🛠️', color: '#3B62E8' };
    var isSeller = order.sellerId === me.id;
    var role = roleOf(order, me);
    return '<div class="item hoverable" data-action="order-open" data-id="' + order.id + '" style="cursor:pointer;flex-wrap:wrap">' +
      '<span class="post-top" style="flex:none">' + U.avatar(other, 'sm') + '</span>' +
      '<div class="grow" style="min-width:220px">' +
        '<div class="row" style="gap:6px;flex-wrap:wrap"><b class="small">' + U.esc(order.title || '订单') + '</b>' +
          '<span class="badge ' + st.cls + '">' + st.label + '</span>' +
          '<span class="badge ' + (role === '我收款' ? 'ok' : 'info') + '">' + role + '</span>' +
          '<span class="badge">' + (order.refType === 'pinpin' ? '拼拼' : '代代') + '</span></div>' +
        '<div class="tiny muted mt-8">订单号 ' + order.no + ' · ' + U.fmtDateTime(order.createdAt) +
          ' · 对方 ' + U.esc(other.nickname) + '</div>' +
        '<div class="tiny mt-8">成交 <b>' + U.money(order.amount) + '</b> · 平台费用 ' +
          (order.commission ? '<b>' + U.money(order.commission) + '</b>' + (order.feeMode === 'service' ? '（服务费）' : '（' + U.pct(order.rate) + '）') : '<b>免费</b>') +
          ' · ' + (isSeller ? '到手 <b>' + U.money(order.net) + '</b>' : '应付 <b>' + U.money(order.amount) + '</b>') + '</div>' +
      '</div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' + orderActions(order, false) + '</div>' +
    '</div>';
  }

  function orderActions(order, big) {
    var me = V.me();
    var isBuyer = order.buyerId === me.id, isSeller = order.sellerId === me.id;
    var cls = 'btn sm ' + (big ? 'lg ' : '');
    var out = [];
    if (order.status === 'pending' && isBuyer) out.push('<button class="' + cls + 'primary" data-action="order-pay" data-id="' + order.id + '">立即支付</button>');
    if (order.status === 'processing') {
      if (isBuyer) out.push('<button class="' + cls + 'primary" data-action="order-deliver" data-id="' + order.id + '">确认已收到</button>');
      if (isSeller) out.push('<button class="' + cls + 'primary" data-action="order-deliver" data-id="' + order.id + '">标记已交付</button>');
      out.push('<button class="' + cls + 'outline" data-action="order-progress" data-id="' + order.id + '">更新进度</button>');
    }
    if (order.status === 'delivered' && isBuyer) out.push('<button class="' + cls + 'primary" data-action="order-complete" data-id="' + order.id + '">确认完成并结算</button>');
    if ((order.status === 'pending' || order.status === 'processing') && (isBuyer || isSeller)) {
      out.push('<button class="' + cls + 'outline danger" data-action="order-cancel" data-id="' + order.id + '">取消订单</button>');
    }
    if (order.status === 'completed' && order.commission > 0) {
      out.push('<button class="' + cls + 'outline" data-action="order-invoice" data-id="' + order.id + '">佣金明细</button>');
    }
    if (order.status === 'completed' && !order.reviewed && isBuyer) {
      out.push('<button class="' + cls + 'outline" data-action="order-review" data-id="' + order.id + '">评价</button>');
    }
    if (order.status !== 'cancelled' && order.status !== 'completed') {
      out.push('<button class="' + cls + 'ghost" data-action="order-help" data-id="' + order.id + '">客服介入</button>');
    }
    if (!out.length) out.push('<button class="' + cls + 'outline" data-action="order-open" data-id="' + order.id + '">查看详情</button>');
    return out.join('');
  }

  /* ====================== 我的订单 ====================== */
  V.views.orders = function () {
    var me = V.me();
    V.state.order = V.state.order || { scope: 'all', mine: 'all' };
    var f = V.state.order;
    var all = V.ordersOf(me.id);
    var list = all.filter(function (o) {
      if (f.scope === 'doing' && (o.status === 'completed' || o.status === 'cancelled')) return false;
      if (f.scope === 'done' && o.status !== 'completed') return false;
      if (f.scope === 'cancel' && o.status !== 'cancelled') return false;
      if (f.mine === 'buy' && o.buyerId !== me.id) return false;
      if (f.mine === 'sell' && o.sellerId !== me.id) return false;
      return true;
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    var income = all.filter(function (o) { return o.sellerId === me.id && o.status === 'completed'; })
      .reduce(function (a, o) { return a + o.net; }, 0);
    var spend = all.filter(function (o) { return o.buyerId === me.id && o.status === 'completed'; })
      .reduce(function (a, o) { return a + o.amount; }, 0);
    var feePaid = all.filter(function (o) { return o.sellerId === me.id && o.status === 'completed'; })
      .reduce(function (a, o) { return a + o.commission; }, 0);
    var doing = all.filter(function (o) { return o.status !== 'completed' && o.status !== 'cancelled'; }).length;

    return '<div class="wrap">' +
      '<div class="sec-title">📦 我的订单</div>' +
      '<div class="sec-sub">每一笔交易都会留痕，成交后平台按费率自动结算佣金。</div>' +
      '<div class="grid c4 mt-16">' +
        U.stat('进行中', doing + ' 单') +
        U.stat('我付款累计', U.money(spend), '已完成的支出') +
        U.stat('我收款累计', U.money(income), '已完成订单到手金额', 'brand') +
        U.stat('平台已抽佣金', U.money(feePaid), '按 ' + U.pct(V.rateFor(me)) + ' 计', 'gold') +
      '</div>' +
      '<div class="card mt-16" style="padding:14px">' +
        '<div class="row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="chips">' +
            [['all', '全部'], ['doing', '进行中'], ['done', '已完成'], ['cancel', '已取消']].map(function (t) {
              return '<button class="chip ' + (f.scope === t[0] ? 'on' : '') + '" data-action="order-scope" data-value="' + t[0] + '">' + t[1] + '</button>';
            }).join('') + '</div>' +
          '<div class="seg" style="margin-left:auto">' +
            [['all', '全部角色'], ['buy', '我是付款方'], ['sell', '我是收款方']].map(function (t) {
              return '<button class="' + (f.mine === t[0] ? 'on' : '') + '" data-action="order-mine" data-value="' + t[0] + '">' + t[1] + '</button>';
            }).join('') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mt-16">' +
        (list.length ? list.map(orderItem).join('') : U.empty('暂无订单，去拼拼或代代看看有什么可以参与', '📦')) +
      '</div>' +
    '</div>';
  };

  /* ====================== 订单详情 ====================== */
  V.views.orderDetail = function (order) {
    var me = V.me();
    var buyer = V.user(order.buyerId) || { nickname: '平台', avatar: '🛠️', color: '#3B62E8' };
    var seller = V.user(order.sellerId) || { nickname: '平台', avatar: '🛠️', color: '#3B62E8' };
    var st = U.ORDER_STATUS[order.status] || { label: order.status, cls: '' };
    var steps = ['pending', 'processing', 'delivered', 'completed'];
    var curIdx = steps.indexOf(order.status);
    if (order.status === 'cancelled') curIdx = -1;
    var stepNames = { pending: '创建订单 / 待支付', processing: '进行中', delivered: '已交付待确认', completed: '交易完成并结算' };

    var body =
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<span class="badge ' + st.cls + '">' + st.label + '</span>' +
        '<span class="badge">' + (order.refType === 'pinpin' ? '🧩 拼拼' : '🎒 代代') + '</span>' +
        '<span class="badge">订单号 ' + order.no + '</span>' +
      '</div>' +
      '<h2 style="font-size:18px;font-weight:800;margin-top:12px">' + U.esc(order.title || '') + '</h2>' +
      '<div class="divider"></div>' +
      '<div class="card flat" style="background:#FAFBFE">' +
        '<div class="kv">' +
          '<dt>成交金额</dt><dd><b>' + U.money(order.amount) + '</b></dd>' +
          '<dt>平台费用</dt><dd>' + (order.commission
            ? U.money(order.commission) + ' <span class="badge ' + (order.rate === V.s().commissionPro ? 'pro' : '') + '">' + (order.feeLabel || ('费率 ' + U.pct(order.rate))) + '</span>'
            : '<b>免费</b> <span class="badge ok">' + V.stage().name + ' 免收</span>') + '</dd>' +
          '<dt>收款方到手</dt><dd><b style="color:var(--ok)">' + U.money(order.net) + '</b></dd>' +
          '<dt>付款方应付</dt><dd>' + U.money(order.amount) + '（平台费用由收款方承担）</dd>' +
          '<dt>收费规则</dt><dd class="tiny muted">当前阶段：' + V.stage().name + '（' + V.CONTEXT_LABEL[order.context || (order.refType === 'pinpin' ? 'groupbuy' : 'daidai')] +
            '：' + (order.commission ? U.money(order.commission) : '免费') + '）。普通用户 ' + U.pct(V.s().commissionFree) + ' · 会员 ' + U.pct(V.s().commissionPro) + '。</dd>' +
        '</div>' +
      '</div>' +
      '<div class="grid c2 mt-16" style="gap:12px">' +
        '<div class="item">' + U.avatar(buyer, 'sm') + '<div class="grow small"><b>' + U.esc(buyer.nickname) + '</b><div class="tiny muted">付款方</div></div></div>' +
        '<div class="item">' + U.avatar(seller, 'sm') + '<div class="grow small"><b>' + U.esc(seller.nickname) + '</b><div class="tiny muted">收款方</div></div></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="small strong">状态流转</div>' +
      '<ul class="timeline mt-12">' + steps.map(function (k, i) {
        var cls = curIdx > i ? 'done' : curIdx === i ? 'now' : 'todo';
        var hit = (order.timeline || []).filter(function (t) { return t.text.indexOf(stepNames[k].slice(0, 2)) >= 0; })[0];
        return '<li class="' + cls + '"><b>' + stepNames[k] + '</b>' +
          (hit ? '<div class="tiny muted">' + U.fmtDateTime(hit.at) + ' · ' + U.esc(hit.text) + '</div>' : '') + '</li>';
      }).join('') + '</ul>' +
      '<div class="divider"></div>' +
      '<div class="small strong">操作日志</div>' +
      '<div class="col mt-8" style="gap:6px">' + (order.timeline || []).map(function (t) {
        return '<div class="tiny muted">· ' + U.fmtDateTime(t.at) + '　' + U.esc(t.text) + '</div>';
      }).join('') + '</div>' +
      (order.status === 'completed' && order.sellerId === me.id
        ? '<div class="notice ok mt-16">本单已结算：成交 ' + U.money(order.amount) +
          (order.commission ? ' − 平台费用 ' + U.money(order.commission) : '（本单免费）') +
          ' = <b>' + U.money(order.net) + '</b> 已进入你的钱包余额。</div>' : '');

    return { body: body, foot: orderActions(order, true) };
  };

  /* ====================== 钱包 ====================== */
  V.views.wallet = function () {
    var me = V.me();
    V.state.walletType = V.state.walletType || 'all';
    var f = V.state.walletType;
    var rows = V.db.wallet.filter(function (w) { return w.userId === me.id; });
    if (f !== 'all') rows = rows.filter(function (w) { return w.type === f; });
    rows = rows.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    var allRows = V.db.wallet.filter(function (w) { return w.userId === me.id; });
    var income = allRows.filter(function (w) { return w.amount > 0; }).reduce(function (a, w) { return a + w.amount; }, 0);
    var expense = allRows.filter(function (w) { return w.amount < 0; }).reduce(function (a, w) { return a - w.amount; }, 0);
    var commissionPaid = V.db.orders.filter(function (o) { return o.sellerId === me.id && o.status === 'completed'; })
      .reduce(function (a, o) { return a + o.commission; }, 0);
    var typeLabel = { topup: ['充值', 'ok'], expense: ['支出', ''], income: ['收入', 'ok'], withdraw: ['提现', 'warn'], membership: ['会员', 'pro'] };

    return '<div class="wrap">' +
      '<div class="sec-title">💳 钱包与流水</div>' +
      '<div class="sec-sub">平台收入与佣金都会在此留痕，方便对账。</div>' +
      '<div class="grid c4 mt-16">' +
        U.stat('可用余额', U.money(me.balance), '演示环境可任意充值', 'brand') +
        U.stat('累计收入', U.money(income), '含订单到手金额') +
        U.stat('累计支出', U.money(expense), '不含平台佣金代扣') +
        U.stat('累计被抽佣金', U.money(commissionPaid), '按 ' + U.pct(V.rateFor(me)) + ' 计', 'gold') +
      '</div>' +
      '<div class="grid side mt-16">' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title">流水明细</div>' +
            '<div class="row" style="gap:10px"><button class="btn sm primary" data-action="wallet-topup">模拟充值</button>' +
            '<button class="btn sm outline" data-action="wallet-withdraw">提现</button></div></div>' +
          '<div class="chips">' +
            [['all', '全部'], ['income', '收入'], ['expense', '支出'], ['topup', '充值'], ['withdraw', '提现']].map(function (t) {
              return '<button class="chip ' + (f === t[0] ? 'on' : '') + '" data-action="wallet-type" data-value="' + t[0] + '">' + t[1] + '</button>';
            }).join('') + '</div>' +
          '<div class="mt-16">' +
            (rows.length ? rows.map(function (w) {
              var tl = typeLabel[w.type] || ['流水', ''];
              return '<div class="item" style="padding:12px">' +
                '<span class="grow small"><b>' + U.esc(w.note) + '</b>' +
                '<div class="tiny muted mt-8">' + U.fmtDateTime(w.createdAt) + ' · ' + tl[0] + '</div></span>' +
                '<b style="color:' + (w.amount > 0 ? 'var(--ok)' : 'var(--ink)') + '">' + (w.amount > 0 ? '+' : '') + U.money(w.amount) + '</b>' +
              '</div>';
            }).join('') : U.empty('暂无流水')) +
          '</div>' +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">💰 佣金怎么算</div>' +
            '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
              '<tr><td>你的身份</td><td><b>' + (V.isPro(me) ? '👑 会员' : '普通用户') + '</b></td></tr>' +
              '<tr><td>当前阶段</td><td><b>' + V.stage().name + '</b></td></tr>' +
              '<tr><td>代代订单</td><td>' + V.feeFor('daidai', me, 100).label + '</td></tr>' +
              '<tr><td>拼单购物</td><td>' + (V.chargeMode('groupbuy') === 'free' ? '免费'
                : V.chargeMode('groupbuy') === 'service' ? U.money(V.s().serviceFee) + '/单' + (V.isPro(me) ? '（会员免收）' : '')
                  : U.pct(V.s().commissionFree)) + '</td></tr>' +
              '<tr><td>合作机会</td><td>' + (V.chargeMode('collab') === 'free' ? '免费'
                : V.chargeMode('collab') === 'service' ? U.money(V.s().serviceFee) + '/单' + (V.isPro(me) ? '（会员免收）' : '')
                  : U.pct(V.s().commissionFree)) + '</td></tr>' +
              '<tr><td>拼车出行</td><td>' + (V.chargeMode('carpool') === 'free' ? '<b>免费</b>' : '服务费 ' + U.money(V.s().serviceFee)) + '</td></tr>' +
            '</tbody></table></div>' +
            '<div class="notice mt-12">平台按' + V.stage().name + '执行收费：' + V.stage().note + '</div>' +
            (V.isPro(me) ? '<div class="notice ok mt-12">会员权益生效中：优先展示、不限次查看联系方式、拼单服务费免收、代代费率 ' + U.pct(V.s().commissionPro) + '。</div>'
              : '<a class="btn gold block mt-12" href="#/member">👑 查看会员权益与票价</a>') +
          '</div>' +
          '<div class="card"><div class="card-title">🏦 提现说明</div>' +
            '<p class="small muted mt-8">演示环境提现为即时到账（不产生真实资金）。真实上线后预计 T+1 到账，最低提现 ¥10。</p></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /* ====================== 会员中心 ====================== */
  V.views.member = function () {
    var me = V.me ? V.me() : null;
    var s = V.s();
    var isPro = me && V.isPro(me);
    var myFee = me ? V.rateFor(me) : s.commissionFree;
    var rows = [
      ['发布条数', s.dailyPostFree + ' 条/日', s.dailyPostPro + ' 条/日'],
      ['查看联系方式', s.contactFreeDaily + ' 次/日', '不限次'],
      ['成交佣金', U.pct(s.commissionFree), U.pct(s.commissionPro)],
      ['信息展示', '按时间排序', '优先展示 + 会员标识'],
      ['高级筛选', '—', '信用分 / 认证 / 价格区间'],
      ['代代新需求', '公开可见', '会员优先派送'],
      ['纠纷处理', '普通排队', '优先响应']
    ];
    var header = me ? '' :
      '<div class="notice gold mt-16">你当前未登录，以下为会员权益预览。<a class="link-plain" href="#/register">立即注册并开通 →</a></div>';

    return '<div class="wrap">' + (me ? '' : '<div class="mt-16"></div>') +
      '<div class="sec-title">👑 PinDa 会员中心</div>' +
      '<div class="sec-sub">更低佣金 + 更高曝光 + 更快成交。</div>' +
      header +
      (me ? '<div class="card pad-lg mt-16" style="background:linear-gradient(120deg,#1B1240,#3A1C6E 55%,#5A3AE0);color:#fff;border:0">' +
        '<div class="between" style="flex-wrap:wrap;gap:16px;align-items:flex-start">' +
          '<div><div class="row" style="gap:10px">' + U.avatar(me, 'lg') +
            '<div><b style="font-size:18px">' + U.esc(me.nickname) + '</b>' +
            '<div class="row mt-8" style="gap:8px">' + (isPro
              ? '<span class="badge pro">👑 PinDa 会员 · 剩 ' + V.memberDaysLeft(me) + ' 天</span>'
              : '<span class="badge">普通用户</span>') + '</div>' +
            '<div class="tiny mt-8" style="color:rgba(255,255,255,.72)">' +
              (isPro ? '到期时间 ' + U.fmtDate(me.memberExpire) : '升级后立即享受会员特权') + '</div></div></div>' +
          '</div>' +
          '<div class="card" style="min-width:240px;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);color:#fff">' +
            '<div class="k small">当前成交佣金费率</div>' +
            '<div style="font-size:30px;font-weight:800">' + U.pct(myFee) + '</div>' +
            '<div class="tiny" style="color:rgba(255,255,255,.75)">会员费率 ' + U.pct(s.commissionPro) + '，每 ¥100 多拿 ' +
              U.money(100 * (s.commissionFree - s.commissionPro)) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' : '') +

      '<div class="grid c2 mt-16">' +
        '<div class="plan' + (isPro ? '' : ' pro') + '">' +
          (isPro ? '' : '<span class="ribbon">推荐首选</span>') +
          '<h3>PinDa 会员 · 学期卡</h3><div class="muted small">覆盖 ' + s.termMonths + ' 个月，适合学期内高频拼车与长期代购</div>' +
          '<div class="price mt-12">' + U.money(s.priceTerm) + '<small> / ' + s.termMonths + ' 个月（约 ' + U.money(V.round2(s.priceTerm / s.termMonths)) + '/月）</small></div>' +
          '<ul>' + V.privileges.slice(0, 5).map(function (p) {
            return '<li><span class="tick">✓</span> ' + p.title + '：' + U.esc(p.desc) + '</li>';
          }).join('') + '</ul>' +
          '<button class="btn ' + (isPro ? 'outline' : 'gold') + ' block mt-16" data-action="member-buy" data-plan="term">' +
            (isPro ? '续费学期卡（' + U.money(s.priceTerm) + '）' : '开通学期卡 ' + U.money(s.priceTerm)) + '</button>' +
        '</div>' +
        '<div class="plan">' +
          '<h3>PinDa 会员 · 月卡</h3><div class="muted small">先试一个月，随时可升级学期卡</div>' +
          '<div class="price mt-12">' + U.money(s.priceMonthly) + '<small> / 月</small></div>' +
          '<ul>' + V.privileges.slice(5).map(function (p) {
            return '<li><span class="tick">✓</span> ' + p.title + '：' + U.esc(p.desc) + '</li>';
          }).join('') +
          '<li><span class="tick">✓</span> 以上全部特权（会员权益一致，仅时长不同）</li></ul>' +
          '<button class="btn outline block mt-16" data-action="member-buy" data-plan="monthly">开通月卡 ' + U.money(s.priceMonthly) + '</button>' +
          '<div class="tiny muted mt-12">会员到期后自动降为普通用户，不会自动扣费。</div>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-16"><div class="card-title">📊 权益对比</div>' +
        '<div class="table-wrap mt-12"><table class="tb">' +
          '<thead><tr><th>权益</th><th>普通注册</th><th>👑 PinDa 会员</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr><td>' + r[0] + '</td><td class="muted">' + r[1] + '</td><td><b style="color:var(--brand-700)">' + r[2] + '</b></td></tr>';
          }).join('') +
        '</tbody></table></div>' +
      '</div>' +

      '<div class="card mt-16"><div class="card-title">🧮 算一算：会员能省多少</div>' +
        '<p class="small muted mt-8">输入你预计一学期的成交总额（你作为收款方的部分），看看两种身份的佣金差。</p>' +
        '<div class="row mt-12" style="gap:10px;flex-wrap:wrap">' +
          '<input class="input" id="calc-amount" type="number" value="3000" min="0" style="max-width:180px">' +
          '<span class="small muted">元 / 学期</span>' +
        '</div>' +
        '<div class="grid c3 mt-16" id="calc-out">' + calcBox(3000) + '</div>' +
      '</div>' +

      '<div class="card mt-16"><div class="card-title">🎯 会员专属权益细则</div>' +
        '<div class="grid c2 mt-12" style="gap:14px">' + V.privileges.map(function (p) {
          return '<div class="item"><span style="font-size:20px">' + p.icon + '</span><div class="grow small"><b>' + p.title + '</b>' +
            '<div class="tiny muted mt-8">' + U.esc(p.desc) + '</div>' +
            '<div class="row mt-8" style="gap:6px"><span class="badge">普通：' + (p.free === false ? '不支持' : p.free === true ? '支持' : p.free) + '</span>' +
            '<span class="badge pro">会员：' + (p.pro === true ? '支持' : p.pro) + '</span></div></div></div>';
        }).join('') + '</div>' +
      '</div>' +
    '</div>';
  };

  function calcBox(amount) {
    var s = V.s();
    var free = V.round2(amount * s.commissionFree);
    var pro = V.round2(amount * s.commissionPro);
    var save = V.round2(free - pro);
    var price = s.priceTerm;
    var net = V.round2(save - price);
    return U.stat('普通用户佣金', U.money(free), U.pct(s.commissionFree)) +
      U.stat('会员佣金', U.money(pro), U.pct(s.commissionPro), 'gold') +
      U.stat('会员净省', U.money(net), '已扣除学期卡 ' + U.money(price) + (net > 0 ? '（更划算）' : '（暂不划算）'), 'brand');
  }
  V.calcBox = calcBox;

  /* ====================== 消息 ====================== */
  V.views.messages = function () {
    var me = V.me();
    V.state.msgFilter = V.state.msgFilter || 'all';
    var f = V.state.msgFilter;
    var all = V.db.messages.filter(function (m) { return m.userId === me.id; });
    var list = all.filter(function (m) { return f === 'all' ? true : f === 'unread' ? !m.read : m.read; })
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    var unread = all.filter(function (m) { return !m.read; }).length;

    return '<div class="wrap">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        '<div><div class="sec-title">🔔 消息中心</div><div class="sec-sub">订单、拼拼申请、佣金到账都会在这里提醒。</div></div>' +
        '<button class="btn outline" data-action="msg-read-all">全部标为已读</button>' +
      '</div>' +
      '<div class="chips mt-16">' +
        [['all', '全部 ' + all.length], ['unread', '未读 ' + unread], ['read', '已读']].map(function (t) {
          return '<button class="chip ' + (f === t[0] ? 'on' : '') + '" data-action="msg-filter" data-value="' + t[0] + '">' + t[1] + '</button>';
        }).join('') + '</div>' +
      '<div class="mt-16">' + (list.length ? list.map(function (m) {
        return '<div class="item hoverable" data-action="msg-open" data-id="' + m.id + '" style="cursor:pointer">' +
          '<span style="font-size:20px">' + (!m.read ? '📩' : '📭') + '</span>' +
          '<div class="grow"><div class="row" style="gap:6px;flex-wrap:wrap"><b class="small">' + U.esc(m.title) + '</b>' +
          (!m.read ? '<span class="badge danger">未读</span>' : '<span class="badge">已读</span>') +
          '<span class="badge">' + U.timeAgo(m.createdAt) + '</span></div>' +
          '<div class="small muted mt-8">' + U.esc(m.body) + '</div></div>' +
          (m.link ? '<span class="btn sm outline">查看</span>' : '') + '</div>';
      }).join('') : U.empty('没有消息', '📭')) + '</div>' +
    '</div>';
  };

  /* ====================== 个人中心 ====================== */
  V.views.profile = function () {
    var me = V.me();
    var s = V.s();
    var avatars = ['🙂', '🌸', '🎧', '🏀', '📚', '🚲', '☕', '🎮', '✈️', '🍜', '🐱', '🐳', '🌙', '⭐', '🍰', '🎨'];
    var myPP = V.pinpin().filter(function (p) { return p.ownerId === me.id; });
    var myDD = V.daidai().filter(function (p) { return p.ownerId === me.id || p.takerId === me.id; });
    var myFavs = (me.favs || []).map(V.findPinpin).filter(Boolean);

    return '<div class="wrap">' +
      '<div class="sec-title">👤 个人中心</div>' +
      '<div class="grid side mt-16">' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">资料设置</div>' +
            '<form data-form="profile" class="mt-12">' +
              '<div class="field"><label>头像</label><div class="chips" style="flex-wrap:wrap;overflow:visible">' +
                avatars.map(function (a) {
                  return '<label class="chip ' + (me.avatar === a ? 'on' : '') + '" data-avatar="' + a + '">' + a +
                    '<input type="radio" name="avatar" value="' + a + '" ' + (me.avatar === a ? 'checked' : '') + ' class="hide"></label>';
                }).join('') + '</div></div>' +
              '<div class="form-grid mt-16">' +
                '<div class="field"><label>昵称</label><input class="input" name="nickname" value="' + U.esc(me.nickname) + '"></div>' +
                '<div class="field"><label>手机号</label><input class="input" name="phone" value="' + U.esc(me.phone) + '"></div>' +
                '<div class="field"><label>校区</label><select class="select" name="campus">' +
                  s.campuses.map(function (c) { return '<option' + (me.campus === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
                '</select><span class="hint">SIP = 苏州工业园区校区 · TC = 太仓校区</span></div>' +
                '<div class="field"><label>年级</label><input class="input" name="grade" value="' + U.esc(me.grade) + '"></div>' +
                '<div class="field"><label>专业</label><select class="select" name="college" data-major-select>' +
                  V.programmeOptions(me.college) +
                '</select><input class="input mt-8' + (me.college === V.OTHER_MAJOR ? '' : ' hide') + '" name="collegeOther" data-other-major-input placeholder="请填写你的专业名称"><span class="hint">示例专业库来自西浦官网，共 ' + V.PROGRAMME_SOURCE.total + ' 个；其它学校可选「其它专业」</span></div>' +
                '<div class="field"><label>学号</label><input class="input" value="' + U.esc(me.studentId || '') + '" placeholder="在下方完成认证" disabled></div>' +
                '<div class="field full"><label>一句话介绍</label><textarea class="textarea" name="intro">' + U.esc(me.intro) + '</textarea></div>' +
              '</div>' +
              '<button class="btn primary mt-16" type="submit">保存资料</button>' +
            '</form>' +
          '</div>' +
          '<div class="card"><div class="card-title">我的发布</div>' +
            '<div class="mt-12">' +
              (myPP.length ? myPP.map(function (p) { return V.cardPinpin(p); }).join('') : '') +
              (myDD.length ? myDD.map(function (p) { return V.cardDaidai(p); }).join('') : '') +
              (!myPP.length && !myDD.length ? U.empty('还没有发布过内容', '📝') : '') +
            '</div>' +
          '</div>' +
          '<div class="card"><div class="card-title">我的收藏</div>' +
            '<div class="mt-12">' + (myFavs.length ? myFavs.map(function (p) { return V.cardPinpin(p); }).join('') : U.empty('收藏夹是空的', '⭐')) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card center">' + U.avatar(me, 'xl') +
            '<div class="mt-12"><b style="font-size:17px">' + U.esc(me.nickname) + '</b></div>' +
            '<div class="row mt-8" style="gap:6px;justify-content:center;flex-wrap:wrap">' +
              (V.isPro(me) ? '<span class="badge pro">👑 会员 · 剩 ' + V.memberDaysLeft(me) + ' 天</span>' : '<span class="badge">普通用户</span>') +
              (me.verified ? '<span class="badge ok">已认证</span>' : '<span class="badge warn">未认证</span>') +
            '</div>' +
            '<div class="grid c2 mt-16" style="gap:10px">' +
              '<div><b style="font-size:20px">' + me.credit + '</b><div class="tiny muted">信用分</div></div>' +
              '<div><b style="font-size:20px">' + (me.rating || 0).toFixed(1) + '</b><div class="tiny muted">好评</div></div>' +
            '</div>' +
            '<div class="tiny muted mt-12">' + U.esc(me.intro || '还没有填写介绍') + '</div>' +
            (V.isPro(me) ? '' : '<a class="btn gold block mt-16" href="#/member">👑 升级会员</a>') +
          '</div>' +
          '<div class="card"><div class="card-title">🎓 学生认证</div>' +
            '<div class="mt-12">' +
              (me.verified
                ? '<div class="notice ok">已认证' + (me.verifiedBy === 'official' ? '（平台官方账号）' : '（校园邮箱验证）') + '</div>'
                : '<div class="notice warn">未认证：信息排序靠后，成交率更低</div>') +
            '</div>' +
            '<dl class="kv mt-12">' +
              '<dt>学号</dt><dd>' + (me.studentId ? U.esc(me.studentId) : '<span class="muted">未填写</span>') + '</dd>' +
              '<dt>学校邮箱</dt><dd>' + (me.schoolEmail ? U.esc(V.maskEmail(me.schoolEmail)) : '<span class="muted">未填写</span>') + '</dd>' +
              '<dt>认证方式</dt><dd>' + (me.verified ? '学号 + 邮箱验证码' : '—') + '</dd>' +
            '</dl>' +
            '<button class="btn ' + (me.verified ? 'outline' : 'primary') + ' block mt-12" data-action="verify-student">' +
              (me.verified ? '更新认证信息' : '去认证（学号 + 校园邮箱）') + '</button>' +
            '<div class="tiny muted mt-8">PinDa 不需要学校统一身份密码。<a class="link-plain" data-action="why-no-ebridge">为什么？</a></div>' +
          '</div>' +
          '<div class="card"><div class="card-title">⚙️ 账号与数据</div>' +
            '<div class="col mt-12" style="gap:8px">' +
              '<button class="btn outline block" data-action="profile-pwd">修改密码</button>' +
              '<button class="btn outline block" data-action="data-reset">重置演示数据</button>' +
              '<button class="btn danger block" data-action="logout">退出登录</button>' +
            '</div>' +
            '<div class="tiny muted mt-12">所有数据保存在本机浏览器 localStorage 中，重置后回到初始演示数据。</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };
})();
