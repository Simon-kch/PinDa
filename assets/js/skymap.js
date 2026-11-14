/* ==========================================================================
   PinDa 星空背景
   · 使用真实星表（assets/data/sky.json），按赤经赤纬做球面投影
   · 画面中心对准北天极：众星缓慢绕北极星旋转（天球周日运动），北极星几乎不动
   · 标注北斗七星 → 北极星的指北线、织女星（VEGA）与夏季大三角
   · 黑底金线，Canvas 渲染，自动适配 DPR、窗口尺寸、页面可见性与「减少动态效果」
   ========================================================================== */
(function () {
  var V = (window.Vega = window.Vega || {});
  var DEG = Math.PI / 180;

  var DEFAULTS = {
    data: 'assets/data/sky.json',
    center: { ra: 225, dec: 62 },   // 视场中心（赤经度 / 赤纬度），兼顾北极与织女星
    fov: 108,                       // 视场直径（度）
    spin: 0.0055,                   // 天球自转角速度（弧度/秒），约 19 分钟转一圈
    twinkle: true,
    labels: true,
    interactive: true,              // 鼠标轻微视差
    starColor: [242, 228, 190],
    lineColor: [198, 161, 91],
    accent: [255, 226, 150]
  };

  function toVec(raDeg, decDeg) {
    var ra = raDeg * DEG, dec = decDeg * DEG;
    var cd = Math.cos(dec);
    return { x: cd * Math.cos(ra), y: cd * Math.sin(ra), z: Math.sin(dec) };
  }
  function norm(v) { var l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; }
  function cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
  function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

  var cache = { data: null, promise: null };
  function loadData(url) {
    if (cache.data) return Promise.resolve(cache.data);
    if (cache.promise) return cache.promise;
    if (typeof fetch !== 'function') return Promise.resolve(null);   // 极端环境（无 fetch）直接放弃，不报错
    cache.promise = fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.stars) { cache.promise = null; return null; }   // 加载失败不缓存，下次进入首页会自动重试
        var idx = {};
        d.stars.forEach(function (s, i) {
          var x = s[1]; while (x < 0) x += 360; while (x >= 360) x -= 360;
          idx[s[0]] = i;
          s.push(toVec(x, s[2]));
        });
        d.lines = (d.lines || []).filter(function (seq) {
          return seq.every(function (hip) { return idx[hip] !== undefined; });
        });
        d.byHip = idx;
        cache.data = d;
        return d;
      })
      .catch(function () { cache.promise = null; return null; });
    return cache.promise;
  }

  function mount(canvas, options) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = (options && options[k] !== undefined) ? options[k] : DEFAULTS[k]; });
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = {
      w: 0, h: 0, dpr: 1, t: 0, spinAngle: 0, raf: null,
      visible: true, paused: false, ptr: { x: 0, y: 0 }, target: { x: 0, y: 0 },
      data: null, cam: null, maxR: 1, ctrl: null
    };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var w = Math.max(320, rect.width || window.innerWidth);
      var h = Math.max(240, rect.height || window.innerHeight);
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = w; state.h = h;
      canvas.width = Math.round(w * state.dpr);
      canvas.height = Math.round(h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      var fov = o.fov * DEG;
      state.maxR = Math.tan(fov / 4);          // 立体投影：半径 = tan(θ/2)
      state.scale = Math.min(w, h) * 0.52 / state.maxR;
    }

    function buildCamera() {
      var c = o.center;
      var raOff = Math.sin(state.spinAngle) * 0;   // 自转通过旋转星体实现，相机保持不动
      var dec = c.dec + state.ptr.y * 6;
      var ra = c.ra + raOff + state.ptr.x * 8;
      var w = norm(toVec(ra, dec));
      var u = norm(cross({ x: 0, y: 0, z: 1 }, w));
      var v = cross(w, u);
      state.cam = { u: u, v: v, w: w, cosEdge: Math.cos(o.fov * DEG / 2) };
    }

    function project(p) {
      var cam = state.cam;
      var pz = p.x * cam.w.x + p.y * cam.w.y + p.z * cam.w.z;
      if (pz <= cam.cosEdge) return null;
      var px = p.x * cam.u.x + p.y * cam.u.y + p.z * cam.u.z;
      var py = p.x * cam.v.x + p.y * cam.v.y + p.z * cam.v.z;
      var k = 1 / (1 + pz);
      return { x: state.w / 2 + px * k * state.scale, y: state.h / 2 - py * k * state.scale, z: pz };
    }

    function starSize(mag) {
      var s = Math.max(0.35, (6.1 - mag) * 0.42);
      return s;
    }

    function draw() {
      var d = state.data;
      ctx.clearRect(0, 0, state.w, state.h);
      var g = ctx.createRadialGradient(state.w * 0.5, state.h * 0.42, 10, state.w * 0.5, state.h * 0.5, Math.max(state.w, state.h) * 0.75);
      g.addColorStop(0, 'rgba(28,24,18,0.85)');
      g.addColorStop(0.55, 'rgba(10,9,13,0.9)');
      g.addColorStop(1, 'rgba(5,4,8,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, state.w, state.h);
      if (!d) return;

      var cos = Math.cos(state.spinAngle), sin = Math.sin(state.spinAngle);
      var pts = new Array(d.stars.length);
      var i, s, p;
      for (i = 0; i < d.stars.length; i++) {
        s = d.stars[i];
        var v = s[4];
        var rx = v.x * cos - v.y * sin;
        var ry = v.x * sin + v.y * cos;
        p = project({ x: rx, y: ry, z: v.z });
        pts[i] = p;
      }

      /* 星座连线 */
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(' + o.lineColor.join(',') + ',0.2)';
      ctx.beginPath();
      d.lines.forEach(function (seq) {
        var started = false;
        seq.forEach(function (hip) {
          var pp = pts[d.byHip[hip]];
          if (!pp) { started = false; return; }
          if (!started) { ctx.moveTo(pp.x, pp.y); started = true; }
          else ctx.lineTo(pp.x, pp.y);
        });
      });
      ctx.stroke();

      /* 恒星 */
      var t = state.t;
      for (i = 0; i < d.stars.length; i++) {
        s = d.stars[i]; p = pts[i];
        if (!p) continue;
        var r = starSize(s[3]);
        var a = 0.55 + Math.min(0.45, (4.2 - s[3]) * 0.16);
        if (o.twinkle) a *= 0.86 + 0.14 * Math.sin(t * 1.6 + i * 1.7);
        /* 边缘渐隐，避免生硬的圆边 */
        var edge = Math.min(1, Math.max(0, (p.z - state.cam.cosEdge) * 3.2));
        ctx.globalAlpha = Math.max(0, a * (0.25 + 0.75 * edge));
        ctx.fillStyle = 'rgb(' + o.starColor.join(',') + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* 指北线：北斗斗口两星 → 北极星 */
      var named = {};
      (d.named || []).forEach(function (n) { named[n[0]] = { en: n[1], zh: n[2], p: pts[d.byHip[n[0]]] }; });
      var dubhe = named[54061], merak = named[62956], polaris = named[11767], vega = named[91262];
      if (dubhe && merak && polaris && dubhe.p && merak.p && polaris.p) {
        ctx.save();
        ctx.setLineDash([5, 7]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(' + o.accent.join(',') + ',0.5)';
        var dx = dubhe.p.x - merak.p.x, dy = dubhe.p.y - merak.p.y;
        ctx.beginPath();
        ctx.moveTo(merak.p.x, merak.p.y);
        ctx.lineTo(merak.p.x + dx * 5.4, merak.p.y + dy * 5.4);
        ctx.stroke();
        ctx.restore();
      }

      /* 重点恒星光晕与文字 */
      if (o.labels) {
        var isEN = V.i18n && V.i18n.lang === 'en';
        Object.keys(named).forEach(function (hip) {
          var n = named[hip];
          if (!n.p) return;
          var isKey = hip === '11767' || hip === '91262';
          ctx.save();
          ctx.globalAlpha = isKey ? 0.95 : 0.7;
          ctx.fillStyle = 'rgb(' + (isKey ? o.accent : o.starColor).join(',') + ')';
          ctx.shadowColor = 'rgba(' + o.accent.join(',') + ',0.9)';
          ctx.shadowBlur = isKey ? 16 : 8;
          ctx.beginPath();
          ctx.arc(n.p.x, n.p.y, isKey ? 2.6 : 1.8, 0, 6.2832);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = isKey ? 0.95 : 0.62;
          ctx.fillStyle = isKey ? 'rgba(255,231,166,1)' : 'rgba(232,219,188,.85)';
          ctx.font = (isKey ? '600 13px' : '12px') + ' "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,.85)';
          ctx.shadowBlur = 6;
          var lx = n.p.x + (hip === '91262' ? 12 : 10);
          var ly = n.p.y + (n.p.y < state.h * 0.5 ? -12 : 12);
          ctx.fillText(isEN ? String(n.en || '').toUpperCase() : n.zh, lx, ly);
          if (isKey) {
            ctx.globalAlpha = 0.5;
            ctx.font = '10px ui-monospace,Consolas,monospace';
            ctx.fillText(isEN
              ? (hip === '11767' ? 'NORTH STAR' : 'LYRA α')
              : n.en.toUpperCase(), lx, ly + 15);
          }
          ctx.restore();
        });
      }

      /* 指北说明 */
      if (o.labels && polaris && polaris.p && dubhe && dubhe.p) {
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = 'rgba(198,161,91,.95)';
        ctx.font = '11.5px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
        /* 固定在左下角，避免和首屏卡片重叠 */
        var mid = { x: 24, y: state.h - 26 };
        ctx.fillText(V.i18n && V.i18n.lang === 'en'
          ? 'Big Dipper points north · the sky turns around it'
          : '北斗指北 · 众星绕其旋转', mid.x, mid.y);
        ctx.restore();
      }
      if (o.labels && vega && vega.p && polaris && polaris.p) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = 'rgba(' + o.lineColor.join(',') + ',0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(polaris.p.x, polaris.p.y);
        ctx.lineTo(vega.p.x, vega.p.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    function frame(now) {
      state.raf = null;
      if (!state.visible || state.paused) return;
      if (!state.last) state.last = now;
      var dt = Math.min(0.05, (now - state.last) / 1000);
      state.last = now;
      state.t += dt;
      if (!reduce) state.spinAngle += dt * o.spin;
      /* 指针视差缓动 */
      state.ptr.x += (state.target.x - state.ptr.x) * Math.min(1, dt * 2.2);
      state.ptr.y += (state.target.y - state.ptr.y) * Math.min(1, dt * 2.2);
      buildCamera();
      draw();
      loop();
    }
    function loop() { if (!state.raf && !reduce) state.raf = window.requestAnimationFrame(frame); }

    function onResize() { resize(); buildCamera(); draw(); }
    function onMove(e) {
      if (!o.interactive) return;
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      state.target.x = (e.clientX / w - 0.5) * 2;
      state.target.y = (e.clientY / h - 0.5) * 2;
    }

    resize();
    buildCamera();
    loadData(o.data).then(function (d) {
      state.data = d;
      draw();
      if (!d) return;
      if (!reduce) loop();
    });
    window.addEventListener('resize', onResize);
    if (o.interactive) window.addEventListener('mousemove', onMove, { passive: true });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        state.visible = entries[0].isIntersecting;
        if (state.visible) loop();
      }, { threshold: 0.01 });
      io.observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      state.visible = !document.hidden;
      if (state.visible) loop();
    });

    return {
      destroy: function () {
        if (state.raf) window.cancelAnimationFrame(state.raf);
        window.removeEventListener('resize', onResize);
        if (o.interactive) window.removeEventListener('mousemove', onMove);
      },
      pause: function () { state.paused = true; },
      resume: function () { state.paused = false; state.last = 0; loop(); },
      renderOnce: function () { buildCamera(); draw(); },
      state: state
    };
  }

  V.skymap = { mount: mount, DEFAULTS: DEFAULTS, version: '1.0.0' };
})();
