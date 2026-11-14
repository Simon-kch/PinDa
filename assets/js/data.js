/* ==========================================================================
   PinDa · 数据层
   - 全部数据存在浏览器 localStorage，双击 index.html 即可运行，无需后端
   - 后续接入真实后端时，只需替换本文件底部的 load/save 与几个查询函数
   ========================================================================== */
(function () {
  var V = (window.Vega = window.Vega || {});
  var DB_KEY = 'vega.db.v1';
  var SESSION_KEY = 'vega.session.v1';

  /* ---------------- 工具 ---------------- */
  var _seq = 0;
  function uid(prefix) {
    _seq++;
    return (prefix || 'id') + '_' + Date.now().toString(36).slice(-5) + _seq.toString(36) +
      Math.random().toString(36).slice(2, 5);
  }
  function iso(dayOffset, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() + (dayOffset || 0));
    if (hour != null) d.setHours(hour, minute || 0, 0, 0);
    return d.toISOString();
  }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function orderNo() {
    var d = new Date();
    var stamp = '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    _seq++;
    return 'VG' + stamp + ('00' + (_seq + 100)).slice(-3);
  }
  V.uid = uid; V.iso = iso; V.dayKey = dayKey; V.round2 = round2; V.orderNo = orderNo;

  /* ---------------- 默认平台配置（后台可改） ---------------- */
  var DEFAULT_SETTINGS = {
    stage: 2,                 // 运营阶段：1 启动期（全免费）/ 2 收入验证 / 3 规模扩张
    commissionFree: 0.06,     // 普通用户成交佣金费率
    commissionPro: 0.02,      // 会员成交佣金费率
    serviceFee: 1,            // 固定小额服务费（拼单等场景，会员免收）
    priceMonthly: 19.9,       // 会员月卡
    priceTerm: 99,            // 会员学期卡（4 个月）
    termMonths: 4,
    boostPrice: 1.9,          // 单条信息加曝光（24 小时置顶）价格
    boostHours: 24,
    merchantMonthly: 199,     // 校园商家月度推广套餐
    dailyPostFree: 3,         // 普通用户每日发布条数
    dailyPostPro: 20,         // 会员每日发布条数
    contactFreeDaily: 3,      // 普通用户每日查看联系方式次数
    proPriority: true,        // 会员信息优先展示
    proPeriodMinutes: 30,     // 新发布信息的会员优先窗口（分钟）
    platformName: 'PinDa 校园互助平台',
    campuses: ['SIP', 'TC']
  };
  /* 校区简称：SIP = 苏州工业园区（独墅湖）校区，TC = 太仓校区 */
  V.CAMPUS_LABEL = { SIP: 'SIP · 苏州工业园区校区', TC: 'TC · 太仓校区' };
  V.LEGACY_CAMPUS = {
    '西浦南校区': 'SIP', '西浦北校区': 'SIP', '独墅湖周边': 'SIP', '苏州其他区域': 'SIP', '太仓校区': 'TC'
  };
  V.campusText = function (c) { return V.CAMPUS_LABEL[c] || c || ''; };

  /* ---------------- 运营阶段与收费规则 ----------------
     来自策划组结论：不要把 6 种收入一开始全做起来，分三阶段推进。 */
  V.STAGES = {
    1: {
      id: 1, name: '第一阶段 · 项目启动', goal: '先证明有人愿意使用',
      rules: { carpool: 'free', groupbuy: 'free', partner: 'free', collab: 'free', daidai: 'free' },
      focus: ['PINPIN：免费发布拼车、拼单和搭子需求', 'DAIDAI：测试代取、跑腿等订单的实际需求', '重点验证订单量、完成率、用户复购率'],
      note: '先建立用户基础，不要让收费挡住用户进入平台。'
    },
    2: {
      id: 2, name: '第二阶段 · 收入验证', goal: '开始赚取交易收入',
      rules: { carpool: 'free', groupbuy: 'service', partner: 'free', collab: 'free', daidai: 'commission' },
      focus: ['DAIDAI：对完成的代办订单收取佣金', 'PINPIN：对适合收费的拼单、商业撮合服务收取费用', '引入少量周边商家合作，验证推广收入'],
      note: '验证每笔订单能否覆盖平台运营成本；拼车与搭子保持免费。'
    },
    3: {
      id: 3, name: '第三阶段 · 规模扩张', goal: '发展更稳定的收入',
      rules: { carpool: 'service', groupbuy: 'service', partner: 'free', collab: 'service', daidai: 'commission' },
      focus: ['商家月度推广套餐', '社团和校园活动合作', '高级发布、组织管理等增值服务'],
      note: '降低对单笔订单佣金的依赖。'
    }
  };
  V.CONTEXT_LABEL = { carpool: '拼车出行', groupbuy: '拼单购物', partner: '找搭子', collab: '合作机会', daidai: '代代代办' };
  V.stage = function () { return V.STAGES[V.s().stage] || V.STAGES[2]; };
  V.chargeMode = function (context) {
    var r = V.stage().rules;
    return r[context] || 'free';
  };
  /* 计算某类交易在当前阶段、当前身份下的费用 */
  V.feeFor = function (context, user, amount) {
    var s = V.s();
    var mode = V.chargeMode(context);
    var pro = V.isPro(user);
    var amt = Number(amount) || 0;
    if (mode === 'free') {
      return { mode: 'free', rate: 0, commission: 0, net: round2(amt), label: '当前阶段免费', pro: pro };
    }
    if (mode === 'service') {
      var fee = pro ? 0 : round2(s.serviceFee);
      return {
        mode: 'service', rate: 0, commission: Math.min(fee, amt), net: round2(Math.max(0, amt - fee)),
        label: pro ? '会员免服务费' : '平台服务费 ' + fee + ' 元', pro: pro
      };
    }
    var rate = pro ? s.commissionPro : s.commissionFree;
    var commission = round2(amt * rate);
    return { mode: 'commission', rate: rate, commission: commission, net: round2(amt - commission), label: (pro ? '会员费率 ' : '普通费率 ') + Math.round(rate * 1000) / 10 + '%', pro: pro };
  };

  /* ---------------- 会员权益 ---------------- */
  V.privileges = [
    { icon: '🚀', title: '信息优先展示', desc: '发布内容置顶展示，并带「会员优先」标识', free: false, pro: true },
    { icon: '🔎', title: '高级筛选与优先查询', desc: '按信用分、认证状态、价格区间精准筛选', free: false, pro: true },
    { icon: '📞', title: '查看联系方式不限次', desc: '普通用户每日 3 次，会员不限次', free: '3 次/日', pro: '不限次' },
    { icon: '💸', title: '成交佣金折扣', desc: '平台按成交金额抽成，会员费率更低', free: '6%', pro: '2%' },
    { icon: '📝', title: '发布额度提升', desc: '每日可发布的信息条数', free: '3 条/日', pro: '20 条/日' },
    { icon: '⚡', title: '新需求优先接单', desc: '代代新发布的代购需求，会员先看到', free: false, pro: true },
    { icon: '👑', title: '会员专属标识', desc: '个人主页、评价页展示会员徽章，成交更快', free: false, pro: true },
    { icon: '🎫', title: '专属客服与纠纷协助', desc: '交易纠纷优先介入处理', free: '普通排队', pro: '优先响应' }
  ];

  /* ---------------- 演示数据 ---------------- */
  function mkUser(o) {
    var base = {
      password: '123456',
      avatar: '🙂',
      color: '#6C4CF1',
      campus: 'SIP',
      college: (V.UNDECIDED_MAJOR || '还未选择专业'),
      grade: '本科',
      role: 'student',
      isMember: false,
      memberExpire: null,
      verified: true,
      studentId: '',
      schoolEmail: '',
      verifiedBy: null,
      verifiedAt: null,
      credit: 88,
      rating: 4.8,
      deals: 5,
      balance: 180,
      favs: [],
      postCount: 0,
      contactCount: 0,
      quotaDate: dayKey(),
      joinedAt: iso(-160),
      intro: ''
    };
    for (var k in o) base[k] = o[k];
    return base;
  }

  function seed() {
    var users = [
      mkUser({
        id: 'u_admin', phone: '19900000000', nickname: 'PinDa 小助手', avatar: '🛠️', color: '#3B62E8',
        role: 'admin', isMember: true, memberExpire: iso(365), credit: 100, rating: 5, deals: 0,
        balance: 0, college: '平台运营', grade: '官方', intro: 'PinDa 平台官方账号，处理审核与纠纷。',
        studentId: '', schoolEmail: 'support@xjtlu.edu.cn', verifiedBy: 'official', verifiedAt: iso(-400)
      }),
      mkUser({
        id: 'u_lin', phone: '13800000001', nickname: '李明轩', avatar: '🎧', color: '#6C4CF1',
        college: '计算机科学与技术', grade: '大一', credit: 82, rating: 4.6, deals: 3, balance: 120,
        studentId: '2024128731', schoolEmail: 'mingxuan.li24@student.xjtlu.edu.cn', verifiedBy: 'email', verifiedAt: iso(-140),
        intro: '常用拼车回上海，行李少，好沟通。'
      }),
      mkUser({
        id: 'u_wang', phone: '13800000002', nickname: '王雨薇', avatar: '🌸', color: '#E5484D',
        isMember: true, memberExpire: iso(72), college: '会计学', grade: '大三', credit: 96, rating: 4.9,
        deals: 21, balance: 460, studentId: '2023091452', schoolEmail: 'yuwei.wang23@student.xjtlu.edu.cn',
        verifiedBy: 'email', verifiedAt: iso(-320), intro: '长期带拼车、拼单，按时出发从不鸽。'
      }),
      mkUser({
        id: 'u_chen', phone: '13800000003', nickname: '陈子豪', avatar: '🏀', color: '#E28310',
        isMember: true, memberExpire: iso(48), college: '金融数学', grade: '大二', credit: 93, rating: 4.8,
        deals: 14, balance: 320, studentId: '2024033819',
        schoolEmail: 'zihao.chen24@student.xjtlu.edu.cn', verifiedBy: 'email', verifiedAt: iso(-260),
        intro: '有车党，周末往返苏州—上海。'
      }),
      mkUser({
        id: 'u_zhao', phone: '13800000004', nickname: '赵欣怡', avatar: '📚', color: '#12B5A5',
        college: '建筑学', grade: '大四', credit: 90, rating: 4.7, deals: 9,
        studentId: '2022066310', schoolEmail: 'xinyi.zhao22@student.xjtlu.edu.cn',
        verifiedBy: 'email', verifiedAt: iso(-380), intro: '设计课熬夜党，找图书馆搭子。'
      }),
      mkUser({
        id: 'u_sun', phone: '13800000005', nickname: '孙浩然', avatar: '🚲', color: '#3B62E8',
        college: '电子科学与技术', grade: '大二', credit: 86, rating: 4.5, deals: 11, balance: 90,
        campus: 'TC', studentId: '2024019207', schoolEmail: 'haoran.sun24@student.xjtlu.edu.cn',
        verifiedBy: 'email', verifiedAt: iso(-230), intro: '太仓—苏州通勤，可带货。'
      }),
      mkUser({
        id: 'u_zhou', phone: '13800000006', nickname: '周芷若', avatar: '☕', color: '#8E72FF',
        isMember: true, memberExpire: iso(120), college: '管理学硕士', grade: '研一', credit: 95, rating: 5,
        deals: 27, balance: 610, studentId: '2025108443', schoolEmail: 'zhiruo.zhou25@student.xjtlu.edu.cn',
        verifiedBy: 'email', verifiedAt: iso(-150), intro: '山姆/Costco 会员，长期帮带超市代购。'
      }),
      mkUser({
        id: 'u_gao', phone: '13800000007', nickname: '高博文', avatar: '🎮', color: '#0B7F74',
        college: '生物科学', grade: '大三', credit: 79, rating: 4.4, deals: 4,
        studentId: '2023072256', schoolEmail: 'bowen.gao23@student.xjtlu.edu.cn',
        verifiedBy: 'email', verifiedAt: iso(-300), intro: '羽毛球/开黑都行，主要想找人一起吃饭。'
      }),
      mkUser({
        id: 'u_xu', phone: '13800000008', nickname: '徐若涵', avatar: '✈️', color: '#C79A21',
        isMember: true, memberExpire: iso(96), college: '英语（传媒英语）', grade: '大一', credit: 91, rating: 4.8,
        deals: 8, balance: 250, studentId: '2024113568',
        schoolEmail: 'ruohan.xu24@student.xjtlu.edu.cn', verifiedBy: 'email', verifiedAt: iso(-100),
        intro: '常飞日本/香港，可帮带化妆品与药品。'
      })
    ];

    var pinpin = [
      {
        id: 'p1', type: 'carpool', ownerId: 'u_wang',
        title: '10/18 苏州 → 上海虹桥 T2 机场拼车', from: '西浦南校区', to: '上海虹桥机场 T2',
        departAt: iso(2, 6, 30), capacity: 4, joined: ['u_lin', 'u_chen'], price: 80,
        desc: '早班机，6:30 南校区正门集合，车型 SUV，可放 2 个 28 寸行李。走 G2 京沪高速，不中途接人。',
        tags: ['可放行李', '准点出发', '女生同车'], status: 'open', createdAt: iso(-0.3)
      },
      {
        id: 'p2', type: 'groupbuy', ownerId: 'u_chen',
        title: '周末山姆会员店拼单（代拼 + 送到校门口）', store: '山姆会员商店（苏州）',
        deadline: iso(3, 20, 0), capacity: 8, joined: ['u_wang', 'u_zhou', 'u_gao'], price: 120,
        desc: '我有会员卡，周六下午去采购。拼单者把清单发我，按小票实付，均摊油费 5 元。生鲜冷冻类暂不接。',
        tags: ['有会员卡', '小票实拍', '校门口自提'], status: 'open', createdAt: iso(-1.2)
      },
      {
        id: 'p3', type: 'partner', ownerId: 'u_zhao',
        title: '期末周图书馆早八连坐搭子（南区 4 楼）', goal: '互相监督、考勤打卡、轮流占座',
        deadline: iso(6, 22, 0), capacity: 3, joined: ['u_gao'], price: 0,
        desc: '早 8 点到图书馆，晚 10 点走，中间午休 1 小时。希望能连续坚持 7 天，中途不退。希望是同类课程压力大的同学。',
        tags: ['期末周', '考勤打卡', '长期'], status: 'open', createdAt: iso(-0.8)
      },
      {
        id: 'p4', type: 'carpool', ownerId: 'u_sun',
        title: '周六 太仓 → 苏州观前街 自驾拼车', from: '太仓校区', to: '苏州观前街',
        departAt: iso(3, 9, 0), capacity: 3, joined: [], price: 35,
        desc: '回程约 18:00 从观前街出发，可顺便去苏州中心。车上不抽烟，可放 4 个背包。',
        tags: ['当日往返', '可带货'], status: 'open', createdAt: iso(-0.5)
      },
      {
        id: 'p5', type: 'groupbuy', ownerId: 'u_zhou',
        title: '肯德基疯狂星期四拼单（南校区）', store: '肯德基（独墅湖店）',
        deadline: iso(0, 17, 30), capacity: 6, joined: ['u_lin', 'u_xu'], price: 25,
        desc: '今天 18:00 下单，凑到 6 份免配送费。我会把订单截图发群里，按实际金额转账。',
        tags: ['今日截止', '免配送费'], status: 'open', createdAt: iso(-0.15)
      },
      {
        id: 'p6', type: 'partner', ownerId: 'u_gao',
        title: '每周三 19:00 独墅湖体育馆 羽毛球搭子', goal: '固定 2 人对抗，缺 1 人双打',
        deadline: iso(5, 19, 0), capacity: 2, joined: [], price: 30,
        desc: '场地费 AA，约 30 元/人。水平中等，主打出汗不为胜负，能坚持每周来最好。',
        tags: ['每周固定', 'AA 场地费'], status: 'open', createdAt: iso(-1.6)
      },
      {
        id: 'p7', type: 'carpool', ownerId: 'u_xu',
        title: '10/20 苏州 → 上海浦东机场 早班机拼车', from: '西浦南校区', to: '上海浦东机场 T1',
        departAt: iso(4, 5, 0), capacity: 4, joined: ['u_zhao'], price: 95,
        desc: '05:00 出发去浦东，赶 09:00 航班。行李多的话提前说，后备箱能放 3 个箱子。',
        tags: ['早班机', '可放行李'], status: 'open', createdAt: iso(-0.2)
      },
      {
        id: 'p8', type: 'groupbuy', ownerId: 'u_lin',
        title: '宜家 IKEA 拼单（小件家具，送货到校）', store: '宜家家居（苏州）',
        deadline: iso(4, 21, 0), capacity: 6, joined: ['u_chen', 'u_wang'], price: 60,
        desc: '凑满 6 单我自己开车去拉，运费按件均摊。大件床垫类的不接，只接收纳盒、桌面小件。',
        tags: ['自己开车', '均摊运费'], status: 'open', createdAt: iso(-2.1)
      },
      {
        id: 'p9', type: 'partner', ownerId: 'u_wang',
        title: '雅思口语陪练搭子（目标 6.5）', goal: '每周 3 次线上对练，每天 30 分钟',
        deadline: iso(10, 22, 0), capacity: 2, joined: ['u_xu'], price: 0,
        desc: '我考过两次口语 6.0，想找水平接近的同学一起刷题库 Part2/Part3，互相纠音与记笔记。',
        tags: ['线上', '语言考试'], status: 'open', createdAt: iso(-3.2)
      },
      {
        id: 'p10', type: 'carpool', ownerId: 'u_chen',
        title: '周日 常熟 → 苏州 回校拼车（顺路带人）', from: '常熟理工学院', to: '西浦南校区',
        departAt: iso(5, 16, 0), capacity: 4, joined: ['u_gao'], price: 40,
        desc: '周日下午回校，走常嘉高速。可带 2 个行李箱，车上有充电线。',
        tags: ['回校', '可放行李'], status: 'open', createdAt: iso(-1.1)
      },
      {
        id: 'p11', type: 'collab', ownerId: 'u_gao',
        title: 'BUS107 数据分析小组作业 找 2 位队友', goal: '组 3 人小队伍，分工做数据清洗 + 可视化 + 报告',
        deadline: iso(6, 22, 0), capacity: 3, joined: ['u_zhao'], price: 0,
        desc: '已经选好题目：苏州餐饮外卖销量分析。我会 Python 与爬虫，想找一位会 Tableau/Power BI、一位擅长写报告的同学。每周三晚线上碰一次。',
        tags: ['小组作业', '商学院', 'Python'], status: 'open', createdAt: iso(-0.7)
      },
      {
        id: 'p12', type: 'collab', ownerId: 'u_xu',
        title: '创业比赛组队：缺 1 位 UI 设计同学', goal: '参加校园创业大赛，已有 3 人（产品 / 开发 / 运营）',
        deadline: iso(9, 22, 0), capacity: 4, joined: [], price: 0,
        desc: '项目方向是校园生活服务，需要一位会用 Figma、能出完整视觉稿的同学。比赛周期约 6 周，材料可复用做作品集。',
        tags: ['创业比赛', 'Figma', '组队'], status: 'open', createdAt: iso(-2.2)
      },
      {
        id: 'p13', type: 'carpool', ownerId: 'u_sun',
        title: '周一 07:30 太仓校区 → 园区西浦南校区（双校区通勤）', from: '太仓校区', to: '西浦南校区',
        departAt: iso(3, 7, 30), capacity: 4, joined: ['u_zhao', 'u_wang'], price: 45,
        desc: '每周一固定跑双校区，比班车灵活：07:30 出发，08:40 前到南校区。可带笔记本电脑包与两个行李箱，回程周一 18:30 原路返回。',
        tags: ['双校区', '每周固定', '可放行李'], status: 'open', createdAt: iso(-0.45)
      }
    ];

    var daidai = [
      {
        id: 'd1', kind: 'request', category: '出国代购', ownerId: 'u_lin',
        title: '求带日本药妆：大阪心斋桥退税店清单', from: '日本大阪', to: '西浦南校区',
        expectAt: iso(9, 20, 0), fee: 20, budget: 800,
        desc: '清单：资生堂洗面奶 x2、小林制药退热贴 x3、DHC 唇膏 x4。可接受小票价 +20 元代购费，超预算部分提前问。',
        tags: ['药妆', '要小票'], status: 'open', createdAt: iso(-0.4)
      },
      {
        id: 'd2', kind: 'request', category: '校园代办', ownerId: 'u_zhao',
        title: '东区菜鸟驿站取大件快递（显示器）', from: '东区菜鸟驿站', to: '西浦北校区 B 栋',
        expectAt: iso(1, 19, 0), fee: 15, budget: 0,
        desc: '取件码 8-2-1002，是个 27 寸显示器，需要能搬动、宿舍楼下无电梯（搬 3 楼）。',
        tags: ['大件', '需搬楼'], status: 'taken', takerId: 'u_sun', createdAt: iso(-0.9)
      },
      {
        id: 'd3', kind: 'trip', category: '出国代购', ownerId: 'u_xu',
        title: '10/19–10/22 我在日本，可帮带化妆品/药品/零食', from: '日本东京', to: '西浦南校区',
        expectAt: iso(8, 21, 0), fee: 15, budget: 3000, capacity: 10, taken: 3,
        desc: '代购费按小票金额 15% 计（不足 10 元按 10 元）。机场免税店可拍照确认。不接烟酒与需要处方的药品。',
        tags: ['东京', '免税店', '可拍照'], status: 'open', createdAt: iso(-0.5)
      },
      {
        id: 'd4', kind: 'request', category: '跑腿带饭', ownerId: 'u_gao',
        title: '南区食堂带两份麻辣香锅（11:40 前）', from: '南区一食堂', to: '南校区 3 号楼 502',
        expectAt: iso(0, 11, 40), fee: 6, budget: 40,
        desc: '一份微辣多土豆，一份不辣加海带。我在 3 号楼 502，到了喊我下楼，可微信先转 30。',
        tags: ['带饭', '中午'], status: 'open', createdAt: iso(-0.05)
      },
      {
        id: 'd5', kind: 'trip', category: '超市代取', ownerId: 'u_zhou',
        title: '本周六 山姆会员店可代购（我有会员卡）', from: '山姆会员商店（苏州）', to: '西浦北校区',
        expectAt: iso(3, 18, 0), fee: 10, budget: 2000, capacity: 12, taken: 5,
        desc: '代购费按小票 10% 计，小票与大件商品拍照留证。鲜奶、蛋糕等易坏品建议自提。',
        tags: ['会员卡', '小票实拍'], status: 'open', createdAt: iso(-1.3)
      },
      {
        id: 'd6', kind: 'request', category: '出国代购', ownerId: 'u_wang',
        title: '求带香港 ISSEY MIYAKE 香水（专柜款）', from: '香港铜锣湾', to: '西浦南校区',
        expectAt: iso(12, 20, 0), fee: 80, budget: 1200,
        desc: '指定款：一生之水 100ml 淡香水。需要专柜小票 + 防拆膜完整，可接受代购费 80 元。',
        tags: ['奢侈品', '要专柜小票'], status: 'open', createdAt: iso(-1.9)
      },
      {
        id: 'd7', kind: 'request', category: '校园代办', ownerId: 'u_chen',
        title: '帮去九龙医院取药（处方已备好）', from: '九龙医院药房', to: '西浦南校区',
        expectAt: iso(2, 17, 0), fee: 25, budget: 300,
        desc: '处方单与就诊卡在我这，我会先转给你。药费按实际报销，代取费 25 元。药品是常规胃炎药。',
        tags: ['医院', '需跑腿'], status: 'open', createdAt: iso(-2.4)
      },
      {
        id: 'd8', kind: 'trip', category: '出国代购', ownerId: 'u_zhou',
        title: '11 月初 香港出差 可带化妆品与药品', from: '香港', to: '西浦南校区',
        expectAt: iso(20, 20, 0), fee: 12, budget: 5000, capacity: 20, taken: 1,
        desc: '11/2–11/5 在香港，可带莎莎/免税店化妆品，代购费 12%。大额需要先付 50% 定金。',
        tags: ['香港', '可带大额'], status: 'open', createdAt: iso(-2.8)
      },
      {
        id: 'd9', kind: 'request', category: '校园代办', ownerId: 'u_xu',
        title: '帮取 4 个快递（西区菜鸟驿站）', from: '西区菜鸟驿站', to: '西浦南校区 D 栋',
        expectAt: iso(1, 18, 30), fee: 8, budget: 0,
        desc: '都是小件，取件码我会私发。送到 D 栋门口即可，我在楼下等。',
        tags: ['小件', '顺路'], status: 'open', createdAt: iso(-0.6)
      },
      {
        id: 'd10', kind: 'request', category: '超市代取', ownerId: 'u_sun',
        title: '太仓大润发代购（零食 + 日用品）', from: '大润发（太仓）', to: '太仓校区',
        expectAt: iso(2, 16, 0), fee: 8, budget: 200,
        desc: '清单不长，主要想找人顺路带一下。代购费 8 元，可接受货到付款。',
        tags: ['太仓', '顺路'], status: 'open', createdAt: iso(-1.4)
      }
    ];

    var orders = [
      {
        id: 'o1', no: 'VG20261009001', refType: 'daidai', refId: 'd2', title: '东区菜鸟驿站取大件快递（显示器）',
        buyerId: 'u_zhao', sellerId: 'u_sun', amount: 15, rate: 0.06, commission: 0.9, net: 14.1,
        status: 'completed', createdAt: iso(-6, 19, 10), finishedAt: iso(-5.5, 20, 0),
        timeline: [
          { at: iso(-6, 19, 10), text: '订单创建，等待接单' },
          { at: iso(-6, 20, 0), text: '孙浩然 接单' },
          { at: iso(-5.5, 18, 30), text: '已送达并当面确认' },
          { at: iso(-5.5, 20, 0), text: '交易完成，平台佣金 ¥0.90' }
        ]
      },
      {
        id: 'o2', no: 'VG20261012002', refType: 'daidai', refId: 'd5', title: '山姆会员店代购（会员行程）',
        buyerId: 'u_wang', sellerId: 'u_zhou', amount: 268, rate: 0.02, commission: 5.36, net: 262.64,
        status: 'completed', createdAt: iso(-4, 15, 0), finishedAt: iso(-3, 18, 30),
        timeline: [
          { at: iso(-4, 15, 0), text: '订单创建' },
          { at: iso(-4, 15, 5), text: '周芷若 接单，代购费 10%' },
          { at: iso(-3, 17, 0), text: '商品到校，上传小票' },
          { at: iso(-3, 18, 30), text: '交易完成，平台佣金 ¥5.36（会员费率 2%）' }
        ]
      },
      {
        id: 'o3', no: 'VG20261015003', refType: 'pinpin', refId: 'p1', title: '苏州 → 上海虹桥 T2 机场拼车',
        buyerId: 'u_lin', sellerId: 'u_wang', amount: 80, rate: 0.02, commission: 1.6, net: 78.4,
        status: 'pending', createdAt: iso(-0.4, 10, 0),
        timeline: [
          { at: iso(-0.4, 10, 0), text: '拼车成团，车费待出发后结算' }
        ]
      },
      {
        id: 'o4', no: 'VG20261016004', refType: 'daidai', refId: 'd4', title: '南区食堂带两份麻辣香锅',
        buyerId: 'u_gao', sellerId: 'u_admin', amount: 6, rate: 0.06, commission: 0.36, net: 5.64,
        status: 'processing', createdAt: iso(-0.06, 11, 0),
        timeline: [
          { at: iso(-0.06, 11, 0), text: '订单创建' },
          { at: iso(-0.05, 11, 5), text: '已接单，前往食堂' }
        ]
      }
    ];

    var messages = [
      { id: 'm1', userId: 'u_lin', title: '拼车申请已通过', body: '王雨薇 通过了你的拼车申请：10/18 苏州 → 上海虹桥 T2，06:30 南校区正门集合。', read: false, createdAt: iso(-0.3, 10, 20), link: '#/orders' },
      { id: 'm2', userId: 'u_lin', title: '待结算车费 ¥80', body: '你的拼车订单已生成待支付账单，出发当天可在订单页确认支付（会员佣金更低）。', read: false, createdAt: iso(-0.3, 10, 25), link: '#/orders' },
      { id: 'm3', userId: 'u_lin', title: '会员限时体验', body: '升级 PinDa 会员，佣金 6% → 2%，信息优先展示，还能不限次查看联系方式。', read: true, createdAt: iso(-2, 9, 0), link: '#/member' },
      { id: 'm4', userId: 'u_wang', title: '有 1 位新成员加入你的拼单', body: '山姆会员店拼单新增 1 人，当前 3/8 人，离成团又近一步。', read: false, createdAt: iso(-1.1, 21, 0), link: '#/pinpin' },
      { id: 'm5', userId: 'u_wang', title: '佣金已入账 ¥262.64', body: '订单 VG20261012002 已完成，成交金额 ¥268，平台佣金 ¥5.36（会员费率 2%），到账 ¥262.64。', read: true, createdAt: iso(-3, 18, 31), link: '#/wallet' },
      { id: 'm6', userId: 'u_admin', title: '1 条内容待审核', body: '有 1 条代购信息被用户举报，请前往管理台查看。', read: false, createdAt: iso(-0.2, 14, 0), link: '#/admin' }
    ];

    var membershipOrders = [
      { id: 'mo1', userId: 'u_wang', plan: 'term', months: 4, amount: 99, createdAt: iso(-30, 20, 10), method: '微信支付' },
      { id: 'mo2', userId: 'u_zhou', plan: 'monthly', months: 1, amount: 19.9, createdAt: iso(-5, 12, 0), method: '微信支付' },
      { id: 'mo3', userId: 'u_chen', plan: 'term', months: 4, amount: 99, createdAt: iso(-12, 9, 30), method: '支付宝' }
    ];

    var wallet = [
      { id: 'w1', userId: 'u_lin', type: 'topup', amount: 200, note: '模拟充值（微信支付）', createdAt: iso(-20, 12, 0) },
      { id: 'w2', userId: 'u_lin', type: 'expense', amount: -30, note: '山姆拼单预付定金', createdAt: iso(-4, 12, 0) },
      { id: 'w3', userId: 'u_lin', type: 'topup', amount: 50, note: '模拟充值（支付宝）', createdAt: iso(-2, 12, 0) },
      { id: 'w4', userId: 'u_lin', type: 'expense', amount: -100, note: '提现到微信零钱', createdAt: iso(-1, 12, 0) },
      { id: 'w5', userId: 'u_wang', type: 'topup', amount: 400, note: '模拟充值（微信支付）', createdAt: iso(-25, 12, 0) },
      { id: 'w6', userId: 'u_wang', type: 'expense', amount: -99, note: '开通 PinDa 学期会员', createdAt: iso(-30, 20, 10) },
      { id: 'w7', userId: 'u_wang', type: 'income', amount: 262.64, note: '订单 VG20261012002 到账（已扣佣金 ¥5.36）', createdAt: iso(-3, 18, 31), orderId: 'o2' },
      { id: 'w8', userId: 'u_wang', type: 'expense', amount: -268, note: '山姆代购订单支付', createdAt: iso(-4, 15, 2) },
      { id: 'w9', userId: 'u_zhou', type: 'income', amount: 262.64, note: '订单 VG20261012002 到账（已扣佣金 ¥5.36）', createdAt: iso(-3, 18, 31), orderId: 'o2' },
      { id: 'w10', userId: 'u_zhao', type: 'expense', amount: -15, note: '代取快递订单支付', createdAt: iso(-6, 19, 12), orderId: 'o1' },
      { id: 'w11', userId: 'u_sun', type: 'income', amount: 14.1, note: '订单 VG20261009001 到账（已扣佣金 ¥0.90）', createdAt: iso(-5.5, 20, 1), orderId: 'o1' }
    ];

    /* 校园商家推广（收入来源 3）：商家付费推广 + 可追踪优惠券 */
    var merchants = [
      { id: 'mc1', name: '第三空间咖啡（南校区店）', logo: '☕', category: '咖啡饮品', campus: '西浦南校区', monthlyFee: 199, active: true, since: iso(-60), contact: '微信：space3-cafe' },
      { id: 'mc2', name: '文星广场 · 奶茶研究所', logo: '🧋', category: '奶茶饮品', campus: '独墅湖周边', monthlyFee: 199, active: true, since: iso(-42), contact: '微信：milktea-lab' },
      { id: 'mc3', name: '老王烧烤（独墅湖店）', logo: '🍢', category: '夜宵烧烤', campus: '独墅湖周边', monthlyFee: 299, active: true, since: iso(-25), contact: '电话：139****2210' },
      { id: 'mc4', name: '一页文印（打印复印）', logo: '🖨️', category: '文印打印', campus: '西浦北校区', monthlyFee: 99, active: true, since: iso(-80), contact: '微信：yiyeprint' },
      { id: 'mc5', name: '鲜果盒子（水果店）', logo: '🍉', category: '水果生鲜', campus: '西浦南校区', monthlyFee: 149, active: true, since: iso(-15), contact: '微信：fruitbox' }
    ];
    var coupons = [
      { id: 'cp1', merchantId: 'mc1', title: '咖啡满 20 减 5', valueText: '-¥5', desc: '堂食外带均可，不与其它优惠同享', stock: 200, claimed: 86, used: 52, expireAt: iso(30), active: true },
      { id: 'cp2', merchantId: 'mc1', title: '第二杯半价（工作日 14:00–17:00）', valueText: '半价', desc: '限工作日午后时段使用', stock: 150, claimed: 64, used: 38, expireAt: iso(20), active: true },
      { id: 'cp3', merchantId: 'mc2', title: '新品奶茶 9.9 元', valueText: '¥9.9', desc: '每人限领 1 张', stock: 300, claimed: 142, used: 97, expireAt: iso(15), active: true },
      { id: 'cp4', merchantId: 'mc3', title: '夜宵满 100 减 20', valueText: '-¥20', desc: '4 人以上聚餐可用', stock: 120, claimed: 41, used: 23, expireAt: iso(45), active: true },
      { id: 'cp5', merchantId: 'mc4', title: '论文打印 8 折', valueText: '8 折', desc: '黑白 / 彩色均可，凭学生证使用', stock: 500, claimed: 210, used: 186, expireAt: iso(60), active: true },
      { id: 'cp6', merchantId: 'mc5', title: '水果拼盘 满 30 减 6', valueText: '-¥6', desc: '限门店自提', stock: 180, claimed: 73, used: 45, expireAt: iso(25), active: true }
    ];
    var couponClaims = [
      { id: 'cc1', couponId: 'cp3', userId: 'u_lin', code: 'VG7K2M9P', claimedAt: iso(-3, 12, 0), usedAt: iso(-2, 15, 0) },
      { id: 'cc2', couponId: 'cp1', userId: 'u_lin', code: 'VG4B8N1Q', claimedAt: iso(-1, 9, 0), usedAt: null },
      { id: 'cc3', couponId: 'cp5', userId: 'u_wang', code: 'VG2H5T8Z', claimedAt: iso(-5, 10, 0), usedAt: iso(-4, 16, 0) }
    ];

    return {
      version: 3,
      createdAt: new Date().toISOString(),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      users: users,
      pinpin: pinpin,
      daidai: daidai,
      orders: orders,
      messages: messages,
      membershipOrders: membershipOrders,
      wallet: wallet,
      merchants: merchants,
      coupons: coupons,
      couponClaims: couponClaims,
      reports: [
        { id: 'r1', targetType: 'daidai', targetId: 'd6', reason: '疑似非本人代购，价格明显高于专柜', reporter: 'u_chen', status: 'pending', createdAt: iso(-0.2, 14, 0) }
      ]
    };
  }

  /* ---------------- 持久化 ---------------- */
  function safeStorage() {
    try { window.localStorage.setItem('vega.__t', '1'); window.localStorage.removeItem('vega.__t'); return window.localStorage; }
    catch (e) { return null; }
  }
  var LS = safeStorage();
  var mem = {};
  function read(k) { try { return LS ? LS.getItem(k) : mem[k]; } catch (e) { return null; } }
  function write(k, v) { try { if (LS) LS.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } }

  V.db = null;
  V.session = null;

  /* 老数据迁移：把历史校区名称统一为 SIP / TC（幂等，可重复执行）
     注意：校区选项来自 db.settings.campuses，如果浏览器里存过旧数据，
     光改 DEFAULT_SETTINGS 是没用的——必须在这里把设置本身也纠正过来。 */
  function migrateCampuses(db) {
    var changed = 0;
    (db.users || []).forEach(function (u) {
      if (V.LEGACY_CAMPUS[u.campus]) { u.campus = V.LEGACY_CAMPUS[u.campus]; changed++; }
    });
    (db.pinpin || []).forEach(function (p) {
      if (V.LEGACY_CAMPUS[p.campus]) { p.campus = V.LEGACY_CAMPUS[p.campus]; changed++; }
    });
    var canonical = DEFAULT_SETTINGS.campuses;   // ['SIP', 'TC']
    var cur = (db.settings || {}).campuses;
    if (!Array.isArray(cur) || cur.length !== canonical.length || canonical.some(function (c) { return cur.indexOf(c) < 0; })) {
      db.settings = db.settings || {};
      db.settings.campuses = canonical.slice();
      changed++;
    }
    /* 品牌更名：历史数据里的平台名仍是旧品牌，统一迁移到 PinDa */
    if (db.settings && typeof db.settings.platformName === 'string' && db.settings.platformName.indexOf('PinDa') < 0) {
      db.settings.platformName = DEFAULT_SETTINGS.platformName;
      changed++;
    }
    return changed;
  }

  V.load = function () {
    var migrated = false;
    var raw = read(DB_KEY);
    if (raw) {
      try { V.db = JSON.parse(raw); } catch (e) { V.db = null; }
    }
    if (!V.db || !V.db.users || !V.db.users.length) {
      V.db = seed();
      V.save();
    }
    // 兼容老数据：补齐字段
    for (var k in DEFAULT_SETTINGS) if (V.db.settings[k] === undefined) V.db.settings[k] = DEFAULT_SETTINGS[k];
    if (!V.db.wallet) V.db.wallet = [];
    if (!V.db.reports) V.db.reports = [];
    if (!V.db.membershipOrders) V.db.membershipOrders = [];
    if (!V.db.merchants) V.db.merchants = [];
    if (!V.db.coupons) V.db.coupons = [];
    if (!V.db.couponClaims) V.db.couponClaims = [];
    if (migrateCampuses(V.db)) migrated = true;

    var sid = read(SESSION_KEY);
    V.session = sid ? { userId: sid } : null;
    if (V.session && !V.user(V.session.userId)) V.session = null;
    if (migrated) V.save();
    return V.db;
  };

  V.save = function () { write(DB_KEY, JSON.stringify(V.db)); };
  V.reset = function () { V.db = seed(); V.save(); V.session = null; write(SESSION_KEY, ''); };

  V.login = function (userId) { V.session = { userId: userId }; write(SESSION_KEY, userId); };
  V.logout = function () { V.session = null; write(SESSION_KEY, ''); };
  V.me = function () { return V.session ? V.user(V.session.userId) : null; };
  V.user = function (id) {
    var list = V.db.users;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  V.userByPhone = function (phone) {
    var list = V.db.users;
    for (var i = 0; i < list.length; i++) if (list[i].phone === phone) return list[i];
    return null;
  };
  V.s = function () { return V.db.settings; };

  /* ---------------- 会员与佣金 ---------------- */
  V.isPro = function (u) {
    if (!u) return false;
    if (!u.isMember) return false;
    if (u.memberExpire && new Date(u.memberExpire) < new Date()) return false;
    return true;
  };
  V.memberDaysLeft = function (u) {
    if (!V.isPro(u) || !u.memberExpire) return 0;
    return Math.max(0, Math.ceil((new Date(u.memberExpire) - new Date()) / 86400000));
  };
  V.rateFor = function (u) {
    return V.isPro(u) ? V.s().commissionPro : V.s().commissionFree;
  };
  /* 兼容旧调用：quoteFee(user, amount[, context]) */
  V.quoteFee = function (user, amount, context) {
    return V.feeFor(context || 'daidai', user, amount);
  };

  V.activateMembership = function (u, plan) {
    var s = V.s();
    var months = plan === 'term' ? s.termMonths : 1;
    var amount = plan === 'term' ? s.priceTerm : s.priceMonthly;
    var now = new Date();
    var base = (u.memberExpire && new Date(u.memberExpire) > now) ? new Date(u.memberExpire) : now;
    base.setMonth(base.getMonth() + months);
    u.isMember = true;
    u.memberExpire = base.toISOString();
    V.db.membershipOrders.push({
      id: uid('mo'), userId: u.id, plan: plan, months: months, amount: amount,
      createdAt: new Date().toISOString(), method: '微信支付'
    });
    V.db.wallet.push({
      id: uid('w'), userId: u.id, type: 'expense', amount: -amount,
      note: plan === 'term' ? '开通 PinDa 学期会员' : '开通 PinDa 月度会员', createdAt: new Date().toISOString()
    });
    return { months: months, amount: amount };
  };

  /* ---------------- 每日额度 ---------------- */
  V.dailyPostLimit = function (u) { return V.isPro(u) ? V.s().dailyPostPro : V.s().dailyPostFree; };
  V.contactLimit = function (u) { return V.isPro(u) ? Infinity : V.s().contactFreeDaily; };
  V.syncToday = function (u) {
    var today = dayKey();
    if (u.quotaDate !== today) { u.quotaDate = today; u.postCount = 0; u.contactCount = 0; }
  };
  V.postsLeft = function (u) { V.syncToday(u); return Math.max(0, V.dailyPostLimit(u) - (u.postCount || 0)); };
  V.contactsLeft = function (u) {
    V.syncToday(u);
    var limit = V.contactLimit(u);
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - (u.contactCount || 0));
  };
  V.bumpPost = function (u) { V.syncToday(u); u.postCount = (u.postCount || 0) + 1; };
  V.bumpContact = function (u) { V.syncToday(u); u.contactCount = (u.contactCount || 0) + 1; };

  /* ---------------- 通用写入工具 ---------------- */
  V.notify = function (userId, title, body, link) {
    V.db.messages.unshift({
      id: uid('m'), userId: userId, title: title, body: body, read: false,
      createdAt: new Date().toISOString(), link: link || ''
    });
  };
  V.unreadCount = function (userId) {
    var n = 0;
    for (var i = 0; i < V.db.messages.length; i++) if (V.db.messages[i].userId === userId && !V.db.messages[i].read) n++;
    return n;
  };
  V.walletPush = function (userId, type, amount, note, orderId) {
    V.db.wallet.unshift({
      id: uid('w'), userId: userId, type: type, amount: round2(amount), note: note,
      createdAt: new Date().toISOString(), orderId: orderId || null
    });
  };
  V.balanceOf = function (u) { return round2(u.balance || 0); };
  V.addBalance = function (u, delta) { u.balance = round2((u.balance || 0) + delta); };

  /* ---------------- 成员/列表工具 ---------------- */
  V.pinpin = function () { return V.db.pinpin; };
  V.daidai = function () { return V.db.daidai; };
  V.findPinpin = function (id) { return V.db.pinpin.filter(function (p) { return p.id === id; })[0] || null; };
  V.findDaidai = function (id) { return V.db.daidai.filter(function (p) { return p.id === id; })[0] || null; };
  V.findPost = function (refType, id) { return refType === 'pinpin' ? V.findPinpin(id) : V.findDaidai(id); };
  V.ordersOf = function (userId) {
    return V.db.orders.filter(function (o) { return o.buyerId === userId || o.sellerId === userId; });
  };
  V.platformStats = function () {
    var completed = V.db.orders.filter(function (o) { return o.status === 'completed'; });
    var gmv = completed.reduce(function (a, o) { return a + o.amount; }, 0);
    var commission = completed.reduce(function (a, o) { return a + o.commission; }, 0);
    var memberRevenue = V.db.membershipOrders.reduce(function (a, o) { return a + o.amount; }, 0);
    var buyers = {};
    V.db.orders.forEach(function (o) { buyers[o.buyerId] = (buyers[o.buyerId] || 0) + 1; });
    var buyerIds = Object.keys(buyers);
    var repeat = buyerIds.filter(function (id) { return buyers[id] >= 2; }).length;
    var merchantRevenue = V.db.merchants.filter(function (m) { return m.active; })
      .reduce(function (a, m) { return a + (m.monthlyFee || 0); }, 0);
    var claims = V.db.couponClaims || [];
    return {
      users: V.db.users.length,
      members: V.db.users.filter(function (u) { return V.isPro(u); }).length,
      posts: V.db.pinpin.length + V.db.daidai.length,
      orders: V.db.orders.length,
      completed: completed.length,
      gmv: round2(gmv),
      commission: round2(commission),
      memberRevenue: round2(memberRevenue),
      merchantRevenue: round2(merchantRevenue),
      // 阶段一的三个关键验证指标
      orderRate: V.db.orders.length ? Math.round((completed.length / V.db.orders.length) * 100) : 0,
      repeatRate: buyerIds.length ? Math.round((repeat / buyerIds.length) * 100) : 0,
      avgOrder: completed.length ? round2(gmv / completed.length) : 0,
      couponClaimed: claims.length,
      couponUsed: claims.filter(function (c) { return c.usedAt; }).length,
      couponUsedAmount: round2(V.db.couponClaims.filter(function (c) { return c.usedAt; }).length * 18)
    };
  };
  V.couponById = function (id) { return V.db.coupons.filter(function (c) { return c.id === id; })[0] || null; };
  V.merchantById = function (id) { return V.db.merchants.filter(function (m) { return m.id === id; })[0] || null; };
  V.myCoupon = function (userId, couponId) {
    return V.db.couponClaims.filter(function (c) { return c.userId === userId && c.couponId === couponId; })[0] || null;
  };
  V.couponCode = function () {
    var s = '';
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (var i = 0; i < 8; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'VG' + s;
  };

  /* ---------------- 邮箱验证码接口层 ----------------
     - 通过本地服务器运行时（node server.js）：验证码由服务端生成、发到真实邮箱、并由服务端校验
     - 直接双击 index.html 或未启动服务器时：自动退回本地演示模式，验证码显示在页面上
     - 浏览器端永远拿不到邮箱账号与授权码，SMTP 凭据只存在服务端 config.json 里 */
  V.api = {
    available: false,     // 后端是否可用
    mail: false,          // 后端是否已配置 SMTP（能真实发信）
    demoMode: true,
    domains: ['*.edu.cn', '*.edu'],
    ttlMinutes: 10,
    resendSeconds: 60,
    lastError: null,

    probe: function () {
      if (typeof fetch !== 'function') return Promise.resolve(V.api);
      return fetch('/api/status', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.ok) {
            V.api.available = true;
            V.api.mail = !!d.mail;
            V.api.demoMode = !d.mail;
            V.api.domains = d.domains || V.api.domains;
            V.api.ttlMinutes = d.ttlMinutes || 10;
            V.api.resendSeconds = d.resendSeconds || 60;
          }
          return V.api;
        })
        .catch(function () { return V.api; });
    },

    /* 发送验证码：优先走后端真实发信，失败或没有后端时退回本地演示 */
    sendCode: function (email) {
      var key = String(email || '').trim().toLowerCase();
      if (V.api.available && typeof fetch === 'function') {
        return fetch('/api/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: key })
        }).then(function (r) { return r.json(); })
          .catch(function () { return null; })
          .then(function (d) {
            if (d && typeof d.ok === 'boolean') return d;
            return V.api.localSend(key, '接口不可用，已切换为演示模式');
          });
      }
      return Promise.resolve(V.api.localSend(key, null));
    },

    /* 校验验证码：后端可用时由服务端判定，前端拿不到也不能绕过 */
    verifyCode: function (email, code) {
      var key = String(email || '').trim().toLowerCase();
      if (V.api.available && typeof fetch === 'function') {
        return fetch('/api/verify-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: key, code: String(code || '').trim() })
        }).then(function (r) { return r.json(); })
          .catch(function () { return null; })
          .then(function (d) {
            if (d && typeof d.ok === 'boolean') return d;
            return V.api.localVerify(key, code);
          });
      }
      return Promise.resolve(V.api.localVerify(key, code));
    },

    localSend: function (email, note) {
      var code = V.sendCode(email);
      return {
        ok: true, delivered: false, demoCode: code, local: true, notice: note,
        ttlMinutes: V.api.ttlMinutes, resendSeconds: V.api.resendSeconds
      };
    },
    localVerify: function (email, code) {
      var r = V.checkCode(email, code);
      if (r === 'ok') return { ok: true, local: true };
      return {
        ok: false, local: true,
        error: r === 'wrong' ? '验证码不正确' : r === 'expired' ? '验证码已过期，请重新发送' : '请先点击「发送验证码」'
      };
    }
  };
  V.commissionTrend = function (days) {
    days = days || 7;
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      var end = new Date(d); end.setDate(end.getDate() + 1);
      var sum = 0;
      V.db.orders.forEach(function (o) {
        var at = new Date(o.finishedAt || o.createdAt);
        if (o.status === 'completed' && at >= d && at < end) sum += o.commission;
      });
      out.push({ label: (d.getMonth() + 1) + '/' + d.getDate(), value: round2(sum) });
    }
    return out;
  };
  V.TYPE_LABEL = { carpool: '拼车出行', groupbuy: '拼单购物', partner: '找搭子', collab: '合作机会' };
  V.DD_CATS = ['出国代购', '超市代取', '校园代办', '跑腿带饭', '灵活定制'];
  V.CAT_LABEL = { '出国代购': '✈️', '超市代取': '🛒', '校园代办': '🎒', '跑腿带饭': '🍱', '灵活定制': '🧩' };
  V.CAT_DESC = {
    '出国代购': '海外好物 · 轻松带回',
    '超市代取': '生活用品 · 快速送达',
    '校园代办': '排队 / 取件 / 跑腿服务',
    '跑腿带饭': '食堂带饭 · 外卖代取',
    '灵活定制': '定制服务 · 随时响应'
  };

  /* ---------------- 学生身份认证 ----------------
     安全说明：PinDa 不接、也不要西浦 e-Bridge 的账号密码。
     身份核验采用「学号 + 西浦邮箱验证码」，平台只拿到学号与邮箱；
     未来若获得学校授权，可把 verifyStudent 替换为官方 OIDC / SSO 回调。 */
  /* 跨校园：接受各高校校园邮箱（.edu.cn / .edu）；如需限制，只改这里即可 */
  V.SCHOOL_DOMAINS = ['edu.cn', 'edu'];
  V.EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  V.codes = {}; // 验证码只保存在内存中，不落盘

  V.isSchoolEmail = function (email) {
    var e = String(email || '').trim().toLowerCase();
    if (!V.EMAIL_RE.test(e)) return false;
    var domain = e.split('@')[1];
    return V.SCHOOL_DOMAINS.some(function (suffix) {
      return domain === suffix || domain.slice(-(suffix.length + 1)) === '.' + suffix;
    });
  };
  V.studentIdValid = function (sid) {
    return /^\d{6,12}$/.test(String(sid || '').trim());
  };
  V.maskEmail = function (email) {
    var e = String(email || '');
    var parts = e.split('@');
    if (parts.length !== 2) return e;
    var name = parts[0];
    var head = name.slice(0, Math.min(3, name.length));
    return head + '***@' + parts[1];
  };
  // 真实环境由后端随机生成并通过邮件发送；演示环境在界面上直接给出
  V.sendCode = function (email) {
    var key = String(email || '').trim().toLowerCase();
    var code = String(Math.floor(Math.random() * 900000) + 100000);
    V.codes[key] = { code: code, exp: Date.now() + 10 * 60 * 1000 };
    return code;
  };
  V.checkCode = function (email, code) {
    var key = String(email || '').trim().toLowerCase();
    var rec = V.codes[key];
    if (!rec) return 'empty';
    if (Date.now() > rec.exp) return 'expired';
    if (String(code || '').trim() !== rec.code) return 'wrong';
    delete V.codes[key];
    return 'ok';
  };
  V.userByStudentId = function (sid) {
    var id = String(sid || '').trim();
    var list = V.db.users;
    for (var i = 0; i < list.length; i++) if (list[i].studentId === id) return list[i];
    return null;
  };
  V.emailTaken = function (email) {
    var e = String(email || '').trim().toLowerCase();
    return V.db.users.some(function (u) { return (u.schoolEmail || '').toLowerCase() === e; });
  };
  V.verifyStudent = function (u, sid, email) {
    u.studentId = String(sid).trim();
    u.schoolEmail = String(email).trim().toLowerCase();
    u.verified = true;
    u.verifiedBy = 'email';
    u.verifiedAt = new Date().toISOString();
  };
})();
