# 等级身份系统重构方案 v2.0

## 当前问题

**现有设计缺陷：**
- 全球仅10个等级身份（Bronze·01 ~ Star·01）
- 第11个用户注册时无法分配等级
- 99%的用户将没有等级身份
- 严重影响用户体验和公平性

**影响范围：**
- 奖池计算（等级用户10% vs 普通用户15%）
- 用户留存（没有等级=没有归属感）
- 长期增长（无法支持大规模用户）

---

## 改进方案：混合模式

### 核心设计理念

```
┌─────────────────────────────────────┐
│        等级身份（人人有）            │
│   累计充值 → 自动升级 → 永久身份      │
├─────────────────────────────────────┤
│        排行榜（动态竞争）            │
│   实时排名 → 周重置 → 竞争激励        │
├─────────────────────────────────────┤
│        赛季系统（长期留存）          │
│   月度赛季 → 奖励结算 → 新赛季        │
└─────────────────────────────────────┘
```

---

## 详细设计

### 1. 等级身份系统（累计充值）

**人人有等级，永不落空**

```javascript
TIER_LEVELS = {
    1: { name: 'Bronze',  threshold: 0,      display: 'Bronze Member' },
    2: { name: 'Silver',  threshold: 5000,   display: 'Silver Member' },
    3: { name: 'Gold',    threshold: 15000,  display: 'Gold Member' },
    4: { name: 'Platinum',threshold: 50000,  display: 'Platinum Member' },
    5: { name: 'Diamond', threshold: 120000, display: 'Diamond Member' },
    6: { name: 'Star',    threshold: 300000, display: 'Star Member' }
}

// 用户等级身份
identity = {
    userId: 'u_xxx',
    level: 5,                    // 当前等级
    displayName: 'Gold Member',   // 显示名称（无编号）
    totalRecharge: 50000,        // 累计充值
    upgradedAt: '2026-03-17',    // 升级时间
    isVIP: false                 // VIP状态
}
```

**特点：**
- ✅ 无限用户支持
- ✅ 累计充值自动升级
- ✅ 等级永久有效
- ✅ 奖池抽成差异化（等级10% / 普通15%）

---

### 2. 排行榜系统（动态竞争）

**实时排名，制造稀缺性**

```javascript
RANKING_TYPES = {
    DAILY: {
        name: '日榜',
        reset: '每天 21:00',
        metric: '当日充值金额',
        reward: 'Top 3 获得 Crown 号码'
    },
    WEEKLY: {
        name: '周榜',
        reset: '每周日 21:00',
        metric: '本周充值金额',
        reward: 'Top 10 获得专属标识'
    },
    INVITE: {
        name: '邀请榜',
        reset: '实时',
        metric: '有效邀请数',
        reward: 'Top 5 获得 Diamond 号码'
    },
    LUCKY: {
        name: '幸运榜',
        reset: '实时',
        metric: '累计中奖金额',
        reward: '展示在首页'
    }
}

// 排行榜条目
rankingEntry = {
    userId: 'u_xxx',
    username: '@username',
    rank: 3,                     // 第3名
    metric: 50000,              // 指标值
    reward: '3x Crown Numbers', // 奖励
    updatedAt: '2026-03-17T12:00:00Z'
}
```

**特点：**
- ✅ 制造竞争氛围
- ✅ 动态稀缺性（不是固定10人）
- ✅ 多种维度（充值/邀请/运气）
- ✅ 周重置，给新人机会

---

### 3. 赛季系统（长期留存）

**月度赛季，持续激励**

```javascript
SEASON_CONFIG = {
    duration: '30天',           // 赛季时长
    startDate: '2026-03-01',   // 开始日期
    endDate: '2026-03-31',     // 结束日期
    
    // 赛季任务
    missions: [
        { id: 1, name: '首次充值', reward: '2 Silver', condition: '充值≥₹100' },
        { id: 2, name: '连续签到', reward: '1 Gold', condition: '连续7天签到' },
        { id: 3, name: '邀请达人', reward: '3 Diamond', condition: '邀请5人' },
        { id: 4, name: '充值大户', reward: 'VIP Package', condition: '累计充值≥₹50,000' }
    ],
    
    // 赛季排名奖励
    rankingRewards: {
        1: { name: '赛季冠军', reward: '₹10,000 + Star Identity' },
        2: { name: '赛季亚军', reward: '₹5,000 + Diamond Package' },
        3: { name: '赛季季军', reward: '₹2,000 + Gold Package' },
        '4-10': { name: '赛季十强', reward: 'Crown Package' },
        '11-100': { name: '赛季百强', reward: 'Gold Package' }
    }
}

// 用户赛季数据
seasonData = {
    userId: 'u_xxx',
    seasonId: '2026-03',
    totalRecharge: 80000,
    missionCompleted: [1, 2, 4],
    weeklyRank: 5,
    finalReward: '₹2,000 + Gold Package'
}
```

**特点：**
- ✅ 月度重置，持续新鲜感
- ✅ 任务系统，引导行为
- ✅ 排名奖励，激烈竞争
- ✅ 赛季专属标识，炫耀属性

---

## 数据结构变更

### 当前数据结构

```javascript
// tierNumberPool.json - 10个全球唯一号码
[
    { id: "Bronze·01", level: 1, status: "FREE", userId: null },
    { id: "Bronze·02", level: 2, status: "OCCUPIED", userId: "u_001" },
    ...
]

// tierIdentities.json
[
    { id: "tier_u_001", userId: "u_001", level: 2, displayName: "Bronze·02" }
]
```

### 新数据结构

```javascript
// tierConfig.json - 等级配置（静态）
{
    levels: {
        1: { name: "Bronze", threshold: 0, poolRate: 0.15 },
        2: { name: "Silver", threshold: 5000, poolRate: 0.10 },
        3: { name: "Gold", threshold: 15000, poolRate: 0.10 },
        4: { name: "Platinum", threshold: 50000, poolRate: 0.10 },
        5: { name: "Diamond", threshold: 120000, poolRate: 0.10 },
        6: { name: "Star", threshold: 300000, poolRate: 0.10 }
    }
}

// tierIdentities.json - 用户等级（动态）
[
    {
        id: "tier_u_001",
        userId: "u_001",
        level: 5,
        displayName: "Gold Member",
        totalRecharge: 50000,
        upgradedAt: "2026-03-15",
        isVIP: false,
        seasonRank: 12
    }
]

// rankings.json - 排行榜（每日/每周更新）
{
    daily: {
        date: "2026-03-17",
        top100: [
            { rank: 1, userId: "u_123", amount: 20000, reward: "3x Crown" },
            ...
        ]
    },
    weekly: {
        week: "2026-W11",
        top100: [...]
    }
}

// seasons.json - 赛季数据
{
    currentSeason: "2026-03",
    seasons: [
        {
            id: "2026-03",
            name: "March Season",
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            status: "ACTIVE"
        }
    ]
}
```

---

## 业务流程变更

### 1. 用户注册流程

```
当前流程：
注册 → 尝试分配等级号码 → 失败（超过10人）→ 无等级

新流程：
注册 → 自动创建等级身份（Bronze Member）→ 人人有等级
```

### 2. 充值升级流程

```
当前流程：
充值 → 累计金额 → 手动升级 → 分配新号码

新流程：
充值 → 累计金额 → 自动检查 → 达到门槛自动升级
     → 发送升级通知 → 显示新等级
```

### 3. 奖池计算流程

```
当前流程：
用户A（有等级）→ 抽成10%
用户B（无等级）→ 抽成15%

新流程：
用户A（Gold Member）→ 抽成10%
用户B（Bronze Member）→ 抽成15%（假设Bronze用15%）
用户C（Silver+ Member）→ 抽成10%

注意：可以设置 Bronze 为 15%，Silver+ 统一为 10%
```

---

## UI 界面变更

### 1. 主菜单新增入口

```
My Account
Recharge
Daily Check-in
Invite Friends
Current Pool
🏆 Rankings        ← 新增
🎯 Season          ← 新增
Help
```

### 2. 等级显示变更

**当前显示：**
```
🏆 Tier: Bronze·02
💰 Total Recharge: ₹5,000
📈 Next: Silver·01 (₹10,000 more)
```

**新显示：**
```
🏆 Level: Gold Member
⭐ Season Rank: #12 (Top 10%)
💰 Total Recharge: ₹50,000
📈 Next Level: Platinum (₹70,000 more)
🎁 Season Progress: [██████░░░░] 60%
```

### 3. 排行榜页面

```
🏆 Weekly Rankings

🥇 #1 @username - ₹200,000
🥈 #2 @username - ₹150,000  
🥉 #3 @username - ₹100,000
   ...
⭐ #12 You - ₹50,000 (Top 10%)

⏰ Resets in: 3 days 12 hours
🎁 Your Reward: Crown Package
```

---

## 实施计划

### 阶段1：数据结构迁移（Day 1-2）

- [ ] 创建新配置 `tierConfig.json`
- [ ] 迁移现有10个用户等级数据
- [ ] 修改 `assignTierNumber()` 逻辑
- [ ] 测试数据迁移脚本

### 阶段2：等级系统重构（Day 3-4）

- [ ] 重写 `TierService` 核心逻辑
- [ ] 实现自动升级检测
- [ ] 修改奖池计算（区分Bronze/Silver+）
- [ ] 测试等级升级流程

### 阶段3：排行榜系统（Day 5-6）

- [ ] 创建排行榜数据结构
- [ ] 实现日榜/周榜计算
- [ ] 添加排行榜奖励发放
- [ ] 测试排行榜更新

### 阶段4：赛季系统（Day 7-8）

- [ ] 创建赛季数据结构
- [ ] 实现赛季任务系统
- [ ] 添加赛季结算逻辑
- [ ] 测试赛季切换

### 阶段5：UI 更新（Day 9-10）

- [ ] 更新 My Account 页面
- [ ] 添加 Rankings 菜单
- [ ] 添加 Season 菜单
- [ ] 更新消息模板

### 阶段6：测试与部署（Day 11-12）

- [ ] 完整流程测试
- [ ] 数据一致性检查
- [ ] 备份旧数据
- [ ] 部署上线

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据迁移失败 | 高 | 完整备份，回滚方案 |
| 用户等级丢失 | 高 | 保留旧数据映射表 |
| 奖池计算错误 | 中 | 双重验证，日志记录 |
| 用户不习惯新UI | 低 | 添加引导提示 |

---

## 回滚方案

如果实施失败：

```bash
# 1. 停止服务
# 2. 恢复旧数据
git checkout v1.3.0-stable
cp backup/tierNumberPool.json data/
cp backup/tierIdentities.json data/

# 3. 重启服务
npm start
```

---

## 决策记录

**决策日期：** 2026-03-17  
**决策人：** GC  
**决策内容：** 采用方案4（混合模式）重构等级身份系统  
**理由：**
1. 支持无限用户扩展
2. 保留等级激励作用
3. 排行榜制造竞争
4. 赛季系统促进留存

**预计工期：** 12天  
**预计上线：** 2026-03-29  

---

## 相关文档

- 当前版本：v2.0.0（菜单重构）
- 备份版本：v1.3.0-stable
- GitHub：https://github.com/leigc0113-coder/teenpattiucky
