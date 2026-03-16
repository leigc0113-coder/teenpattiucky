# 版本备份记录

## v1.3.0-stable (2026-03-17)

### 版本标签
**Git Tag:** `v1.3.0-stable`  
**Commit:** `eb7fa16`  
**GitHub:** https://github.com/leigc0113-coder/teenpattiucky/releases/tag/v1.3.0-stable

---

### 功能清单

#### ✅ 核心功能
- [x] **双轨制参与流程**
  - 免费参与：Game ID → 审核 → 1个FREE号码
  - 充值参与：选档位 → 截图 → 审核 → 2-12个号码
- [x] **档位选择系统** (₹100 - ₹20,000)
- [x] **管理员审核系统** (批准/拒绝 + 金额选择)
- [x] **号码生成系统** (FREE/SILVER/GOLD/DIAMOND/CROWN/VIP)
- [x] **等级身份系统** (10个全球唯一 Bronze·01 ~ Star·01)

#### ✅ 用户功能
- [x] **注册流程** (/start)
- [x] **每日签到** (1 Free号码)
- [x] **邀请好友** (注册2 Silver + 首充2 Gold)
- [x] **我的账户** (查看号码/统计/等级)
- [x] **Current Pool** (实时奖池 + 倒计时)
- [x] **Help菜单** (权重/号码/奖项/VIP说明)

#### ✅ 奖池系统
- [x] **奖池计算** (保底₹1,000 + 抽成10-15% + 周末30%)
- [x] **实时更新** (每次查看重新计算)
- [x] **奖金分配** (一等奖40% + 二等奖20%×2 + 三等奖20%)
- [x] **中奖率** (5%参与人数, 最多20人)

#### ✅ 邀请系统
- [x] **邀请码生成** (REF + 8位随机)
- [x] **注册奖励** (邀请人获2 Silver)
- [x] **首充奖励** (邀请人获2 Gold, 被邀请人充≥₹100)
- [x] **邀请统计** (总邀请/已注册/已首充)
- [x] **分享功能** (Telegram/Facebook/WhatsApp)

#### ✅ 管理员功能
- [x] **审核通知** (免费申请文字 + 充值申请截图)
- [x] **一键批准** (₹100/₹300/₹500/₹1K/₹2K/₹5K/₹10K/₹20K)
- [x] **拒绝功能**
- [x] **号码自动发放**

#### ✅ VIP系统
- [x] **VIP资格** (连续5天充值≥₹5,000)
- [x] **VIP权益** (1.5x权重加成)
- [x] **永久VIP** (一旦获得，永久有效)

#### ✅ 私域联动
- [x] **频道关注检查**
- [x] **群组欢迎消息**
- [x] **开奖结果推送** (频道+群组)

---

### 文件清单

```
teenpatti-lucky-bot/
├── bot.js                    # 主入口 (修改: 双轨制流程)
├── config.js                 # 配置 (未修改)
├── database.js               # 数据库 (未修改)
├── drawService.js            # 开奖服务 (未修改)
├── drawNotification.js       # 开奖通知 (未修改)
├── integration.js            # 私域联动 (未修改)
├── lotteryService.js         # 抽奖服务 (未修改)
├── numberTierService.js      # 号码等级 (未修改)
├── poolService.js            # 奖池服务 (修改: 时区+实时计算)
├── rechargeService.js        # 充值服务 (未修改)
├── tierService.js            # 等级服务 (修改: 冷静期检查)
├── userService.js            # 用户服务 (未修改)
├── vipService.js             # VIP服务 (未修改)
├── inviteService.js          # 邀请服务 (未修改)
├── checkinService.js         # 签到服务 (未修改)
├── messages.js               # 消息模板 (未修改)
├── cronJobs.js               # 定时任务 (未修改)
├── test.js                   # 测试脚本 (未修改)
├── package.json              # 依赖 (未修改)
├── data/
│   ├── users.json
│   ├── tierIdentities.json
│   ├── tierNumberPool.json   # 重置过
│   ├── lotteryNumbers.json
│   ├── recharges.json
│   ├── pools.json
│   ├── winners.json
│   ├── inviteRecords.json
│   └── checkins.json
└── docs/
    └── TIER_IMPROVEMENT_PLAN.md
```

---

### 配置参数

```javascript
// 奖池配置
POOL: {
    BASE_AMOUNT: 1000,
    REGULAR_RATE: 0.15,      // 普通用户抽成
    TIER_RATE: 0.10,         // 等级用户抽成
    WEEKEND_BONUS: 0.30,
    MIN_POOL: 1000,
    MAX_POOL: 10000
}

// VIP配置
VIP: {
    DAILY_THRESHOLD: 5000,
    CONSECUTIVE_DAYS: 5
}

// 开奖时间
DRAW: {
    HOUR: 21,
    MINUTE: 0,
    TIMEZONE: 'Asia/Kolkata'
}

// 冷静期
COOLING_PERIOD_DAYS: 7
```

---

### 已知问题 (将在v2.0重构中解决)

1. **菜单系统不完善**
   - Help按钮部分选项点击无反应
   - 缺少完整的规则展示页面
   - 需要分层导航结构

2. **用户体验问题**
   - 状态依赖过重，过期后按钮失效
   - 缺少返回按钮，用户容易迷路
   - 弹窗信息分散，需要多次点击

3. **合规性缺失**
   - 缺少责任博彩页面
   - 用户协议不完整
   - 缺少隐私政策详细说明

4. **功能缺失**
   - 多语言支持 (Hindi/English)
   - 历史开奖记录查询
   - 排行榜系统
   - 数据分析页面

---

### 回滚方法

如需回滚到此版本：

```bash
git checkout v1.3.0-stable
# 或
git reset --hard v1.3.0-stable
```

---

### 备份时间
**备份日期:** 2026-03-17  
**备份人:** AI Assistant  
**备份原因:** 准备v2.0菜单重构

---

### 重构计划 (v2.0)

**目标:** 完整菜单重构方案1-8

**预计时间:** 1-2天

**主要内容:**
1. 分层导航菜单系统
2. 详细参与流程页面
3. 奖池与奖金规则页面
4. 号码与等级系统页面
5. 用户行为准则页面
6. 所有权与法律页面
7. 责任博彩页面
8. 客服与FAQ页面
9. 数据分析页面

**风险控制:**
- 保持现有API不变
- 仅修改UI层
- 保留所有回调处理
- 添加向后兼容
