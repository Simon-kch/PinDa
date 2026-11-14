/* ==========================================================================
   PinDa · 公共页面：落地页 / 登录 / 注册 / 平台规则
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  V.views = V.views || {};

  V.views.brand = function (sub) {
    return '<a class="brand" href="#/" title="PinDa · 连接校园，让校园生活更简单">' +
      U.logoLockup({ box: 40, size: 19 }) +
      '</a>';
  };

  V.views.publicTop = function (active) {
    var me = V.me();
    return '<header class="topbar"><div class="wrap topbar-in">' +
      V.views.brand() +
      '<nav class="nav">' +
        '<a href="#/pinpin-intro" class="' + (active === 'pinpin' ? 'on' : '') + '">拼拼</a>' +
        '<a href="#/daidai-intro" class="' + (active === 'daidai' ? 'on' : '') + '">代代</a>' +
        '<a href="#/member" class="' + (active === 'member' ? 'on' : '') + '">会员</a>' +
        '<a href="#/help" class="' + (active === 'help' ? 'on' : '') + '">规则</a>' +
      '</nav>' +
      '<div class="topbar-right">' +
        V.i18n.button() +
        (me
          ? '<a class="btn primary sm" href="#/app">进入平台</a>'
          : '<a class="btn ghost sm" href="#/login">登录</a><a class="btn primary sm" href="#/register">加入 PinDa</a>') +
      '</div>' +
    '</div></header>';
  };

  V.views.publicFooter = function () {
    var s = V.s();
    return '<footer class="footer"><div class="wrap">' +
      '<div class="cols">' +
        '<div>' + U.logoLockup({ box: 44, size: 20, tone: 'cream' }) +
          '<p class="mt-12" style="max-width:26em">PinDa 是面向跨校园师生用户的互助平台：拼车、拼单、找搭子，代购、代取、代办——让每一次需求，都能找到合适的人。</p>' +
          '<p class="mt-12 tiny">连接校园，让校园生活更简单 · MORE CONNECTIONS · MORE POSSIBILITIES</p>' +
          '<p class="mt-8 tiny">演示项目 · 数据保存在本机浏览器 · 不保存任何学校账号密码</p></div>' +
        '<div><h4>拼拼</h4><ul><li><a href="#/pinpin">拼车</a></li><li><a href="#/pinpin">拼单</a></li><li><a href="#/pinpin">找搭子</a></li></ul></div>' +
        '<div><h4>代代</h4><ul><li><a href="#/daidai">出国代购</a></li><li><a href="#/daidai">超市代购</a></li><li><a href="#/daidai">代取代取</a></li></ul></div>' +
        '<div><h4>平台</h4><ul><li><a href="#/member">会员权益</a></li><li><a href="#/help">规则与佣金</a></li><li><a href="#/login">登录 / 注册</a></li></ul></div>' +
      '</div>' +
      '<div class="scan-line" style="margin:26px 0 16px;opacity:.25"></div>' +
      '<div class="between tiny" style="flex-wrap:wrap;gap:10px">' +
        '<span>© ' + new Date().getFullYear() + ' ' + U.esc(s.platformName) + ' · 学生创业演示项目</span>' +
        '<span>佣金 ' + U.pct(s.commissionFree) + ' 起 · 会员低至 ' + U.pct(s.commissionPro) + '</span>' +
      '</div>' +
    '</div></footer>';
  };

  /* ---------------- 落地页 ---------------- */
  V.views.landing = function () {
    var s = V.s(), st = V.platformStats();
    return V.views.publicTop('') +
    '<section class="hero">' +
      '<canvas class="sky-layer" id="sky-hero" aria-hidden="true"></canvas>' +
      '<div class="hero-sky-hint">真实星图 · 众星绕北极星旋转（北斗指北）</div>' +
      '<div class="wrap hero-in">' +
      '<div>' +
        '<div class="wordmark">PinDa</div>' +
        '<div class="tagline-en">MORE CONNECTIONS · MORE POSSIBILITIES</div>' +
        '<h1 class="mt-16">连接校园，<span class="grad">让校园生活更简单</span></h1>' +
        '<p class="lead">一个面向跨校园师生用户的互助平台：拼车、拼单、找搭子，代购、代取、代办——让每一次需求，都能找到合适的人。</p>' +
        '<div class="hero-cta">' +
          '<a class="btn gold lg" href="#/register">加入 PinDa</a>' +
          '<a class="btn outline lg" href="#/login">用演示账号体验</a>' +
        '</div>' +
        '<div class="hero-stats">' +
          '<div><b>' + U.num(st.users) + '</b><span>注册同学</span></div>' +
          '<div><b>' + U.num(st.posts) + '</b><span>在架互助信息</span></div>' +
          '<div><b>' + U.num(st.completed) + '</b><span>已完成交易</span></div>' +
          '<div><b>' + U.num(V.db.merchants.length) + '</b><span>合作校园商家</span></div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<div class="script" style="font-size:30px;color:#E7D3A2;text-align:right">For Campus<br>For You</div>' +
        '<div class="hero-note"><ul>' +
          '<li>一个面向跨校园师生用户的互助平台</li>' +
          '<li>拼车、拼单、找搭子</li>' +
          '<li>代购、代取、代办</li>' +
          '<li>让每一次需求，都能找到合适的人</li>' +
        '</ul></div>' +
        '<div class="hero-card" style="padding:16px">' +
          '<div class="between"><b style="color:#FBF7EF">今日校园互助</b><span class="badge pro">👑 会员优先</span></div>' +
          '<div class="mini"><div class="mini-line"><span class="ic">🚗</span><div class="grow"><b class="small">太仓校区 → 园区南校区 双校区通勤</b><div class="tiny muted">周一 07:30 · 3/4 人 · 人均 ¥45</div></div><span class="badge ok">可拼</span></div></div>' +
          '<div class="mini"><div class="mini-line"><span class="ic">🤝</span><div class="grow"><b class="small">BUS107 小组作业 找 2 位队友</b><div class="tiny muted">每周三线上碰 · 已 2/3 人</div></div><span class="badge brand">合作机会</span></div></div>' +
          '<div class="mini"><div class="mini-line"><span class="ic">✈️</span><div class="grow"><b class="small">我在日本，可帮带化妆品/药品</b><div class="tiny muted">代购费 15% · 剩 7 个名额</div></div><span class="badge pro">代代</span></div></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="landing-section"><div class="wrap">' +
      '<div class="center"><div class="sec-title">两大板块，一站式校园互助</div>' +
      '<p class="sec-sub mt-8">拼拼负责聚集用户和创造交易机会，代代负责提供更直接的服务收入。</p></div>' +
      '<div class="grid c2 mt-24">' +
        '<div class="poster-card gold">' +
          '<div class="poster-head"><span class="ic">🚗</span><div><h3>拼拼 <span class="en">PINPIN</span></h3>' +
          '<div class="poster-sub">一起出发 · 一起省钱 · 一起成长</div></div></div>' +
          '<div class="poster-items">' +
            '<div class="poster-item"><span class="ii">🚗</span><b>拼车出行</b><span>上下课 / 机场<br>/ 周边游</span></div>' +
            '<div class="poster-item"><span class="ii">🛒</span><b>拼单购物</b><span>团购 / 省钱<br>更划算</span></div>' +
            '<div class="poster-item"><span class="ii">👥</span><b>找搭子</b><span>学习 / 运动<br>/ 生活</span></div>' +
            '<div class="poster-item"><span class="ii">🤝</span><b>合作机会</b><span>项目 / 资源<br>/ 互助</span></div>' +
          '</div>' +
          '<div class="quote-script">一个人走得快，<br>一群人走得更远！<span class="underline"></span></div>' +
        '</div>' +
        '<div class="poster-card blue">' +
          '<div class="poster-head"><span class="ic">📦</span><div><h3>代代 <span class="en">DAIDAI</span></h3>' +
          '<div class="poster-sub">你的需求 · 我来帮你</div></div></div>' +
          '<div class="poster-items">' +
            '<div class="poster-item"><span class="ii">✈️</span><b>出国代购</b><span>海外好物<br>轻松带回</span></div>' +
            '<div class="poster-item"><span class="ii">🛒</span><b>超市代取</b><span>生活用品<br>快速送达</span></div>' +
            '<div class="poster-item"><span class="ii">🎒</span><b>校园代办</b><span>排队 / 取件<br>/ 跑腿服务</span></div>' +
            '<div class="poster-item"><span class="ii">🧩</span><b>更多需求</b><span>定制服务<br>随时响应</span></div>' +
          '</div>' +
          '<div class="quote-script">你有需求，<br>我来帮忙！<span class="underline"></span></div>' +
        '</div>' +
      '</div>' +
    '</div></section>' +

    '<section class="landing-section"><div class="wrap">' +
      '<div class="grid c3">' +
        '<div class="pcard"><h3><span class="ic">!</span>我们发现的问题</h3><ul>' +
          '<li><span class="mk">·</span><span>校园生活中，出行、购物、学习等需求常常难以找到合适的人</span></li>' +
          '<li><span class="mk">·</span><span>代购、代取、代办等需求分散，缺乏安全可靠的平台</span></li>' +
          '<li><span class="mk">·</span><span>学生的时间和资源没有得到充分利用</span></li>' +
          '<li><span class="mk">·</span><span>太仓与园区双校区班车不够充足，顺风车价格高又不放心</span></li>' +
        '</ul></div>' +
        '<div class="pcard"><h3><span class="ic">💡</span>我们的解决方案</h3><ul>' +
          '<li><span class="mk">✓</span><span>搭建一站式校园互助平台</span></li>' +
          '<li><span class="mk">✓</span><span>精准匹配需求与资源</span></li>' +
          '<li><span class="mk">✓</span><span>保障交易安全与信任</span></li>' +
          '<li><span class="mk">✓</span><span>让学生的时间与能力创造更多价值</span></li>' +
        '</ul></div>' +
        '<div class="pcard"><h3><span class="ic">👑</span>我们的核心优势</h3><ul>' +
          '<li><span class="mk">①</span><span><b>精准定位跨校园师生群体</b><span>贴近校园场景，更懂你的需求</span></span></li>' +
          '<li><span class="mk">②</span><span><b>多元化服务场景</b><span>覆盖学习、生活、出行、消费等</span></span></li>' +
          '<li><span class="mk">③</span><span><b>安全可靠的交易机制</b><span>真实身份认证 + 评价体系</span></span></li>' +
          '<li><span class="mk">④</span><span><b>双向价值创造</b><span>用户需求 + 学生资源 = 共赢</span></span></li>' +
        '</ul></div>' +
      '</div>' +
    '</div></section>' +

    '<section class="landing-section alt" id="member"><div class="wrap">' +
      '<div class="center"><div class="sec-title">免费能用，会员更顺</div>' +
      '<p class="sec-sub mt-8">平台按成交金额抽佣（普通 ' + U.pct(s.commissionFree) + '、会员 ' + U.pct(s.commissionPro) + '），会员还能拿到展示与撮合上的优先权。</p></div>' +
      '<div class="grid c2 mt-24">' +
        '<div class="plan"><h3>普通注册</h3><div class="muted small">0 元 · 长期有效</div>' +
          '<div class="price mt-12">¥0<small> / 永久</small></div>' +
          '<ul>' +
            '<li><span class="tick">✓</span> 发布 ' + s.dailyPostFree + ' 条/日，拼拼 + 代代全功能</li>' +
            '<li><span class="tick">✓</span> 每日 ' + s.contactFreeDaily + ' 次查看对方联系方式</li>' +
            '<li><span class="tick">✓</span> 平台担保式交易记录与评价</li>' +
            '<li class="dim"><span class="tick">✕</span> 成交佣金 ' + U.pct(s.commissionFree) + '</li>' +
            '<li class="dim"><span class="tick">✕</span> 信息排序靠后，无会员标识</li>' +
          '</ul>' +
          '<a class="btn outline block mt-16" href="#/register">免费注册</a>' +
        '</div>' +
        '<div class="plan pro"><span class="ribbon">推荐 · 学期卡更省</span><h3>👑 PinDa 会员</h3>' +
          '<div class="muted small">面向高频拼车、常帮同学代购的同学</div>' +
          '<div class="price mt-12">' + U.money(s.priceMonthly) + '<small> / 月 · 学期卡 ' + U.money(s.priceTerm) + '（' + s.termMonths + ' 个月）</small></div>' +
          '<ul>' +
            '<li><span class="tick">✓</span> <b>成交佣金 ' + U.pct(s.commissionPro) + '</b>（普通用户 ' + U.pct(s.commissionFree) + '）</li>' +
            '<li><span class="tick">✓</span> 信息<b>优先展示</b>，带「会员优先」标识</li>' +
            '<li><span class="tick">✓</span> <b>不限次</b>查看联系方式，成交更快</li>' +
            '<li><span class="tick">✓</span> 高级筛选：按信用分、认证、价格区间查询</li>' +
            '<li><span class="tick">✓</span> 代代新需求<b>优先派送</b>给会员</li>' +
            '<li><span class="tick">✓</span> 每日发布额度 ' + s.dailyPostPro + ' 条 + 专属客服</li>' +
          '</ul>' +
          '<a class="btn gold block mt-16" href="#/register">注册并开通会员</a>' +
        '</div>' +
      '</div>' +
      '<p class="center small muted mt-16">举个账：一位学期内成交 30 单、流水 ¥3,000 的同学，普通用户佣金约 ¥' +
        U.yuan(3000 * s.commissionFree).toFixed(0) + '，会员佣金约 ¥' + U.yuan(3000 * s.commissionPro).toFixed(0) +
        '，加上会员费 ' + U.money(s.priceTerm) + '，会员仍更省。</p>' +
    '</div></section>' +

    '<section class="landing-section"><div class="wrap">' +
      '<div class="center sec-title">三步就能用起来</div>' +
      '<div class="steps mt-24">' +
        '<div class="step"><b>1</b><h3>注册并认证</h3><p class="muted small mt-8">用手机号注册，填写校区与专业。学生认证通过后，主页会显示「已认证」，成交率更高。</p></div>' +
        '<div class="step"><b>2</b><h3>发布或接单</h3><p class="muted small mt-8">在「拼拼」发起拼车/拼单/搭子，或在「代代」发布代购需求、也可把自己即将出行的行程挂上去接单。</p></div>' +
        '<div class="step"><b>3</b><h3>成交后自动结算</h3><p class="muted small mt-8">订单完成后平台按费率抽佣，收入实时进入钱包，明细可查，纠纷可申请平台介入。</p></div>' +
      '</div>' +
    '</div></section>' +

    /* 项目愿景 + 加入方式 */
    '<section class="landing-section"><div class="wrap"><div class="vision">' +
      '<div class="between" style="flex-wrap:wrap;gap:22px;align-items:flex-start">' +
        '<div>' +
          '<div class="script" style="font-size:22px;color:#E7D3A2">Join PinDa · Start Your Journey!</div>' +
          '<h3 class="mt-8">项目愿景</h3>' +
          '<p>成为跨校园师生首选的互助平台，让互助连接更多可能。</p>' +
          '<div class="row mt-16" style="gap:16px;flex-wrap:wrap">' +
            '<span class="badge" style="background:rgba(251,247,239,.1);color:#F3E3BE">已认证 ' + U.num(V.db.users.filter(function (u) { return u.verified; }).length) + ' 人</span>' +
            '<span class="badge" style="background:rgba(251,247,239,.1);color:#F3E3BE">合作商家 ' + U.num(V.db.merchants.length) + ' 家</span>' +
            '<span class="badge" style="background:rgba(251,247,239,.1);color:#F3E3BE">在架信息 ' + U.num(st.posts) + ' 条</span>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center">' +
          '<div class="qr-box">团队二维码位<br>（替换为加入码）</div>' +
          '<div class="tiny mt-8" style="color:rgba(251,247,239,.72)">扫码加入 PinDa · 一起创造更多可能</div>' +
        '</div>' +
      '</div>' +
      '<div class="vision-grid">' +
        '<div class="vision-item"><div class="ii">🎓</div><b>更高效的校园生活</b></div>' +
        '<div class="vision-item"><div class="ii">👥</div><b>更紧密的社交圈子</b></div>' +
        '<div class="vision-item"><div class="ii">❤️</div><b>更温暖的社区氛围</b></div>' +
        '<div class="vision-item"><div class="ii">∞</div><b>更广阔的未来可能</b></div>' +
      '</div>' +
    '</div></div></section>' +
    V.views.publicFooter();
  };

  /* ---------------- 板块介绍页（拼拼 / 代代） ---------------- */
  V.views.intro = function (which) {
    var pp = which === 'pinpin';
    var s = V.s();
    var cards = pp ? [
      { ic: '🚗', t: '拼车出行', d: '上下课 / 机场 / 周边游。太仓与园区双校区通勤、苏州往返虹桥与浦东、周末周边游，写清出发时间与空位，人均费用自动平摊。' },
      { ic: '🛒', t: '拼单购物', d: '团购 / 省钱 / 更划算。山姆、宜家、外卖满减、奶茶日，发起人写清店铺与截止时间，到点自动成团，避免「凑不齐又不好意思退出」。' },
      { ic: '👥', t: '找搭子', d: '学习 / 运动 / 生活。期末周自习、雅思口语对练、羽毛球固定局、游戏开黑，可以设置每周固定时间与目标，长期搭子也能维护。' },
      { ic: '🤝', t: '合作机会', d: '项目 / 资源 / 互助。小组作业组队、创业比赛找队友、社团活动招募、技能互换——把「一个人难搞定的事」变成合作。' }
    ] : [
      { ic: '✈️', t: '出国代购', d: '海外好物 · 轻松带回。出行的同学把行程挂出来（去哪、几号回、代购费多少），需要的人直接下单，按小票实付。' },
      { ic: '🛒', t: '超市代取', d: '生活用品 · 快速送达。山姆、Costco、大润发、盒马，有会员卡的同学顺路帮带，代购费按件或按比例。' },
      { ic: '🎒', t: '校园代办', d: '排队 / 取件 / 跑腿服务。菜鸟驿站取件、医院取药、文印店取材料、政务大厅排队，适合想赚零花钱的同学。' },
      { ic: '🧩', t: '更多需求', d: '定制服务 · 随时响应。食堂带饭、外卖代取、搬家帮抬、宠物代遛——想不到的互助需求，都可以发布。' }
    ];
    return V.views.publicTop(which) +
    '<section class="hero" style="padding:0"><div class="wrap" style="padding:52px 20px 58px;position:relative;z-index:2">' +
      '<span class="badge pro">' + (pp ? '🧩 拼拼 PinPin' : '🎒 代代 DaiDai') + '</span>' +
      '<h1 class="mt-16" style="font-size:38px">' + (pp ? '凑在一起，成本就低了一半' : '顺路带一带，帮人也赚点') + '</h1>' +
      '<p class="lead">' + (pp
        ? '拼车分摊油费与过路费，拼单凑满减与包邮，找搭子把「一个人难坚持」的事变成两个人的约定。'
        : '把行程变成服务：你出国、你去超市、你路过驿站，都能顺便帮同学带一份，代购费自己定，平台保证交易留痕。') + '</p>' +
      '<div class="hero-cta"><a class="btn primary lg" href="#/register">免费注册</a>' +
      '<a class="btn outline lg" href="#/' + (pp ? 'pinpin' : 'daidai') + '">浏览在架信息</a></div>' +
    '</div></section>' +
    '<section class="landing-section"><div class="wrap grid c3">' +
      cards.map(function (c) {
        return '<div class="feature"><div class="ic">' + c.ic + '</div><h3>' + c.t + '</h3><p>' + c.d + '</p></div>';
      }).join('') +
    '</div></section>' +
    '<section class="landing-section alt"><div class="wrap grid c2">' +
      '<div class="card"><div class="card-title">📊 当前收费规则（' + V.stage().name + '）</div>' +
        '<p class="small muted">平台分三个阶段推进收费，当前阶段的规则如下；普通用户的核心功能始终免费，付费只放在能明确产生价值的交易与增值服务上。</p>' +
        '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
          ['daidai', 'carpool', 'groupbuy', 'collab'].map(function (ctx) {
            var mode = V.chargeMode(ctx);
            var val = mode === 'free' ? '<b>免费</b>' : mode === 'service' ? '<b>' + U.money(V.s().serviceFee) + '/单</b>（会员免收）' : '<b>' + U.pct(V.s().commissionFree) + '</b> / 会员 ' + U.pct(V.s().commissionPro);
            return '<tr><td>' + V.CONTEXT_LABEL[ctx] + '</td><td>' + val + '</td></tr>';
          }).join('') +
        '</tbody></table></div>' +
        '<div class="mt-12 small muted">' + V.stage().note + '</div>' +
        '<a class="btn primary mt-16" href="#/help">查看完整收费与阶段说明</a></div>' +
      '<div class="card"><div class="card-title">🛡️ 安全与责任边界</div>' +
        '<ul class="col small" style="gap:10px">' +
          '<li>✅ 学生认证 + 信用分 + 双向评价，低信用账号限制发布</li>' +
          '<li>✅ 联系方式默认打码，需要主动查看并留痕</li>' +
          '<li>✅ 订单全程状态留痕，纠纷可申请平台介入</li>' +
          (pp
            ? '<li>✅ 拼车实名与认证标记、车型座位信息公示，行程可一键分享给同学或家人</li>' +
              '<li>✅ 建议白天出行、上车前核对车牌与同行人，长途行程提前报备</li>'
            : '<li>✅ 大额代购建议先付定金，小票、物流与聊天记录全程留存</li>' +
              '<li>✅ 明确不接违禁品：烟酒、处方药、管制物品、活体动物一律禁止</li>') +
        '</ul>' +
        '<div class="notice mt-16">拼车、跨境代购与代办涉及不同的安全、合规与责任问题。平台提供信息撮合与交易记录，交易双方需自行确认服务边界；平台不承担运输、清关与人身安全责任，正式运营前会以《服务协议》明确责任分配。</div></div>' +
    '</div></section>' + V.views.publicFooter();
  };

  /* ---------------- 登录 ---------------- */
  V.views.login = function () {
    var demos = [
      { id: 'u_lin', label: '普通用户', note: '李明轩 · 佣金 6%' },
      { id: 'u_wang', label: '会员用户', note: '王雨薇 · 佣金 2%' },
      { id: 'u_admin', label: '管理员', note: '平台运营台' }
    ];
    return V.views.publicTop('') +
    '<main id="main" class="main"><div class="wrap" style="max-width:940px">' +
      '<div class="grid c2" style="align-items:stretch">' +
        '<div class="card pad-lg">' +
          '<h1 style="font-size:24px;font-weight:800">欢迎回到 PinDa</h1>' +
          '<p class="muted small mt-8">登录后即可发布拼车、拼单、代购需求。</p>' +
          '<form data-form="login" class="stack-16 mt-16">' +
            '<input type="hidden" name="mode" value="phone">' +
            '<div class="seg" style="width:100%">' +
              '<button type="button" class="on" data-action="auth-mode" data-value="phone" style="flex:1">手机号登录</button>' +
              '<button type="button" data-action="auth-mode" data-value="sid" style="flex:1">学号登录</button>' +
            '</div>' +
            '<div data-auth="phone">' +
              '<div class="field"><label>手机号</label><input class="input" name="phone" placeholder="11 位手机号" value="13800000001" autocomplete="username"></div>' +
              '<div class="field mt-12"><label>密码</label><input class="input" name="password" type="password" value="123456" autocomplete="current-password"></div>' +
            '</div>' +
            '<div data-auth="sid" class="hide">' +
              '<div class="field"><label>学号</label><input class="input" name="studentId" placeholder="例如 2024128731" autocomplete="username"></div>' +
              '<div class="field mt-12"><label>PinDa 平台密码</label><input class="input" name="sidPassword" type="password" placeholder="注册 PinDa 时设置的密码" autocomplete="current-password"></div>' +
              '<div class="tiny muted mt-8">这里用的是你在 PinDa 注册时设置的密码，<b>不是</b>学校统一身份密码。</div>' +
            '</div>' +
            '<div class="between"><label class="checkline"><input type="checkbox" name="remember" checked>记住登录状态</label>' +
            '<span class="link-plain small" data-action="forgot">忘记密码？</span></div>' +
            '<button class="btn primary block lg" type="submit">登录</button>' +
          '</form>' +
          '<div class="notice mt-16">🔒 PinDa 不会也不需要你的学校账号密码。<a class="link-plain" data-action="why-no-ebridge">为什么？</a></div>' +
          '<p class="center small muted mt-16">还没有账号？<a class="link-plain" href="#/register">免费注册</a></p>' +
        '</div>' +
        '<div class="card pad-lg" style="background:linear-gradient(160deg,#F8F6FF,#fff)">' +
          '<div class="card-title">🎫 演示账号 · 一键进入</div>' +
          '<p class="small muted">不同身份能看到不同的权限与后台。</p>' +
          '<div class="col mt-12" style="gap:10px">' +
            demos.map(function (d) {
              var u = V.user(d.id);
              return '<button class="radio-card" data-action="quick-login" data-user="' + d.id + '" style="width:100%;text-align:left">' +
                U.avatar(u) + '<span class="grow"><b>' + d.label + '</b><span>' + d.note + '</span></span>' +
                '<span class="btn sm primary">进入</span></button>';
            }).join('') +
          '</div>' +
          '<div class="notice mt-16">所有数据都存在你自己的浏览器里，可随时在「个人中心 → 重置演示数据」恢复初始状态。</div>' +
        '</div>' +
      '</div>' +
    '</div></main>' +
    V.views.publicFooter();
  };

  /* ---------------- 注册 ---------------- */
  V.views.register = function () {
    var s = V.s();
    return V.views.publicTop('') +
    '<main id="main" class="main"><div class="wrap" style="max-width:820px">' +
      '<div class="center"><h1 style="font-size:26px;font-weight:800">加入 PinDa</h1>' +
      '<p class="muted small mt-8">用手机号注册，30 秒完成。也可以直接开通会员，享受更低佣金与优先展示。</p></div>' +
      '<div class="card pad-lg mt-24">' +
        '<form data-form="register" class="stack-16">' +
          '<div class="notice">🔒 注册<b>不需要</b>学校统一身份密码。用「学号 + 校园邮箱验证码」证明你是在校师生即可获得认证标识。<a class="link-plain" data-action="why-no-ebridge">为什么不用学校账号直接登录？</a></div>' +
          '<div class="form-grid">' +
            '<div class="field"><label>昵称 *</label><input class="input" name="nickname" placeholder="例如：张同学" required></div>' +
            '<div class="field"><label>手机号 *</label><input class="input" name="phone" placeholder="11 位手机号" required></div>' +
            '<div class="field"><label>密码 *</label><input class="input" name="password" type="password" placeholder="至少 6 位" required></div>' +
            '<div class="field"><label>学号</label><input class="input" name="studentId" placeholder="例如 2024128731">' +
              '<span class="hint">用于学生认证与找回账号，可稍后在个人中心补充</span></div>' +
            '<div class="field"><label>校园邮箱</label><input class="input" name="schoolEmail" placeholder="你的校园邮箱，如 xxx@xxx.edu.cn">' +
              '<span class="hint">支持各高校校园邮箱（.edu.cn / .edu）</span></div>' +
            '<div class="field"><label>邮箱验证码</label>' +
              '<div class="row" style="gap:8px"><input class="input" name="code" placeholder="6 位验证码" inputmode="numeric">' +
              '<button class="btn outline" type="button" data-action="send-code" style="flex:none">发送验证码</button></div>' +
              '<span class="hint" data-code-note>' + (V.api.mail
                ? '验证码会发送到你的校园邮箱，验证后获得「已认证」标识'
                : '点「发送验证码」后，验证码会显示在这里（本地演示模式；启动服务器并配置 SMTP 后会真实发到你的学校邮箱）') + '</span></div>' +
            '<div class="field"><label>校区</label><select class="select" name="campus">' +
              s.campuses.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
            '</select><span class="hint">SIP = 苏州工业园区校区 · TC = 太仓校区</span></div>' +
            '<div class="field full"><label>专业</label><select class="select" name="college" data-major-select>' +
              V.programmeOptions('') +
            '</select><input class="input mt-8 hide" name="collegeOther" data-other-major-input placeholder="请填写你的专业名称">' +
            '<span class="hint">示例专业库来自西浦官网「教学」栏目（共 ' + V.PROGRAMME_SOURCE.total +
              ' 个）；其它学校的同学可选「其它专业」自行填写。还没确定专业可选「' + V.UNDECIDED_MAJOR + '」，之后可在个人中心改。</span></div>' +
            '<div class="field"><label>年级</label><select class="select" name="grade">' +
              ['大一', '大二', '大三', '大四', '研一', '研二', '已毕业校友'].map(function (g) { return '<option>' + g + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="field full"><label>一句话介绍（让别人更愿意与你交易）</label>' +
              '<textarea class="textarea" name="intro" placeholder="例如：有车，周末往返苏州—上海，可放行李。"></textarea></div>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div><b>选择注册类型</b><div class="small muted">之后也可随时在「会员中心」升级或续费。</div></div>' +
          '<div class="grid c2" style="gap:12px">' +
            '<label class="radio-card on" data-plan-card="free"><span class="ic">🙂</span><span><b>普通注册（免费）</b>' +
              '<span>佣金 ' + U.pct(s.commissionFree) + ' · 每日 ' + s.dailyPostFree + ' 条发布 · 每日 ' + s.contactFreeDaily + ' 次查看联系方式</span></span>' +
              '<input type="radio" name="plan" value="free" checked style="margin-left:auto"></label>' +
            '<label class="radio-card" data-plan-card="monthly"><span class="ic">👑</span><span><b>PinDa 会员 · 月卡 ' + U.money(s.priceMonthly) + '</b>' +
              '<span>佣金 ' + U.pct(s.commissionPro) + ' · 优先展示与优先接单 · 不限次查看联系方式</span></span>' +
              '<input type="radio" name="plan" value="monthly" style="margin-left:auto"></label>' +
            '<label class="radio-card" data-plan-card="term" style="grid-column:1/-1"><span class="ic">🎓</span><span><b>PinDa 会员 · 学期卡 ' + U.money(s.priceTerm) + '（' + s.termMonths + ' 个月，约 ' + U.money(V.round2(s.priceTerm / s.termMonths)) + '/月）</b>' +
              '<span>覆盖整个学期，适合固定拼车、长期帮同学代购的同学</span></span>' +
              '<input type="radio" name="plan" value="term" style="margin-left:auto"></label>' +
          '</div>' +
          '<label class="checkline mt-8"><input type="checkbox" name="agree" required>我已阅读并同意 <a class="link-plain" href="#/help" target="_self">《平台规则与交易须知》</a>，承诺不发布违禁物品与虚假信息</label>' +
          '<button class="btn primary block lg" type="submit">注册并进入平台</button>' +
        '</form>' +
      '</div>' +
      '<p class="center small muted mt-16">已有账号？<a class="link-plain" href="#/login">直接登录</a></p>' +
    '</div></main>' +
    V.views.publicFooter();
  };

  /* ---------------- 平台规则 ---------------- */
  V.views.help = function (inApp) {
    var s = V.s();
    var body =
      '<div class="wrap" style="max-width:900px">' +
      '<h1 style="font-size:26px;font-weight:800">平台规则与交易须知</h1>' +
      '<p class="muted small mt-8">最后更新：' + U.fmtDate(new Date().toISOString()) + ' · 本页为演示文本</p>' +
      '<div class="grid c2 mt-16" style="gap:16px">' +
        '<div class="card"><div class="card-title">💰 佣金与费用</div>' +
          '<ul class="col small" style="gap:10px">' +
          '<li><b>1. 收费分三阶段</b><br>第一阶段启动期：拼车、拼单、搭子、代代订单<b>全部免费</b>，重点是先把用户用起来；第二阶段收入验证：代代订单抽佣、拼单收透明小额服务费，拼车与搭子保持免费；第三阶段规模扩张：增加商家推广套餐、社团合作与增值服务。</li>' +
          '<li><b>2. 当前阶段（' + V.stage().name + '）</b><br>' +
            ['daidai', 'carpool', 'groupbuy', 'collab'].map(function (ctx) {
              var mode = V.chargeMode(ctx);
              return V.CONTEXT_LABEL[ctx] + '：' + (mode === 'free' ? '免费' : mode === 'service' ? U.money(s.serviceFee) + '/单（会员免收）' : '抽佣 ' + U.pct(s.commissionFree) + '（会员 ' + U.pct(s.commissionPro) + '）');
            }).join('；') + '</li>' +
          '<li><b>3. 付款方价格不变</b><br>费用由服务提供方承担，付款方看到的报价即为应付金额。</li>' +
          '<li><b>4. 增值服务</b><br>基础功能免费：发布信息、加入拼拼、接代代订单。选择性付费：信息加曝光 ' + U.money(s.boostPrice) + '/次、会员订阅 月卡 ' + U.money(s.priceMonthly) + ' / 学期卡 ' + U.money(s.priceTerm) + '（' + s.termMonths + ' 个月）、校园商家推广套餐 ' + U.money(s.merchantMonthly) + '/月。</li>' +
          '<li><b>5. 退款</b><br>订单取消时全额退回付款方；已完成订单的手续费不予退还。</li>' +
          '</ul></div>' +
        '<div class="card"><div class="card-title">⚠️ 禁止事项</div>' +
          '<ul class="col stack-8 small">' +
          '<li>🚫 代购烟酒、处方药、管制刀具、活体动物等违禁品</li>' +
          '<li>🚫 伪造小票、虚报价格、收钱不发货</li>' +
          '<li>🚫 私自把联系方式用于骚扰、广告、拉群营销</li>' +
          '<li>🚫 冒用他人学生身份注册</li>' +
          '</ul>' +
          '<div class="notice warn mt-16">违规将被扣除信用分、限制发布，严重者封号并公示。</div></div>' +
      '</div>' +
      '<div class="card mt-16"><div class="card-title">📋 交易流程</div>' +
        '<div class="grid c2" style="gap:20px">' +
          '<div><b class="small">拼拼（拼车 / 拼单 / 搭子）</b>' +
          '<ul class="timeline mt-12">' +
            '<li class="done">发起人发布，填写时间、地点、人数与人均费用</li>' +
            '<li class="done">同学申请加入，发起人确认</li>' +
            '<li class="done">成团后生成账单，出发/到货后结算</li>' +
            '<li>成交后平台按费率抽佣，收入进入钱包</li>' +
          '</ul></div>' +
          '<div><b class="small">代代（代购 / 代取）</b>' +
          '<ul class="timeline mt-12">' +
            '<li class="done">需求方发布代购需求，或代购方挂出行程</li>' +
            '<li class="done">接单后生成订单，状态流转留痕</li>' +
            '<li class="done">商品交付、上传小票、双方确认</li>' +
            '<li>平台抽佣，订单完成</li>' +
          '</ul></div>' +
        '</div>' +
      '</div>' +
      '<div class="card mt-16"><div class="card-title">🛟 纠纷处理</div>' +
        '<p class="small muted">订单内点击「申请客服介入」后，平台将在 24 小时内联系双方。涉及金额较大的代购（≥ ¥500）建议先支付 30% 定金并保留小票、物流与聊天记录。会员用户享有优先响应。</p>' +
      '</div>' +
      '<div class="card mt-16"><div class="card-title">🔐 账号与身份认证</div>' +
        '<div class="notice warn mt-12">PinDa 不会、也不需要你的学校账号密码。任何要求你输入学校统一身份密码的第三方平台都存在钓鱼风险。</div>' +
        '<ul class="col small muted mt-12" style="gap:10px">' +
          '<li><b>身份核验方式</b>：填写学号 + 校园邮箱（支持 .edu.cn / .edu 域名）验证码，即可获得「已认证」标识。平台只保存学号与校园邮箱。</li>' +
          '<li><b>登录密码</b>：注册 PinDa 时你自己设置的平台密码，与学校密码无关，忘记后可在个人中心修改。</li>' +
          '<li><b>为什么不能一键登录</b>：多数高校的统一身份系统（如西浦 e-Bridge）未开放第三方授权接口，绕过官方授权去代持账号密码，属于违规且高风险的凭据代持行为。</li>' +
          '<li><b>正规的下一步</b>：向你所在学校的 IT / 学生事务申请官方 SSO（OAuth / OIDC）授权。拿到授权后，登录会跳转到学校官方页面，学校只回传学号与邮箱，平台全程接触不到密码。PinDa 已预留该对接位置。</li>' +
          '<li><b>数据存放</b>：本原型的数据保存在你自己的浏览器本地，不上传服务器。</li>' +
        '</ul>' +
      '</div>' +
      '<div class="card mt-16"><div class="card-title">🚗 出行安全与代办责任边界</div>' +
        '<div class="grid c2" style="gap:20px">' +
          '<div><b class="small">拼车出行</b>' +
            '<ul class="col small muted mt-12" style="gap:8px">' +
              '<li>· 车主与学生均需完成学生认证，主页公示认证状态与信用分</li>' +
              '<li>· 拼车信息需写明车型、座位数、能否放行李与是否中途接人</li>' +
              '<li>· 建议白天出行，上车前核对车牌与同行人，并把行程分享给同学或家人</li>' +
              '<li>· 平台提供信息撮合与行程留痕，不提供承运服务，涉及交通事故按交通法规处理</li>' +
            '</ul></div>' +
          '<div><b class="small">代购 / 代取 / 代办</b>' +
            '<ul class="col small muted mt-12" style="gap:8px">' +
              '<li>· 代购费在信息中明确标注（按比例或固定金额），商品按小票实付</li>' +
              '<li>· 大额代购建议先付 30% 定金，保留小票、物流与聊天记录</li>' +
              '<li>· 跨境代购需遵守海关规定：不接受烟酒、处方药、管制物品与活体动物</li>' +
              '<li>· 涉及清关、税费与商品质量的责任由交易双方约定，平台协助举证与纠纷调解</li>' +
            '</ul></div>' +
        '</div>' +
      '</div>' +
      '</div>';
    if (inApp) return body;
    return V.views.publicTop('help') + '<main id="main" class="main">' + body + '</main>' + V.views.publicFooter();
  };
})();
