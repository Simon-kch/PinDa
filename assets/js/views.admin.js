/* ==========================================================================
   PinDa · 管理台（仅管理员）
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  V.views = V.views || {};
  V.state = V.state || {};
  V.state.adminTab = V.state.adminTab || 'overview';
  V.state.adminContent = V.state.adminContent || 'pinpin';

  V.views.admin = function () {
    var me = V.me();
    if (!me || me.role !== 'admin') {
      return '<div class="wrap"><div class="card pad-lg center">' +
        '<div style="font-size:34px">🔒</div><h2 class="mt-8">需要管理员权限</h2>' +
        '<p class="muted small mt-8">请使用演示账号「PinDa 小助手（管理员）」登录后在个人中心进入管理台。</p>' +
        '<button class="btn primary mt-16" data-action="quick-login" data-user="u_admin">切换为管理员</button></div></div>';
    }
    var tab = V.state.adminTab;
    var tabs = [['overview', '数据概览'], ['business', '商业化'], ['merchants', '商家与推广'], ['users', '用户与会员'], ['content', '内容与举报'], ['settings', '平台设置']];
    return '<div class="wrap">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        '<div><div class="sec-title">🛠️ 平台管理台</div><div class="sec-sub">运营视角：用户、会员收入、佣金抽成与内容合规。</div></div>' +
        '<span class="badge pro">管理员 · ' + U.esc(me.nickname) + '</span>' +
      '</div>' +
      '<div class="tabs mt-16">' + tabs.map(function (t) {
        return '<button class="' + (tab === t[0] ? 'on' : '') + '" data-action="admin-tab" data-value="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>' +
      '<div class="mt-16">' +
        (tab === 'overview' ? overview()
          : tab === 'business' ? businessTab()
            : tab === 'merchants' ? merchantsTab()
              : tab === 'users' ? usersTab()
                : tab === 'content' ? contentTab() : settingsTab()) +
      '</div>' +
    '</div>';
  };

  /* ====================== 商业化（来自策划组梳理的 6 个盈利点 + 三阶段） ====================== */
  var REVENUES = [
    { n: 1, name: '拼拼订单服务费', detail: '拼车小额平台服务费；拼单向组织者或参与方收取透明服务费；合作搭子基础发布免费、高级曝光收费', stages: [2, 3], live: true, logic: '每次成功撮合产生少量收入，拼车与拼单能带来重复使用的机会。' },
    { n: 2, name: '代代代办订单抽成', detail: '超市代取、取件、跑腿，以及出国代购与行程顺路带货等合规服务', stages: [2, 3], live: true, logic: '平台不必自己雇佣所有跑腿人员，而是连接有需求的人和有闲暇时间的人。' },
    { n: 3, name: '校园商家推广费', detail: '周边餐厅、奶茶店、超市、文印店付费推广；新店开业、学生优惠、团购活动曝光；提供可追踪的优惠券', stages: [2, 3], live: true, logic: 'PinDa 聚集了有共同地域和消费场景的学生，商家愿意为精准触达付费——前提是确实带来有效曝光或订单。' },
    { n: 4, name: '付费增值服务', detail: '拼单或活动信息优先展示、信息加曝光、合作项目发布、技能服务展示、社团组织管理工具', stages: [2, 3], live: true, logic: '普通用户免费使用核心功能，只有需要更高曝光或额外功能的人才付费。' },
    { n: 5, name: '商家与校园组织合作', detail: '协助社团组织团购、活动报名与出行拼车；与本地商家推出校园专属套餐；按协议收费', stages: [3], live: false, logic: '从零散的个人需求，扩展到社团、活动和商家的批量需求。' },
    { n: 6, name: '会员 / 订阅服务', detail: '高频用户的服务权益、商家月度推广套餐、社团管理订阅', stages: [3], live: true, logic: '形成相对稳定的周期性收入。应等用户有足够使用频率后再推进，初期不建议急着收费。' }
  ];

  function businessTab() {
    var st = V.platformStats();
    var stage = V.stage();
    return '<div class="grid c4">' +
        U.stat('当前阶段', String(stage.id) + ' / 3', stage.name, 'brand') +
        U.stat('订单量', U.num(st.orders) + ' 单', '已完成 ' + st.completed + ' 单') +
        U.stat('订单完成率', st.orderRate + '%', '阶段一重点验证指标', 'gold') +
        U.stat('用户复购率', st.repeatRate + '%', '下单 ≥2 次的用户占比') +
      '</div>' +

      '<div class="card mt-16"><div class="card-head"><div class="card-title">🚦 运营阶段切换</div>' +
        '<span class="small muted">切换后平台收费规则立即生效（订单结算按完成时的阶段计算）</span></div>' +
        '<div class="grid c3">' + [1, 2, 3].map(function (n) {
          var s = V.STAGES[n], on = V.s().stage === n;
          return '<div class="stage' + (on ? ' on' : '') + '">' +
            '<div class="row" style="gap:8px"><span class="no">' + n + '</span>' + (on ? '<span class="badge pro">当前阶段</span>' : '') + '</div>' +
            '<h4>' + s.name.replace(/^第.阶段 · /, '') + '</h4>' +
            '<div class="goal">' + s.goal + '</div>' +
            '<ul>' + s.focus.map(function (f) { return '<li><span class="d">·</span><span>' + f + '</span></li>'; }).join('') + '</ul>' +
            '<div class="tiny muted mt-12">' + s.note + '</div>' +
            '<button class="btn ' + (on ? 'outline' : 'primary') + ' block mt-12" data-action="admin-stage" data-value="' + n + '"' + (on ? ' disabled' : '') + '>' +
              (on ? '当前阶段' : '切换到第 ' + n + ' 阶段') + '</button>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="card mt-16"><div class="card-title">💵 六个潜在收入来源</div>' +
        '<div class="col mt-12" style="gap:10px">' + REVENUES.map(function (r) {
          var active = r.stages.indexOf(V.s().stage) >= 0;
          return '<div class="revenue">' +
            '<span class="n">' + r.n + '</span>' +
            '<div class="grow"><div class="row" style="gap:6px;flex-wrap:wrap"><b class="small">' + r.name + '</b>' +
              '<span class="badge ' + (r.live ? 'ok' : '') + '">' + (r.live ? '原型已实现' : '规划中') + '</span>' +
              '<span class="badge ' + (active ? 'brand' : '') + '">' + (active ? '当前阶段收费' : '当前阶段不收费') + '</span>' +
              '<span class="badge">阶段 ' + r.stages.join(' / ') + ' 启用</span></div>' +
              '<div class="small muted mt-8">' + r.detail + '</div>' +
              '<div class="tiny muted mt-8">盈利逻辑：' + r.logic + '</div></div>' +
            '</div>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="grid c2 mt-16">' +
        '<div class="card"><div class="card-title">📊 当前收入结构</div>' +
          '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
            '<tr><td>交易佣金 / 服务费</td><td><b>' + U.money(st.commission) + '</b></td></tr>' +
            '<tr><td>商家推广（月度）</td><td><b>' + U.money(st.merchantRevenue) + '</b></td></tr>' +
            '<tr><td>会员订阅</td><td><b>' + U.money(st.memberRevenue) + '</b></td></tr>' +
            '<tr><td><b>合计</b></td><td><b>' + U.money(st.commission + st.merchantRevenue + st.memberRevenue) + '</b></td></tr>' +
            '<tr><td>成交总额 GMV</td><td>' + U.money(st.gmv) + '</td></tr>' +
            '<tr><td>平均客单价</td><td>' + U.money(st.avgOrder) + '</td></tr>' +
          '</tbody></table></div>' +
          '<div class="notice mt-12">注意：低金额代取代购订单如果每单抽成太少，容易出现「订单很多但利润很薄」。需要同时算上支付成本、退款、纠纷处理、客服与推广支出。</div>' +
        '</div>' +
        '<div class="card"><div class="card-title">🎤 答辩要点：评委最可能追问的三件事</div>' +
          '<div class="col mt-12" style="gap:12px">' +
            '<div><b class="small">1. 为什么学生不直接在微信群里拼车、找搭子？</b>' +
              '<p class="small muted mt-8">PinDa 提供比微信群更明确的分类、需求匹配、信用评价和交易流程。如果只是把微信群的信息搬到另一个平台，用户没有充分的迁移理由——所以「认证 + 信用分 + 评价 + 订单留痕」是核心卖点，而不是附加功能。</p></div>' +
            '<div><b class="small">2. 为什么用户愿意付服务费？</b>' +
              '<p class="small muted mt-8">付费理由应该是节省时间、提高匹配效率、降低沟通成本，以及获得更可靠的服务。所以基础功能免费，收费只放在明确产生价值的交易与增值服务上（加曝光、会员权益、商家推广）。</p></div>' +
            '<div><b class="small">3. 怎样避免平台有订单却不赚钱？</b>' +
              '<p class="small muted mt-8">要计算支付成本、退款、纠纷处理、客服和推广支出；低金额订单需要设置最低服务费或引导合并下单。拼车、跨境代购和代办涉及不同的安全、合规与责任问题，正式运营前必须明确服务边界、责任分配和适用规则，不能只靠平台免责声明解决。</p></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ====================== 商家与推广 ====================== */
  function merchantsTab() {
    var st = V.platformStats();
    var merchants = V.db.merchants;
    var coupons = V.db.coupons;
    var rate = st.couponClaimed ? Math.round((st.couponUsed / st.couponClaimed) * 100) : 0;
    return '<div class="grid c4">' +
        U.stat('合作商家', merchants.length + ' 家', '在架 ' + merchants.filter(function (m) { return m.active; }).length + ' 家') +
        U.stat('商家月度推广收入', U.money(st.merchantRevenue), '套餐均价 ' + U.money(V.s().merchantMonthly) + '/月', 'gold') +
        U.stat('优惠券领取', U.num(st.couponClaimed) + ' 张', '已核销 ' + st.couponUsed + ' 张') +
        U.stat('券核销率', rate + '%', '衡量推广是否真实有效', 'brand') +
      '</div>' +
      '<div class="card mt-16"><div class="card-head"><div class="card-title">🏪 商家入驻与推广套餐</div>' +
        '<div class="row" style="gap:8px"><button class="btn primary sm" data-action="admin-merchant-new">＋ 新增商家</button>' +
        '<button class="btn outline sm" data-action="admin-coupon-new">＋ 新增优惠券</button></div></div>' +
        '<div class="table-wrap"><table class="tb"><thead><tr>' +
          '<th>商家</th><th>分类</th><th>校区</th><th>月费</th><th>入驻时间</th><th>在架券</th><th>状态</th><th>操作</th>' +
        '</tr></thead><tbody>' + merchants.map(function (m) {
          var cnt = coupons.filter(function (c) { return c.merchantId === m.id && c.active; }).length;
          return '<tr><td><div class="row" style="gap:8px"><span class="deal-logo" style="width:30px;height:30px;font-size:15px">' + m.logo + '</span><b>' + U.esc(m.name) + '</b></div></td>' +
            '<td class="tiny">' + U.esc(m.category) + '</td>' +
            '<td class="tiny">' + U.esc(m.campus) + '</td>' +
            '<td>' + U.money(m.monthlyFee) + '</td>' +
            '<td class="tiny">' + U.fmtDate(m.since) + '</td>' +
            '<td>' + cnt + ' 张</td>' +
            '<td>' + (m.active ? '<span class="badge ok">推广中</span>' : '<span class="badge">已暂停</span>') + '</td>' +
            '<td><button class="btn sm ' + (m.active ? 'outline' : 'primary') + '" data-action="admin-merchant-toggle" data-id="' + m.id + '">' +
              (m.active ? '暂停推广' : '恢复推广') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
      '</div>' +
      '<div class="card mt-16"><div class="card-title">🎫 优惠券与核销追踪</div>' +
        '<div class="table-wrap mt-12"><table class="tb"><thead><tr>' +
          '<th>优惠券</th><th>商家</th><th>面值</th><th>库存 / 已领</th><th>已核销</th><th>到期</th><th>状态</th><th>操作</th>' +
        '</tr></thead><tbody>' + coupons.map(function (c) {
          var m = V.merchantById(c.merchantId) || {};
          return '<tr><td><b>' + U.esc(c.title) + '</b></td>' +
            '<td class="tiny">' + U.esc(m.name || '') + '</td>' +
            '<td>' + U.esc(c.valueText) + '</td>' +
            '<td>' + c.stock + ' / ' + c.claimed + '</td>' +
            '<td>' + c.used + '</td>' +
            '<td class="tiny">' + U.fmtDate(c.expireAt) + '</td>' +
            '<td>' + (c.active ? '<span class="badge ok">在架</span>' : '<span class="badge">已下架</span>') + '</td>' +
            '<td><button class="btn sm ' + (c.active ? 'outline' : 'primary') + '" data-action="admin-coupon-toggle" data-id="' + c.id + '">' +
              (c.active ? '下架' : '上架') + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="notice mt-12">商家推广费的付费逻辑：商家为「精准触达 + 可追踪转化」付费。核销率是续费的关键指标，低于 15% 时应在后台提醒商家调整优惠力度。</div>' +
      '</div>';
  }

  function overview() {
    var st = V.platformStats();
    var trend = V.commissionTrend(7);
    var memberTrend = V.db.membershipOrders.slice(-6);
    var cats = {};
    V.daidai().forEach(function (p) { cats[p.category] = (cats[p.category] || 0) + 1; });
    var recent = V.db.orders.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 6);
    var proCount = st.members, freeCount = st.users - proCount;
    var ratio = st.users ? Math.round((proCount / st.users) * 100) : 0;
    var totalRev = V.round2(st.commission + st.memberRevenue);

    return '<div class="grid c4">' +
        U.stat('注册用户', U.num(st.users) + ' 人', '其中会员 ' + proCount + ' 人（' + ratio + '%）', 'brand') +
        U.stat('累计佣金抽成', U.money(st.commission), '来自 ' + st.completed + ' 笔已完成订单', 'gold') +
        U.stat('会员费收入', U.money(st.memberRevenue), V.db.membershipOrders.length + ' 笔会员订单') +
        U.stat('平台总收入', U.money(totalRev), '佣金 + 会员费') +
      '</div>' +
      '<div class="grid c4 mt-16">' +
        U.stat('成交总额 GMV', U.money(st.gmv), '已完成订单合计') +
        U.stat('在架信息', U.num(st.posts) + ' 条', '拼拼 ' + V.pinpin().length + ' · 代代 ' + V.daidai().length) +
        U.stat('订单总数', U.num(st.orders) + ' 单', '完成率 ' + (st.orders ? Math.round((st.completed / st.orders) * 100) : 0) + '%') +
        U.stat('待处理举报', V.db.reports.filter(function (r) { return r.status === 'pending'; }).length + ' 条', '内容合规') +
      '</div>' +
      '<div class="grid side mt-16">' +
        '<div class="card"><div class="card-head"><div class="card-title">近 7 日佣金收入</div>' +
          '<span class="badge gold">合计 ' + U.money(trend.reduce(function (a, d) { return a + d.value; }, 0)) + '</span></div>' +
          U.barChart(trend, 'gold') +
          '<div class="notice mt-16">佣金 = 成交金额 × 费率（普通 ' + U.pct(V.s().commissionFree) + ' / 会员 ' + U.pct(V.s().commissionPro) + '），由收款方承担。</div>' +
        '</div>' +
        '<div class="card"><div class="card-title">用户结构</div>' +
          '<div class="col mt-12" style="gap:12px">' +
            '<div><div class="between small"><span>会员用户</span><b>' + proCount + ' 人</b></div>' + U.progress(proCount, st.users, true) + '</div>' +
            '<div><div class="between small"><span>普通用户</span><b>' + freeCount + ' 人</b></div>' + U.progress(freeCount, st.users, false) + '</div>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="small strong">代代分类分布</div>' +
          '<div class="col mt-8" style="gap:8px">' + Object.keys(cats).map(function (c) {
            return '<div><div class="between tiny muted"><span>' + U.esc(c) + '</span><b>' + cats[c] + ' 条</b></div>' +
              U.progress(cats[c], V.daidai().length) + '</div>';
          }).join('') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid c2 mt-16">' +
        '<div class="card"><div class="card-title">最近订单</div>' +
          '<div class="table-wrap mt-12"><table class="tb"><thead><tr><th>订单号</th><th>类型</th><th>金额</th><th>佣金</th><th>状态</th></tr></thead><tbody>' +
          recent.map(function (o) {
            var stt = U.ORDER_STATUS[o.status] || { label: o.status, cls: '' };
            return '<tr><td class="tiny">' + o.no + '</td><td>' + (o.refType === 'pinpin' ? '拼拼' : '代代') + '</td>' +
              '<td>' + U.money(o.amount) + '</td><td>' + U.money(o.commission) + '</td>' +
              '<td><span class="badge ' + stt.cls + '">' + stt.label + '</span></td></tr>';
          }).join('') +
          '</tbody></table></div>' +
        '</div>' +
        '<div class="card"><div class="card-title">会员费收入明细</div>' +
          '<div class="table-wrap mt-12"><table class="tb"><thead><tr><th>用户</th><th>套餐</th><th>金额</th><th>时间</th></tr></thead><tbody>' +
          memberTrend.slice().reverse().map(function (m) {
            var u = V.user(m.userId) || {};
            return '<tr><td>' + U.esc(u.nickname || '') + '</td><td>' + (m.plan === 'term' ? '学期卡 ' + m.months + ' 个月' : '月卡') + '</td>' +
              '<td><b>' + U.money(m.amount) + '</b></td><td class="tiny">' + U.fmtDate(m.createdAt) + '</td></tr>';
          }).join('') +
          '</tbody></table></div>' +
        '</div>' +
      '</div>';
  }

  function usersTab() {
    var users = V.db.users.slice().sort(function (a, b) {
      return (V.isPro(b) ? 1 : 0) - (V.isPro(a) ? 1 : 0) || (b.deals || 0) - (a.deals || 0);
    });
    return '<div class="card"><div class="card-head"><div class="card-title">用户与会员（' + users.length + '）</div>' +
        '<span class="small muted">管理员可手动开通/取消会员，用于线下收款或补偿</span></div>' +
      '<div class="table-wrap"><table class="tb"><thead><tr>' +
        '<th>用户</th><th>手机号</th><th>校区 / 专业</th><th>身份</th><th>会员到期</th><th>信用</th><th>成交</th><th>余额</th><th>操作</th>' +
      '</tr></thead><tbody>' +
      users.map(function (u) {
        var pro = V.isPro(u);
        return '<tr>' +
          '<td><div class="row" style="gap:8px">' + U.avatar(u, 'sm') + '<b>' + U.esc(u.nickname) + '</b>' +
            (u.role === 'admin' ? '<span class="badge info">管理员</span>' : '') + '</div></td>' +
          '<td class="tiny">' + U.esc(u.phone) + '</td>' +
          '<td class="tiny">' + U.esc(u.campus) + '<br>' + U.esc(u.college) + '</td>' +
          '<td>' + (pro ? '<span class="badge pro">会员</span>' : '<span class="badge">普通</span>') + '</td>' +
          '<td class="tiny">' + (pro ? U.fmtDate(u.memberExpire) + '<br><span class="muted">剩 ' + V.memberDaysLeft(u) + ' 天</span>' : '—') + '</td>' +
          '<td>' + u.credit + '</td>' +
          '<td>' + (u.deals || 0) + '</td>' +
          '<td>' + U.money(u.balance) + '</td>' +
          '<td><div class="row" style="gap:6px;flex-wrap:wrap">' +
            (pro ? '<button class="btn sm outline" data-action="admin-member" data-id="' + u.id + '" data-plan="term">续费学期卡</button>' +
                   '<button class="btn sm danger" data-action="admin-member" data-id="' + u.id + '" data-plan="cancel">取消会员</button>'
                 : '<button class="btn sm primary" data-action="admin-member" data-id="' + u.id + '" data-plan="term">开通学期卡</button>' +
                   '<button class="btn sm outline" data-action="admin-member" data-id="' + u.id + '" data-plan="monthly">开通月卡</button>') +
            '<button class="btn sm ghost" data-action="admin-credit" data-id="' + u.id + '">调整信用分</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div></div>';
  }

  function contentTab() {
    var c = V.state.adminContent;
    var rows = [];
    if (c === 'pinpin') {
      rows = V.pinpin().map(function (p) {
        return { id: p.id, type: 'pinpin', title: p.title, owner: V.user(p.ownerId), status: p.status, createdAt: p.createdAt, extra: U.PP_META[p.type].label };
      });
    } else if (c === 'daidai') {
      rows = V.daidai().map(function (p) {
        return { id: p.id, type: 'daidai', title: p.title, owner: V.user(p.ownerId), status: p.status, createdAt: p.createdAt, extra: p.category };
      });
    }
    rows.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    var reports = V.db.reports;
    return '<div class="seg">' +
        [['pinpin', '🧩 拼拼信息 ' + V.pinpin().length], ['daidai', '🎒 代代信息 ' + V.daidai().length], ['reports', '🚨 举报 ' + reports.filter(function (r) { return r.status === 'pending'; }).length]]
          .map(function (t) {
            return '<button class="' + (c === t[0] ? 'on' : '') + '" data-action="admin-content" data-value="' + t[0] + '">' + t[1] + '</button>';
          }).join('') + '</div>' +
      '<div class="card mt-16">' +
      (c === 'reports'
        ? (reports.length ? '<div class="table-wrap"><table class="tb"><thead><tr><th>类型</th><th>对象</th><th>举报原因</th><th>举报人</th><th>时间</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
            reports.map(function (r) {
              var target = V.findPost(r.targetType, r.targetId);
              return '<tr><td>' + (r.targetType === 'pinpin' ? '拼拼' : '代代') + '</td>' +
                '<td class="small">' + U.esc(target ? target.title : '（内容已删除）') + '</td>' +
                '<td class="small">' + U.esc(r.reason) + '</td>' +
                '<td class="tiny">' + U.esc((V.user(r.reporter) || {}).nickname || '') + '</td>' +
                '<td class="tiny">' + U.fmtDate(r.createdAt) + '</td>' +
                '<td>' + (r.status === 'pending' ? '<span class="badge warn">待处理</span>' : '<span class="badge ok">已处理</span>') + '</td>' +
                '<td><div class="row" style="gap:6px"><button class="btn sm danger" data-action="admin-remove-report" data-id="' + r.id + '">下线内容</button>' +
                '<button class="btn sm outline" data-action="admin-dismiss-report" data-id="' + r.id + '">忽略</button></div></td></tr>';
            }).join('') + '</tbody></table></div>' : U.empty('没有待处理举报', '✅'))
        : '<div class="table-wrap"><table class="tb"><thead><tr><th>标题</th><th>分类</th><th>发布人</th><th>状态</th><th>发布时间</th><th>操作</th></tr></thead><tbody>' +
          rows.map(function (r) {
            var st = r.type === 'pinpin'
              ? { open: ['招募中', 'ok'], full: ['已满员', 'info'], closed: ['已关闭', ''], done: ['已结束', ''] }[r.status] || [r.status, '']
              : [((U.DD_STATUS[r.status] || {}).label || r.status), ((U.DD_STATUS[r.status] || {}).cls || '')];
            return '<tr><td class="small" style="max-width:320px">' + U.esc(r.title) + '</td>' +
              '<td class="tiny">' + U.esc(r.extra) + '</td>' +
              '<td class="tiny">' + U.esc(r.owner ? r.owner.nickname : '') + (r.owner && V.isPro(r.owner) ? ' 👑' : '') + '</td>' +
              '<td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
              '<td class="tiny">' + U.fmtDate(r.createdAt) + '</td>' +
              '<td><div class="row" style="gap:6px"><button class="btn sm outline" data-action="admin-view" data-type="' + r.type + '" data-id="' + r.id + '">查看</button>' +
              '<button class="btn sm danger" data-action="admin-remove" data-type="' + r.type + '" data-id="' + r.id + '">下线</button></div></td></tr>';
          }).join('') + '</tbody></table></div>') +
      '</div>';
  }

  function settingsTab() {
    var s = V.s();
    return '<div class="grid c2">' +
      '<div class="card"><div class="card-title">💸 佣金与抽成</div>' +
        '<p class="small muted mt-8">成交后从收款方收入中按比例抽取，直接影响平台收入与用户到手金额。</p>' +
        '<form data-form="settings" class="mt-16">' +
          '<div class="form-grid">' +
            '<div class="field"><label>普通用户费率（%）</label><input class="input" name="commissionFree" type="number" step="0.5" min="0" max="50" value="' + (s.commissionFree * 100) + '">' +
              '<span class="hint">成交 ¥100 抽 ' + U.money(s.commissionFree * 100) + '</span></div>' +
            '<div class="field"><label>会员费率（%）</label><input class="input" name="commissionPro" type="number" step="0.5" min="0" max="50" value="' + (s.commissionPro * 100) + '">' +
              '<span class="hint">成交 ¥100 抽 ' + U.money(s.commissionPro * 100) + '</span></div>' +
            '<div class="field"><label>会员月卡价格（元）</label><input class="input" name="priceMonthly" type="number" step="0.1" min="0" value="' + s.priceMonthly + '"></div>' +
            '<div class="field"><label>会员学期卡价格（元）</label><input class="input" name="priceTerm" type="number" step="1" min="0" value="' + s.priceTerm + '"></div>' +
            '<div class="field"><label>学期卡时长（月）</label><input class="input" name="termMonths" type="number" min="1" max="12" value="' + s.termMonths + '"></div>' +
            '<div class="field"><label>会员优先窗口（分钟）</label><input class="input" name="proPeriodMinutes" type="number" min="0" max="1440" value="' + s.proPeriodMinutes + '">' +
              '<span class="hint">会员新发布信息在该时段内强制置顶</span></div>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="card-title">📝 发布与联系额度</div>' +
          '<div class="form-grid mt-12">' +
            '<div class="field"><label>普通用户每日发布条数</label><input class="input" name="dailyPostFree" type="number" min="0" value="' + s.dailyPostFree + '"></div>' +
            '<div class="field"><label>会员每日发布条数</label><input class="input" name="dailyPostPro" type="number" min="0" value="' + s.dailyPostPro + '"></div>' +
            '<div class="field"><label>普通用户每日查看联系方式次数</label><input class="input" name="contactFreeDaily" type="number" min="0" value="' + s.contactFreeDaily + '"></div>' +
            '<div class="field"><label>会员信息优先展示</label>' +
              '<label class="row" style="gap:10px"><span class="switch"><input type="checkbox" name="proPriority"' + (s.proPriority ? ' checked' : '') + '><i></i></span>' +
              '<span class="small">开启后会员信息排在普通用户之前</span></label></div>' +
          '</div>' +
          '<button class="btn primary mt-16" type="submit">保存平台设置</button>' +
        '</form>' +
      '</div>' +
      '<div class="col" style="gap:16px">' +
        '<div class="card"><div class="card-title">🧮 定价模拟</div>' +
          '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><thead><tr><th>日均成交</th><th>佣金收入/月</th><th>会员费收入/月</th></tr></thead><tbody>' +
          [500, 2000, 5000, 10000].map(function (gmv) {
            var commission = V.round2(gmv * 30 * ((s.commissionFree + s.commissionPro) / 2));
            var members = 30;
            return '<tr><td>' + U.money(gmv) + '</td><td><b>' + U.money(commission) + '</b></td>' +
              '<td>' + U.money(members * s.priceMonthly) + '<span class="tiny muted">（' + members + ' 位月卡会员）</span></td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<p class="tiny muted mt-12">按普通/会员平均费率估算，仅作参考。</p>' +
        '</div>' +
        '<div class="card"><div class="card-title">⚠️ 数据管理</div>' +
          '<p class="small muted mt-8">演示数据保存在浏览器本地，可随时重置。</p>' +
          '<button class="btn danger block mt-12" data-action="data-reset">重置全部演示数据</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
})();
