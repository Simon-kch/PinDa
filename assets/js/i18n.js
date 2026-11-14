/* ==========================================================================
   PinDa 双语（中文 / English）
   · 中文是模板的源语言；切到英文时，渲染完成后按「整段文本」精确替换
   · 覆盖导航、按钮、表单、状态、提示、落地页文案等界面文本
   · 用户发布的内容（拼车/代购帖子、昵称、简介）保持原文，不做机器翻译
   · 语言选择保存在 localStorage，按钮位于右上角
   ========================================================================== */
(function () {
  var V = (window.Vega = window.Vega || {});
  var KEY = 'pinda.lang';

  /* ---------- 中文 → English ---------- */
  var DICT = {
    /* 品牌与导航 */
    '连接西浦，让校园生活更简单': 'Connecting campuses, making campus life simpler',
    '连接校园，让校园生活更简单': 'Connecting campuses, making campus life simpler',
    '拼拼': 'PinPin', '代代': 'DaiDai', '会员': 'Membership', '规则': 'Guidelines',
    '优惠': 'Deals', '订单': 'Orders', '钱包': 'Wallet', '消息': 'Messages', '个人中心': 'Profile',
    '工作台': 'Dashboard', '管理台': 'Admin', '退出': 'Sign out', '登录': 'Sign in',
    '免费注册': 'Sign up free', '加入 PinDa': 'Join PinDa', '进入平台': 'Open platform',
    '用演示账号体验': 'Try a demo account', '演示账号': 'Demo accounts', '普通用户': 'Standard',
    '会员用户': 'Member', '管理员': 'Admin', '密码': 'Password', '手机号': 'Phone number',
    '学号': 'Student ID', '校园邮箱': 'Campus email', '校区': 'Campus', '专业': 'Major',
    '年级': 'Year', '昵称': 'Display name', '注册': 'Sign up', '发送验证码': 'Send code',
    '邮箱验证码': 'Email code', '验证码': 'Verification code', '记住登录状态': 'Keep me signed in',
    '忘记密码？': 'Forgot password?', '还没有账号？': 'No account yet?', '已有账号？': 'Already registered?',
    '直接登录': 'Sign in',
    '为什么？': 'Why?', '为什么不用学校账号直接登录？': 'Why not sign in with your school account?',
    '我了解了': 'Got it', '取消': 'Cancel', '确定': 'Confirm', '关闭': 'Close', '返回': 'Back',
    '重试': 'Retry', '保存': 'Save', '删除': 'Delete', '提交': 'Submit', '查看': 'View',
    '查看全部 →': 'View all →', '全部': 'All', '搜索': 'Search', '发布': 'Post',
    '立即支付': 'Pay now', '确认支付': 'Confirm payment', '立即发布': 'Publish now',
    '确认发布': 'Publish', '确认': 'Confirm', '退出登录': 'Sign out', '保存资料': 'Save profile',

    /* 落地页 */
    'PinDa': 'PinDa',
    '一个面向跨校园师生用户的互助平台': 'A mutual-aid platform for students and staff across campuses',
    '一个面向跨校园师生用户的互助平台：拼车、拼单、找搭子，代购、代取、代办——让每一次需求，都能找到合适的人。': 'A mutual-aid platform for students and staff across campuses — carpooling, group buying, study partners, shopping and errands. Every need finds the right person.',
    '拼车、拼单、找搭子': 'Carpooling · Group buying · Partners',
    '代购、代取、代办': 'Shopping · Pickups · Errands',
    '让每一次需求，都能找到合适的人': 'Every need finds the right person',
    '两大板块，一站式校园互助': 'Two pillars, one campus mutual-aid platform',
    '拼拼负责聚集用户和创造交易机会，代代负责提供更直接的服务收入。': 'PinPin brings people together and creates deals; DaiDai delivers direct service income.',
    '拼拼 PINPIN': 'PinPin', '代代 DAIDAI': 'DaiDai',
    '一起出发 · 一起省钱 · 一起成长': 'Go together · Save together · Grow together',
    '你的需求 · 我来帮你': 'Your need · My help',
    '拼车出行': 'Carpooling', '拼单购物': 'Group buying', '找搭子': 'Find partners', '合作机会': 'Collaboration',
    '上下课 / 机场<br>/ 周边游': 'Class / airport<br>/ trips',
    '团购 / 省钱<br>更划算': 'Bulk buys<br>/ better prices',
    '学习 / 运动<br>/ 生活': 'Study / sports<br>/ life',
    '项目 / 资源<br>/ 互助': 'Projects / resources<br>/ mutual aid',
    '出国代购': 'Overseas shopping', '超市代取': 'Grocery pickup', '校园代办': 'Campus errands',
    '更多需求': 'More services',
    '海外好物<br>轻松带回': 'Bring back<br>good finds',
    '生活用品<br>快速送达': 'Daily goods<br>delivered fast',
    '排队 / 取件<br>/ 跑腿服务': 'Queueing / pickup<br>/ delivery',
    '定制服务<br>随时响应': 'Custom services<br>on demand',
    '一个人走得快，<br>一群人走得更远！': 'One goes fast,<br>a group goes further!',
    '你有需求，<br>我来帮忙！': 'You need it,<br>I can help!',
    '我们发现的问题': 'Problems we found', '我们的解决方案': 'Our solution', '我们的核心优势': 'Our advantages',
    '校园生活中，出行、购物、学习等需求常常难以找到合适的人': 'Campus needs — travel, shopping, study — are hard to match with the right people',
    '代购、代取、代办等需求分散，缺乏安全可靠的平台': 'Shopping, pickup and errand requests are scattered, with no trusted platform',
    '学生的时间和资源没有得到充分利用': 'Students’ time and resources go underused',
    '太仓与园区双校区班车不够充足，顺风车价格高又不放心': 'Shuttle services between campuses are limited; informal rides are pricey and risky',
    '搭建一站式互助平台': 'Build one-stop mutual aid', '精准匹配需求与资源': 'Match needs with resources precisely',
    '保障交易安全与信任': 'Make deals safe and trustworthy',
    '让学生的时间与能力创造更多价值': 'Turn students’ time and skills into value',
    '精准定位跨校园师生群体': 'Built for cross-campus students and staff',
    '贴近校园场景，更懂你的需求': 'Close to real campus life',
    '多元化服务场景': 'Diverse service scenarios',
    '覆盖学习、生活、出行、消费等': 'Study, life, travel and spending',
    '安全可靠的交易机制': 'Safe, reliable transactions',
    '真实身份认证 + 评价体系': 'Verified identity + reviews',
    '双向价值创造': 'Two-way value',
    '用户需求 + 学生资源 = 共赢': 'User needs + student resources = win-win',
    '免费能用，会员更顺': 'Free to use, smoother with membership',
    '普通注册': 'Standard signup', '普通注册（免费）': 'Standard (free)',
    'PinDa 会员': 'PinDa Member', '学期卡': 'Semester pass', '月卡': 'Monthly pass',
    '推荐 · 学期卡更省': 'Recommended · best value',
    '三步就能用起来': 'Three steps to get started', '注册并认证': 'Sign up & verify',
    '发布或接单': 'Post or accept', '成交后自动结算': 'Automatic settlement',
    '项目愿景': 'Our vision',
    '成为跨校园师生首选的互助平台，让互助连接更多可能': 'Become the first-choice mutual-aid platform for students and staff across campuses',
    '更高效的校园生活': 'More efficient campus life', '更紧密的社交圈子': 'Closer social circles',
    '更温暖的社区氛围': 'A warmer community', '更广阔的未来可能': 'Broader possibilities',
    '扫码加入': 'Scan to join', '团队二维码位<br>（替换为加入码）': 'QR code<br>(replace with joining code)',
    '扫码加入 PinDa · 一起创造更多可能': 'Scan to join PinDa · create more together',
    '真实星图 · 众星绕北极星旋转（北斗指北）': 'Real star map · stars turn around Polaris',

    /* 列表与筛选 */
    '搜索：机场、山姆、图书馆、羽毛球…': 'Search: airport, Sam’s Club, library, badminton…',
    '搜索：日本、山姆、菜鸟驿站、香水…': 'Search: Japan, Sam’s Club, parcel locker, perfume…',
    '全部校区 / 区域': 'All campuses / areas', '只看会员发布': 'Members only', '我的拼拼': 'My PinPin',
    '我的代代': 'My DaiDai', '只看会员': 'Members only', '全部分类': 'All categories',
    '需要代购 / 代取': 'Requests', '可以帮带': 'Available to help',
    '点击卡片查看详情': 'Tap a card for details', '会员信息优先展示': 'Member posts shown first',
    '没有匹配的拼拼信息，换个筛选条件或自己发一条': 'No matching posts — try another filter or post your own',
    '这里还没有信息，试试切换分类或发布一条': 'Nothing here yet — switch category or post one',
    '发布信息': 'Post', '发起拼拼': 'Start a PinPin', '发布代购需求': 'Post a request',
    '我要接单（挂行程）': 'Offer to help (post a trip)',

    /* 卡片标签 */
    '出发': 'Depart', '路线': 'Route', '进度': 'Filled', '店铺': 'Store', '截止': 'Closes',
    '需要从': 'From', '送到': 'To', '期望时间': 'Expected', '预算': 'Budget', '名额': 'Spots',
    '目标': 'Goal', '合作方向': 'Focus', '信用': 'Credit', '代购费': 'Fee',
    '可代购行程': 'Available to help', '代购需求': 'Request', '可拼': 'Open', '已满员': 'Full',
    '已结束': 'Ended', '已关闭': 'Closed', '待接单': 'Open', '已接单': 'Accepted',
    '进行中': 'In progress', '已送达': 'Delivered', '已完成': 'Completed', '已取消': 'Cancelled',
    '待支付': 'Unpaid', '待确认': 'Awaiting confirmation', '我付款': 'I pay', '我收款': 'I earn',
    '我发布的': 'Mine', '会员优先': 'Member first', '已加曝光': 'Boosted',

    /* 详情与表单 */
    '拼拼详情': 'PinPin details', '代代详情': 'DaiDai details', '订单详情': 'Order details',
    '已加入成员': 'Members', '发起人': 'Organiser', '联系方式': 'Contact', '收藏': 'Save',
    '申请加入': 'Request to join', '退出拼拼': 'Leave', '停止招募': 'Stop recruiting',
    '成团并结算': 'Confirm & settle', '确认结束': 'Finish', '分享行程': 'Share trip',
    '加曝光': 'Boost', '查看发起人联系方式': 'View organiser contact',
    '我要代购（下单）': 'Order this', '我接这一单': 'Accept this request', '先问一句': 'Ask first',
    '类型': 'Type', '标题': 'Title', '详细说明': 'Details', '联系方式（成团后对方可见）': 'Contact (visible to members)',
    '标签（逗号分隔）': 'Tags (comma separated)', '人均费用（元）': 'Price per person (¥)',
    '可坐人数（含发起人）': 'Seats (incl. organiser)', '出发地': 'From', '目的地': 'To',
    '出发时间': 'Departure time', '车型 / 备注': 'Car / notes', '店铺 / 平台': 'Store / platform',
    '成团人数': 'Group size', '预估人均（元）': 'Est. per person (¥)', '搭子目标': 'Partner goal',
    '需要几人（含发起人）': 'People needed (incl. you)', '费用（元，0 表示免费）': 'Fee (¥, 0 = free)',
    '常用线路（点一下自动填入）：': 'Popular routes (tap to fill):',
    '代购费 *': 'Service fee *', '分类 *': 'Category *', '送到哪里': 'Deliver to',
    '期望到手时间': 'Expected by', '预算金额（元）': 'Budget (¥)', '可接单名额': 'Spots',
    '今天': 'Today', '明天': 'Tomorrow',

    /* 订单 / 钱包 */
    '我的订单': 'My orders', '进行中订单': 'Active orders', '累计收入': 'Total income',
    '累计支出': 'Total spent', '累计被抽佣金': 'Platform fees paid', '可用余额': 'Available balance',
    '流水明细': 'Transactions', '模拟充值': 'Top up (demo)', '提现': 'Withdraw',
    '充值': 'Top up', '收入': 'Income', '支出': 'Expense', '佣金明细': 'Fee breakdown',
    '成交金额': 'Order amount', '平台费用': 'Platform fee', '收款方到手': 'Seller receives',
    '付款方应付': 'Buyer pays', '状态流转': 'Timeline', '操作日志': 'Activity',
    '取消订单': 'Cancel order', '申请客服介入': 'Request support', '评价': 'Review',
    '确认完成并结算': 'Confirm & settle', '标记已交付': 'Mark delivered', '确认已收到': 'Confirm received',
    '更新进度': 'Update progress', '我是付款方': 'As buyer', '我是收款方': 'As seller',
    '全部角色': 'All roles', '暂无订单，去拼拼或代代看看有什么可以参与': 'No orders yet — explore PinPin or DaiDai',
    '钱包与流水': 'Wallet & transactions', '佣金怎么算': 'How fees work', '提现说明': 'Withdrawal notes',

    /* 会员中心 */
    'PinDa 会员中心': 'PinDa Membership', '当前成交佣金费率': 'Your current fee rate',
    '权益对比': 'Benefits comparison', '算一算：会员能省多少': 'Calculate your savings',
    '会员专属权益细则': 'Membership benefits', '开通': 'Activate', '续费': 'Renew',
    '普通用户佣金': 'Standard fee', '会员佣金': 'Member fee', '会员净省': 'Member savings',
    '信息优先展示': 'Priority placement', '高级筛选与优先查询': 'Advanced filters',
    '查看联系方式不限次': 'Unlimited contact views', '成交佣金折扣': 'Lower commission',
    '发布额度提升': 'More posts per day', '新需求优先接单': 'First access to requests',
    '会员专属标识': 'Member badge', '专属客服与纠纷协助': 'Priority support',

    /* 消息 / 个人中心 / 通知 */
    '消息中心': 'Messages', '全部标为已读': 'Mark all read', '未读': 'Unread', '已读': 'Read',
    '个人资料': 'Profile', '学生认证': 'Verification', '去认证': 'Verify now', '更新认证信息': 'Update verification',
    '已认证': 'Verified', '未认证': 'Not verified', '我的发布': 'My posts', '我的收藏': 'Saved',
    '账号与数据': 'Account & data', '重置演示数据': 'Reset demo data', '修改密码': 'Change password',
    '我的钱包余额': 'Wallet balance', '最新通知': 'Notifications', '快捷入口': 'Shortcuts',
    '校园优惠': 'Campus deals', '领取优惠券': 'Get coupon', '我的优惠券': 'My coupons',
    '模拟到店核销': 'Redeem (demo)', '合作商家': 'Partner merchants',

    /* 管理台 */
    '数据概览': 'Overview', '商业化': 'Business model', '商家与推广': 'Merchants & promotion',
    '用户与会员': 'Users & members', '内容与举报': 'Content & reports', '平台设置': 'Settings',
    '注册用户': 'Registered users', '累计佣金抽成': 'Commission revenue', '会员费收入': 'Membership revenue',
    '平台总收入': 'Total revenue', '在架信息': 'Live posts', '订单总数': 'Total orders',
    '待处理举报': 'Pending reports', '近 7 日佣金收入': 'Commission · last 7 days',
    '用户结构': 'User mix', '最近订单': 'Recent orders', '会员费收入明细': 'Membership payments',
    '运营阶段切换': 'Operating stage', '六个潜在收入来源': 'Six revenue streams',
    '当前收入结构': 'Revenue mix', '商家入驻与推广套餐': 'Merchant plans',
    '优惠券与核销追踪': 'Coupons & redemption', '保存平台设置': 'Save settings',
    '新增商家': 'Add merchant', '新增优惠券': 'Add coupon', '暂停推广': 'Pause', '恢复推广': 'Resume',
    '上架': 'Publish', '下架': 'Unpublish', '阶段切换': 'Switch stage', '当前阶段': 'Current stage',
    '全站每日发信上限': 'Daily email cap', '用户复购率': 'Repeat rate', '订单完成率': 'Completion rate',

    /* 规则页 */
    '平台规则与交易须知': 'Platform rules', '佣金与费用': 'Fees', '禁止事项': 'Prohibited items',
    '交易流程': 'How deals work', '纠纷处理': 'Disputes', '账号与身份认证': 'Accounts & verification',
    '出行安全与代办责任边界': 'Travel safety & responsibilities', '发布与联系额度': 'Posting & contact limits',
    '意见反馈': 'Feedback',

    /* 提示语 */
    '请先登录': 'Please sign in first', '已退出登录': 'Signed out', '发布成功': 'Posted',
    '已删除': 'Deleted', '已更新进度': 'Progress updated', '订单已取消': 'Order cancelled',
    '已加入收藏': 'Saved', '已取消收藏': 'Removed from saved', '认证成功，已获得「已认证」标识': 'Verified successfully',
    '请填写标题': 'Please add a title', '请填写详细说明，信息完整的帖子成交更快': 'Please add details',
    '请先点击「发送验证码」': 'Tap “Send code” first', '验证码不正确': 'Incorrect code',
    '验证码已过期，请重新发送': 'Code expired — please resend', '该邮箱已被注册': 'Email already registered',
    '该手机号已注册，请直接登录': 'Phone already registered — please sign in',
    '密码至少 6 位': 'Password must be at least 6 characters', '请填写你的专业名称': 'Please enter your major',
    '今日发布额度已用完，开通会员可提升到 20 条': 'Daily post limit reached — membership raises it to 20',
    '最低提现 ¥10': 'Minimum withdrawal ¥10', '余额不足': 'Insufficient balance',
    '已复制': 'Copied', '已生成验证码': 'Code generated', '演示模式：验证码已生成': 'Demo mode: code generated',
    '优惠券领取成功': 'Coupon claimed', '该邮箱今日发送次数已达上限，请明天再试': 'Daily email limit reached — try tomorrow',
    '请求过于频繁，请稍后再试': 'Too many requests — try again later',

    /* 状态与单位 */
    '免费': 'Free', '新发布': 'New', '刚刚': 'just now', '天': 'days', '人': 'people',
    '元': 'CNY', '积分': 'pts', '信用分': 'Credit score', '好评': 'Rating',
    '收起': 'Collapse', '展开': 'Expand', '筛选': 'Filter', '排序': 'Sort',
    '普通': 'Standard', '会员优先展示': 'Member priority', '会员费率': 'Member rate',
    '启动期免费撮合': 'Free during launch', '本单免费': 'Free for this order',
    '全额到账': 'Full amount', '已结算': 'Settled', '未支付': 'Unpaid', '已支付': 'Paid',

    /* 被标签拆开的片段（DOM 逐节点翻译时需要） */
    '连接校园，': 'Connecting campuses,',
    '让校园生活更简单': 'making campus life simpler',
    '注册同学': 'Members', '在架互助信息': 'Live posts', '已完成交易': 'Completed deals',
    '合作校园商家': 'Partner merchants', '今日校园互助': 'Today on PinDa',
    '上下课 / 机场': 'Classes / airport', '/ 周边游': '/ day trips',
    '团购 / 省钱': 'Bulk buys / save', '更划算': 'better value',
    '学习 / 运动': 'Study / sports', '/ 生活': '/ life',
    '项目 / 资源': 'Projects / resources', '/ 互助': '/ mutual aid',
    '一个人走得快，': 'One goes fast,', '一群人走得更远！': 'a group goes further!',
    '海外好物': 'Overseas finds', '轻松带回': 'brought back easily',
    '生活用品': 'Daily goods', '快速送达': 'delivered fast',
    '排队 / 取件': 'Queues / pickups', '/ 跑腿服务': '/ errands',
    '定制服务': 'Custom services', '随时响应': 'on demand',
    '你有需求，': 'You need it,', '我来帮忙！': 'I can help!',
    '搭建一站式校园互助平台': 'One-stop campus mutual aid',
    '平台按成交金额抽佣（普通 6%、会员 2%），会员还能拿到展示与撮合上的优先权。': 'We charge a commission on completed deals (6% standard, 2% for members); members also get priority placement and matching.',
    '0 元 · 长期有效': '¥0 · forever', '/ 永久': '/ forever',
    '/ 月 · 学期卡 ¥79（4 个月）': '/ mo · semester pass ¥79 (4 months)',
    '发布 3 条/日，拼拼 + 代代全功能': '3 posts/day, full PinPin + DaiDai access',
    '每日 3 次查看对方联系方式': '3 contact views per day',
    '平台担保式交易记录与评价': 'Recorded deals and reviews',
    '成交佣金 6%': '6% commission', '信息排序靠后，无会员标识': 'Lower ranking, no member badge',
    '面向高频拼车、常帮同学代购的同学': 'For frequent carpoolers and helpers',
    '成交佣金 2%': '2% commission', '（普通用户 6%）': '(6% for standard users)',
    '信息': 'Posts', '优先展示': 'priority placement', '，带「会员优先」标识': ', with a member badge',
    '不限次': 'Unlimited', '查看联系方式，成交更快': 'contact views — close deals faster',
    '普通用户 · 佣金 6%': 'Standard · 6% fee', '第二阶段 · 收入验证': 'Stage 2 · Revenue validation',
    '升级降佣金': 'Upgrade & save', '可提现 / 可支付': 'Withdraw or pay',
    '平台在架信息': 'Live posts', '平台累计佣金': 'Total commission',
    '拼拼 · 推荐给你': 'PinPin · recommended',
    '代代 · 最新需求与行程': 'DaiDai · latest requests & trips',
    '会员优先': 'Member first', '已加曝光': 'Boosted', '新发布': 'New',
    '拼车出行 · 拼单购物 · 找搭子': 'Carpooling · Group buying · Partners',
    '今日额度': 'Today’s quota', '今日发布': 'Posted today',
    '我的钱包余额': 'Wallet balance', '进行中订单': 'Active orders',
    '平台在架信息': 'Live posts', '平台累计佣金': 'Total commission',
    '优惠券领取': 'Coupons claimed', '券核销率': 'Redemption rate',
    '商家月度推广收入': 'Merchant revenue', '订单量': 'Orders',
    '发布需求': 'Post a request', '挂出行程': 'Post a trip',
    '查看订单': 'View order', '查看详情': 'Details', '去认证': 'Verify',
    '全部消息': 'All messages', '全部消息': 'All messages',
    '线路': 'Route', '出发时间': 'Departure', '人数': 'People', '费用': 'Fee',
    '主办': 'Organiser', '发起': 'Start', '更新': 'Update', '删除': 'Delete',
    '语音': 'Voice', '图片': 'Image', '文件': 'File', '链接': 'Link',

    /* 首页首屏示例卡片（营销示例，不是用户内容） */
    '👑 会员优先': '👑 Member first',
    '太仓校区 → 园区南校区 双校区通勤': 'Taicang Campus → SIP Campus commute',
    '周一 07:30 · 3/4 人 · 人均 ¥45': 'Mon 07:30 · 3/4 seats · ¥45 each',
    'BUS107 小组作业 找 2 位队友': 'BUS107 group project — 2 teammates needed',
    '每周三线上碰 · 已 2/3 人': 'Online every Wednesday · 2/3 joined',
    '我在日本，可帮带化妆品/药品': 'In Japan · can bring back cosmetics & medicine',
    '代购费 15% · 剩 7 个名额': '15% fee · 7 spots left',
    '真实星图 · 众星绕北极星旋转（北斗指北）': 'Real star map · the sky turns around Polaris',
    '北斗指北 · 众星绕其旋转': 'Big Dipper points north · the sky turns around Polaris'
    ,
    /* 落地页补充（会员卡 / 步骤 / 页脚） */
    '👑 PinDa 会员': '👑 PinDa Member',
    '注册并开通会员': 'Sign up with membership',
    '高级筛选：按信用分、认证、价格区间查询': 'Advanced filters by credit, verification and price',
    '代代新需求': 'New DaiDai requests', '优先派送': 'first access', '给会员': 'for members',
    '每日发布额度 20 条 + 专属客服': '20 posts/day + priority support',
    '用手机号注册，填写校区与专业。学生认证通过后，主页会显示「已认证」，成交率更高。': 'Sign up with your phone, campus and major. Verified profiles convert better.',
    '在「拼拼」发起拼车/拼单/搭子，或在「代代」发布代购需求、也可把自己即将出行的行程挂上去接单。': 'Start a carpool, group buy or partner post on PinPin, or post a DaiDai request — or list your upcoming trip.',
    '订单完成后平台按费率抽佣，收入实时进入钱包，明细可查，纠纷可申请平台介入。': 'When a deal completes we take our fee, income lands in your wallet instantly, and support can step in if needed.',
    '举个账：一位学期内成交 30 单、流水 ¥3,000 的同学，普通用户佣金约 ¥180，会员佣金约 ¥60，加上会员费 ¥99，会员仍更省。': 'Example: 30 deals and ¥3,000 volume in a term means about ¥180 in fees as a standard user, or ¥60 as a member — still cheaper even with the ¥99 pass.',
    '成为跨校园师生首选的互助平台，让互助连接更多可能。': 'Become the first-choice mutual-aid platform for students and staff across campuses.',
    '已认证': 'Verified', '合作商家': 'Merchants', '在架信息': 'Live posts',
    '人': 'people', '家': 'merchants', '条': 'posts',
    '拼车': 'Carpooling', '拼单': 'Group buying', '超市代购': 'Grocery shopping', '代取代取': 'Pickups',
    '平台': 'Platform', '会员权益': 'Membership benefits', '规则与佣金': 'Rules & fees', '登录 / 注册': 'Sign in / Sign up',
    '连接校园，让校园生活更简单 · MORE CONNECTIONS · MORE POSSIBILITIES': 'Connecting campuses, making campus life simpler · MORE CONNECTIONS · MORE POSSIBILITIES',
    'PinDa 是面向跨校园师生用户的互助平台：拼车、拼单、找搭子，代购、代取、代办——让每一次需求，都能找到合适的人。': 'PinDa is a mutual-aid platform for students and staff across campuses: carpooling, group buying, partners, shopping, pickups and errands — every need finds the right person.',
    '演示项目 · 数据保存在本机浏览器 · 不保存任何学校账号密码': 'Demo · data stays in your browser · we never store school passwords',
    '学生创业演示项目': 'student startup demo',
    '佣金 6% 起 · 会员低至 2%': 'Fees from 6% · members from 2%',
    '平台运营': 'Platform operations', '官方': 'Official', '演示': 'Demo'
    ,
    /* 注册页 */
    '用手机号注册，30 秒完成。也可以直接开通会员，享受更低佣金与优先展示。': 'Sign up with your phone in 30 seconds — or join as a member for lower fees and priority placement.',
    '🔒 注册': '🔒 Signing up', '不需要': 'never needs',
    '学校统一身份密码。用「学号 + 校园邮箱验证码」证明你是在校师生即可获得认证标识。': ' your school password. Verify with your student ID and a campus email code to get the verified badge.',
    '昵称 *': 'Display name *', '密码 *': 'Password *', '手机号 *': 'Phone number *',
    '例如：张同学': 'e.g. Alex Chen', '至少 6 位': 'At least 6 characters', '11 位手机号': '11-digit phone number',
    '用于学生认证与找回账号，可稍后在个人中心补充': 'Used for verification and account recovery; can be added later',
    'SIP = 苏州工业园区校区 · TC = 太仓校区': 'SIP = Suzhou Industrial Park campus · TC = Taicang campus',
    '一句话介绍（让别人更愿意与你交易）': 'Short bio (helps people trust you)',
    '例如：有车，周末往返苏州—上海，可放行李。': 'e.g. I drive between Suzhou and Shanghai on weekends; room for luggage.',
    '选择注册类型': 'Choose a plan', '之后也可随时在「会员中心」升级或续费。': 'You can upgrade or renew anytime in Membership.',
    'PinDa 会员 · 月卡 ¥19.90': 'PinDa Member · Monthly ¥19.90',
    'PinDa 会员 · 学期卡 ¥99（4 个月，约 ¥24.75/月）': 'PinDa Member · Semester ¥99 (4 months, ≈¥24.75/mo)',
    '佣金 6% · 每日 3 条发布 · 每日 3 次查看联系方式': '6% fee · 3 posts/day · 3 contact views/day',
    '佣金 2% · 优先展示与优先接单 · 不限次查看联系方式': '2% fee · priority placement · unlimited contact views',
    '覆盖整个学期，适合固定拼车、长期帮同学代购的同学': 'Covers the whole semester — great for regular carpools and helpers',
    '我已阅读并同意': 'I have read and agree to the',
    '《平台规则与交易须知》': 'Platform Rules',
    '，承诺不发布违禁物品与虚假信息': ', and will not post prohibited items or false information',
    '注册并进入平台': 'Create account & enter',
    '示例专业库来自西浦官网「教学」栏目（共 ': 'Sample catalogue from XJTLU’s official programmes (',
    ' 个）；其它学校的同学可选「其它专业」自行填写。还没确定专业可选「还未选择专业」，之后可在个人中心改。': '). Students from other schools can pick “Other major”. Not decided yet? Choose “Undecided”.',
    '请填写你的专业名称': 'Enter your major',

    /* 工作台 */
    '你好，': 'Hello, ', '平台运营': 'Platform operations',
    '发布拼拼': 'Post on PinPin', '发布代购需求': 'Post a DaiDai request', '挂出行程接单': 'List a trip & help',
    '会员费率 2%': 'Member rate 2%', '今日发布': 'Posted today',
    '查看状态与佣金明细': 'Status and fee breakdown', '收入、支出、提现': 'Income, spending, withdrawal',
    '周边商家优惠券，到店出示核销': 'Campus coupons, redeem in store', '降佣金、优先展示': 'Lower fees, priority placement',
    '用户、内容、佣金统计': 'Users, content and fees', '最新通知': 'Notifications',
    '平台规则': 'Platform rules', '佣金 6% 起': 'Fees from 6%',

    /* 规则页 */
    '最后更新：': 'Last updated: ', '本页为演示文本': 'Demo content',
    '佣金与费用': 'Fees & charges', '收费分三阶段': 'Three-stage pricing',
    '1. 收费分三阶段': '1. Three-stage pricing',
    '2. 当前阶段（第二阶段 · 收入验证）': '2. Current stage (Stage 2 · Revenue validation)',
    '3. 付款方价格不变': '3. Buyers pay the listed price',
    '4. 增值服务': '4. Add-on services', '5. 退款': '5. Refunds',
    '禁止事项': 'Prohibited', '交易流程': 'How deals work', '纠纷处理': 'Disputes',
    '账号与身份认证': 'Accounts & verification', '出行安全与代办责任边界': 'Travel safety & responsibilities',
    '代购烟酒、处方药、管制刀具、活体动物等违禁品': 'Tobacco, alcohol, prescription drugs, weapons, live animals',
    '伪造小票、虚报价格、收钱不发货': 'Fake receipts, false prices, taking money without delivering',
    '私自把联系方式用于骚扰、广告、拉群营销': 'Using contact details for spam or marketing',
    '冒用他人学生身份注册': 'Registering with someone else’s student identity',
    '违规将被扣除信用分、限制发布，严重者封号并公示。': 'Violations lose credit, posting rights — serious cases are banned and published.',
    '拼拼（拼车 / 拼单 / 搭子）': 'PinPin (carpool / group buy / partner)',
    '代代（代购 / 代取）': 'DaiDai (shopping / pickup)',
    '发起人发布，填写时间、地点、人数与人均费用': 'Organiser posts time, place, seats and price',
    '同学申请加入，发起人确认': 'Members request to join; organiser confirms',
    '成团后生成账单，出发/到货后结算': 'Bill generated once full; settled after the trip/delivery',
    '成交后平台按费率抽佣，收入进入钱包': 'Fee applied on completion; income goes to the wallet',
    '需求方发布代购需求，或代购方挂出行程': 'Requesters post needs — or helpers list their trips',
    '接单后生成订单，状态流转留痕': 'Accepting creates an order with a full status trail',
    '商品交付、上传小票、双方确认': 'Goods delivered, receipt uploaded, both sides confirm',
    '平台抽佣，订单完成': 'Fee applied, order complete',
    '订单内点击「申请客服介入」后，平台将在 24 小时内联系双方。涉及金额较大的代购（≥ ¥500）建议先支付 30% 定金并保留小票、物流与聊天记录。会员用户享有优先响应。': 'Tap “Request support” in an order and we contact both sides within 24 hours. For orders over ¥500, pay a 30% deposit and keep receipts, tracking and chat logs. Members get priority.',
    '身份核验方式': 'Verification method',
    '登录密码': 'Sign-in password', '为什么不能一键登录': 'Why no one-click school login',
    '正规的下一步': 'The right next step', '数据存放': 'Data storage',
    '拼车': 'Carpooling', '代购 / 代取 / 代办': 'Shopping / pickup / errands'
    ,
    '第一阶段启动期：拼车、拼单、搭子、代代订单全部免费，重点是先把用户用起来；第二阶段收入验证：代代订单抽佣、拼单收透明小额服务费，拼车与搭子保持免费；第三阶段规模扩张：增加商家推广套餐、社团合作与增值服务。': 'Stage 1 (launch): everything free — build usage first. Stage 2 (revenue validation): commission on DaiDai orders and a small transparent fee on group buys; carpools and partners stay free. Stage 3 (scale): merchant promotion packages, club partnerships and add-ons.',
    '代代代办：抽佣 6%（会员 2%）；拼车出行：免费；拼单购物：¥1/单（会员免收）；合作机会：免费': 'DaiDai: 6% commission (2% for members) · Carpooling: free · Group buying: ¥1/order (free for members) · Collaboration: free',
    '费用由服务提供方承担，付款方看到的报价即为应付金额。': 'Fees are paid by the service provider; buyers pay the listed price.',
    '基础功能免费：发布信息、加入拼拼、接代代订单。选择性付费：信息加曝光 ¥1.90/次、会员订阅 月卡 ¥19.90 / 学期卡 ¥99（4 个月）、校园商家推广套餐 ¥199/月。': 'Core features are free: posting, joining PinPin, accepting DaiDai orders. Optional paid: boosts ¥1.90, membership ¥19.90/mo or ¥99/semester (4 months), merchant plans ¥199/mo.',
    '订单取消时全额退回付款方；已完成订单的手续费不予退还。': 'Cancelled orders are fully refunded; completed orders keep their fee.',
    'PinDa 不会、也不需要你的学校账号密码。任何要求你输入学校统一身份密码的第三方平台都存在钓鱼风险。': 'PinDa never asks for your school account password. Any third-party site requesting it is a phishing risk.',
    '身份核验方式：填写学号 + 校园邮箱（支持 .edu.cn / .edu 域名）验证码，即可获得「已认证」标识。平台只保存学号与校园邮箱。': 'Verification: student ID + campus email code (.edu.cn / .edu). We store only your student ID and campus email.',
    '登录密码：注册 PinDa 时你自己设置的平台密码，与学校密码无关，忘记后可在个人中心修改。': 'Sign-in password: the one you set for PinDa — unrelated to your school password; change it in Profile.',
    '正规的下一步：向你所在学校的 IT / 学生事务申请官方 SSO（OAuth / OIDC）授权。拿到授权后，登录会跳转到学校官方页面，学校只回传学号与邮箱，平台全程接触不到密码。PinDa 已预留该对接位置。': 'Next step: ask your university IT office for official SSO (OAuth / OIDC). Login then happens on the school page and only your ID and email are returned — PinDa never sees a password.',
    '数据存放：本原型的数据保存在你自己的浏览器本地，不上传服务器。': 'Data storage: this prototype keeps data in your browser only.'
    ,
    '你的校园邮箱，如 xxx@xxx.edu.cn': 'Your campus email, e.g. you@school.edu.cn',
    '支持各高校校园邮箱（.edu.cn / .edu）': 'Campus emails only (.edu.cn / .edu)',
    '6 位验证码': '6-digit code',
    '验证码会发送到你的校园邮箱，验证后获得「已认证」标识': 'The code goes to your campus email; verify to get the badge',
    '例如 2024128731': 'e.g. 2024128731',
    '大一': 'Year 1', '大二': 'Year 2', '大三': 'Year 3', '大四': 'Year 4',
    '研一': 'Master 1', '研二': 'Master 2', '已毕业校友': 'Alumni',
    '还未选择专业': 'Undecided', '其它专业（不在列表中）': 'Other major (not listed)',
    '你之前填写的专业': 'Previous major',
    '团队二维码位': 'QR code slot', '（替换为加入码）': '(replace with joining code)'
  };

  /* 组合句式：正则 → 替换（$1 为捕获组） */
  var PATTERNS = [
    [/^(\d+)\s*人$/, '$1 people'],
    [/^(\d+)\/(\d+) 人$/, '$1/$2 joined'],
    [/^剩 (\d+) 天$/, '$1 days left'],
    [/^剩 (\d+) 小时 (\d+) 分$/, '$1h $2m left'],
    [/^已剩 (\d+) 天$/, '$1 days left'],
    [/^今日发布 (\d+)\/(\d+)$/, 'Posted $1/$2 today'],
    [/^共 (\d+) 条$/, '$1 posts'],
    [/^(\d+) 条$/, '$1 posts'],
    [/^(\d+) 单$/, '$1 orders'],
    [/^(\d+) 次$/, '$1 times'],
    [/^(\d+) 天$/, '$1 days'],
    [/^信用 (\d+)$/, 'Credit $1'],
    [/^成交 (\d+) 单$/, '$1 deals'],
    [/^(\d+) 分$/, '$1 pts'],
    [/^(\d+) 天后重发$/, 'Resend in $1d'],
    [/^(\d+) 秒后重发$/, 'Resend in $1s'],
    [/^(\d+) 分钟前$/, '$1 min ago'],
    [/^(\d+) 小时前$/, '$1 h ago'],
    [/^(\d+) 天前$/, '$1 d ago'],
    [/^¥([\d.,]+)\s*\/\s*月$/, '¥$1 /mo'],
    [/^¥([\d.,]+)\s*\/\s*单$/, '¥$1 /order'],
    [/^第(\d+)阶段$/, 'Stage $1'],
    [/^(\d+) 条\/日$/, '$1 posts/day'],
    [/^(\d+) 次\/日$/, '$1 views/day']
    ,
    [/^\/ 月 · 学期卡 ¥([\d.]+)（(\d+) 个月）$/, '/ mo · semester ¥$1 ($2 months)'],
    [/^已认证 (\d+) 人$/, 'Verified: $1'],
    [/^在架信息 (\d+) 条$/, 'Live posts: $1'],
    [/^合作商家 (\d+) 家$/, 'Merchants: $1']
    ,
    [/^示例专业库来自西浦官网「教学」栏目（共 (\d+) 个）；其它学校的同学可选「其它专业」自行填写。还没确定专业可选「还未选择专业」，之后可在个人中心改。$/, 'Sample catalogue: $1 programmes from XJTLU. Other schools can pick “Other major”; undecided is fine too.'],
    [/^© (\d{4}) PinDa 校园互助平台 · 学生创业演示项目$/, '© $1 PinDa · student startup demo']
  ];

  function translate(text) {
    var raw = String(text == null ? '' : text);
    var t = raw.trim();
    if (!t) return raw;
    if (Object.prototype.hasOwnProperty.call(DICT, t)) {
      return raw.replace(t, DICT[t]);
    }
    for (var i = 0; i < PATTERNS.length; i++) {
      if (PATTERNS[i][0].test(t)) return raw.replace(t, t.replace(PATTERNS[i][0], PATTERNS[i][1]));
    }
    return raw;
  }

  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, TEXTAREA: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label'];

  function walk(root) {
    if (!root) return;
    try {
    var doc = root.ownerDocument || document;
    var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p || SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        return /[\u4e00-\u9fff]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    var all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    Array.prototype.forEach.call(all, function (el) {
      ATTRS.forEach(function (a) {
        if (el.hasAttribute && el.hasAttribute(a)) {
          var v = el.getAttribute(a);
          if (/[\u4e00-\u9fff]/.test(v)) {
            var nv = translate(v);
            if (nv !== v) el.setAttribute(a, nv);
          }
        }
      });
    });
    } catch (e) { /* 翻译失败不应影响页面渲染 */ }
  }

  V.i18n = {
    lang: 'zh',
    dict: DICT,
    has: function (s) { return Object.prototype.hasOwnProperty.call(DICT, String(s || '').trim()); },
    t: function (s) { return V.i18n.lang === 'en' ? translate(s) : s; },
    apply: function (root) { if (V.i18n.lang === 'en') walk(root || document.body); },
    load: function () {
      var saved = null;
      try { saved = window.localStorage.getItem(KEY); } catch (e) { }
      V.i18n.lang = saved === 'en' ? 'en' : 'zh';
      return V.i18n.lang;
    },
    setLang: function (lang) {
      V.i18n.lang = lang === 'en' ? 'en' : 'zh';
      try { window.localStorage.setItem(KEY, V.i18n.lang); } catch (e) { }
      if (document.documentElement) document.documentElement.lang = V.i18n.lang === 'en' ? 'en' : 'zh-CN';
      document.title = V.i18n.lang === 'en'
        ? 'PinDa · Campus mutual-aid platform | PinPin & DaiDai'
        : 'PinDa · 连接校园，让校园生活更简单 ｜ 拼拼 PINPIN & 代代 DAIDAI';
      return V.i18n.lang;
    },
    toggle: function () { return V.i18n.setLang(V.i18n.lang === 'en' ? 'zh' : 'en'); },
    button: function () {
      return '<button class="btn outline sm lang-btn" data-action="lang-toggle" title="' +
        (V.i18n.lang === 'en' ? '切换到中文' : 'Switch to English') + '">🌐 ' +
        (V.i18n.lang === 'en' ? '中文' : 'EN') + '</button>';
    }
  };
})();
