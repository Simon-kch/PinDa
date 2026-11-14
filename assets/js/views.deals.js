/* ==========================================================================
   PinDa · 校园优惠（收入来源 3：校园商家推广 + 可追踪优惠券）
   ========================================================================== */
(function () {
  var V = window.Vega, U = V.ui;
  V.views = V.views || {};
  V.state = V.state || {};
  V.state.dealCat = V.state.dealCat || 'all';

  V.views.deals = function () {
    var me = V.me();
    var cats = ['all'];
    V.db.merchants.forEach(function (m) { if (cats.indexOf(m.category) < 0) cats.push(m.category); });
    var f = V.state.dealCat;
    var merchants = V.db.merchants.filter(function (m) { return m.active && (f === 'all' || m.category === f); });
    var coupons = V.db.coupons.filter(function (c) {
      if (!c.active) return false;
      var m = V.merchantById(c.merchantId);
      if (!m || !m.active) return false;
      return f === 'all' || m.category === f;
    });
    var myClaims = V.db.couponClaims.filter(function (c) { return c.userId === me.id; });
    var st = V.platformStats();

    function couponCard(c) {
      var m = V.merchantById(c.merchantId) || {};
      var claim = V.myCoupon(me.id, c.id);
      var left = Math.max(0, (c.stock || 0) - (c.claimed || 0));
      return '<div class="coupon" style="flex-direction:column;align-items:stretch;gap:10px">' +
        '<div class="row" style="gap:12px">' +
          '<div style="text-align:center;min-width:74px"><div class="val">' + U.esc(c.valueText) + '</div>' +
            '<div class="tiny muted">' + U.esc(c.title.split('（')[0]) + '</div></div>' +
          '<div class="grow">' +
            '<div class="row" style="gap:6px;flex-wrap:wrap"><b class="small">' + U.esc(c.title) + '</b>' +
              (left > 0 ? '<span class="badge ok">剩 ' + left + ' 张</span>' : '<span class="badge">已领完</span>') +
              '<span class="badge">' + U.fmtDate(c.expireAt) + ' 到期</span></div>' +
            '<div class="tiny muted mt-8">' + U.esc(c.desc) + '</div>' +
            '<div class="tiny muted mt-8">使用门店：' + U.esc(m.name || '') + '</div>' +
          '</div>' +
        '</div>' +
        (claim
          ? '<div class="row" style="gap:8px;flex-wrap:wrap;border-top:1px dashed var(--brand-200);padding-top:10px">' +
              '<span class="grow small">我的券码 <span class="coupon-code">' + claim.code + '</span>' +
                (claim.usedAt ? ' <span class="badge">已于 ' + U.fmtDate(claim.usedAt) + ' 核销</span>' : '') + '</span>' +
              (claim.usedAt ? '' : '<button class="btn sm outline" data-action="coupon-use" data-id="' + claim.id + '">模拟到店核销</button>') +
            '</div>'
          : '<div class="row" style="gap:8px"><span class="grow tiny muted">已领 ' + c.claimed + ' 次 · 已核销 ' + c.used + ' 次</span>' +
            '<button class="btn sm primary" data-action="coupon-claim" data-id="' + c.id + '"' + (left > 0 ? '' : ' disabled') + '>' +
              (left > 0 ? '领取优惠券' : '已领完') + '</button></div>') +
      '</div>';
    }

    return '<div class="wrap">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        '<div><div class="sec-title">🎫 校园优惠</div>' +
          '<div class="sec-sub">周边餐厅、奶茶店、超市、文印店的 PinDa 专属优惠，领券到店核销。</div></div>' +
        '<span class="badge boost">合作商家 ' + V.db.merchants.length + ' 家</span>' +
      '</div>' +

      (myClaims.length
        ? '<div class="card mt-16"><div class="card-head"><div class="card-title">我的优惠券（' + myClaims.length + '）</div>' +
          '<span class="small muted">到店出示券码，由商家核销</span></div>' +
          '<div class="grid c2" style="gap:12px">' + myClaims.map(function (cl) {
            var c = V.couponById(cl.couponId); if (!c) return '';
            return '<div class="coupon' + (cl.usedAt ? ' used' : '') + '">' +
              '<div style="text-align:center;min-width:70px"><div class="val">' + U.esc(c.valueText) + '</div>' +
                '<div class="tiny muted">' + (cl.usedAt ? '已使用' : '待使用') + '</div></div>' +
              '<div class="grow small"><b>' + U.esc(c.title) + '</b>' +
                '<div class="tiny muted mt-8">' + U.esc((V.merchantById(c.merchantId) || {}).name || '') + '</div>' +
                '<div class="mt-8"><span class="coupon-code">' + cl.code + '</span></div></div>' +
            '</div>';
          }).join('') + '</div></div>'
        : '') +

      '<div class="card mt-16" style="padding:14px">' +
        '<div class="chips">' +
          cats.map(function (c) {
            return '<button class="chip ' + (f === c ? 'on' : '') + '" data-action="deal-cat" data-value="' + c + '">' +
              (c === 'all' ? '全部商家' : c) + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="grid side mt-16">' +
        '<div class="col" style="gap:12px">' +
          (coupons.length ? coupons.map(couponCard).join('') : U.empty('该分类暂时没有优惠券', '🎫')) +
        '</div>' +
        '<div class="col" style="gap:16px">' +
          '<div class="card"><div class="card-title">🏪 合作商家</div>' +
            '<div class="col mt-12" style="gap:10px">' + merchants.map(function (m) {
              var cnt = V.db.coupons.filter(function (c) { return c.merchantId === m.id && c.active; }).length;
              return '<div class="item" style="padding:12px">' +
                '<span class="deal-logo">' + m.logo + '</span>' +
                '<div class="grow small"><b>' + U.esc(m.name) + '</b>' +
                  '<div class="tiny muted mt-8">' + U.esc(m.category) + ' · ' + U.esc(m.campus) + ' · ' + cnt + ' 张券在架</div></div>' +
                '<span class="badge brand">推广中</span></div>';
            }).join('') + '</div>' +
          '</div>' +
          '<div class="card"><div class="card-title">📈 这条收入怎么来的</div>' +
            '<p class="small muted mt-8">校园商家按月付费入驻（当前套餐 ' + U.money(V.s().merchantMonthly) + '/月），平台提供可追踪的优惠券：领取、核销全部留痕，商家能看到真实转化。</p>' +
            '<div class="table-wrap mt-12"><table class="tb" style="min-width:auto"><tbody>' +
              '<tr><td>已领券</td><td><b>' + st.couponClaimed + '</b> 张</td></tr>' +
              '<tr><td>已核销</td><td><b>' + st.couponUsed + '</b> 张</td></tr>' +
              '<tr><td>商家月度收入</td><td><b>' + U.money(st.merchantRevenue) + '</b></td></tr>' +
            '</tbody></table></div>' +
            '<div class="notice mt-12">学生领取免费，商家为精准触达付费——这是 PinDa 第三阶段的主要收入之一。</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };
})();
