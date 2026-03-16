# 游戏号码抽奖平台 v1.1.0

基于 Telegram Bot 的游戏号码抽奖系统，融合等级身份、VIP特权、每日开奖和邀请裂变。

## ✨ 功能特性

- **10个稀缺等级身份** - 青铜·01 到 星耀·01，全球唯一
- **VIP特权体系** - 连续5天充值₹5,000获得永久VIP
- **每日开奖** - 21:00 IST开奖，奖池动态计算
- **邀请裂变** - 邀请好友获得额外号码奖励
- **等级权重** - 不同等级号码有不同中奖权重
- **自动通知** - 开奖后自动通知中奖者

## 🚀 快速开始

### 安装

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 BOT_TOKEN

# 3. 运行测试
npm test

# 4. 启动机器人
npm start
```

### 配置管理员

编辑 `config.js`:
```javascript
ADMIN_IDS: [123456789, 987654321]  // 你的Telegram用户ID
```

## 🤖 Bot命令

| 命令/按钮 | 说明 |
|-----------|------|
| /start | 注册账户 |
| My Account | 查看账户信息 |
| Daily Check-in | 每日签到 |
| Invite Friends | 邀请好友 |
| Recharge | 充值说明 |
| Current Pool | 当前奖池 |
| Help | 帮助信息 |

## 📁 文件结构

```
teenpatti-lucky-bot/
├── bot.js                 # 主入口（已修复）
├── config.js              # 业务配置
├── cronJobs.js            # 定时任务 ⭐新增
├── test.js                # 测试脚本 ⭐新增
├── cron.bat               # Windows批处理 ⭐新增
├── FIXES.md               # 修复日志 ⭐新增
├── messages.js            # 消息模板
├── database.js            # 数据存储
├── *.Service.js           # 业务服务
├── package.json
├── .env.example
└── data/                  # 数据文件（自动生成）
```

## ⏰ 定时任务

| 时间 | 任务 | 命令 |
|------|------|------|
| 00:00 | VIP资格检查 + 冷静期释放 | `node cronJobs.js vip` |
| 20:30 | 奖池计算并锁定 | `node cronJobs.js pool` |
| 21:00 | 开奖 | `node cronJobs.js draw` |
| 23:59 | VIP过期检查 | `node cronJobs.js reset-vip` |

### Windows 任务计划

双击运行 `cron.bat` 选择任务，或配置任务计划程序自动执行。

### 手动执行

```bash
# 执行所有任务
node cronJobs.js all

# 单独执行
node cronJobs.js vip
node cronJobs.js pool
node cronJobs.js draw
node cronJobs.js cooling
node cronJobs.js reset-vip
```

## 🐛 修复记录 (v1.1.0)

### 主要修复
1. ✅ **回调重复注册** - 合并为统一处理器
2. ✅ **充值档次选择** - 添加完整处理逻辑
3. ✅ **邀请功能** - 完善奖励发放流程
4. ✅ **VIP连续天数** - 修复清零逻辑
5. ✅ **开奖通知** - 自动通知中奖者
6. ✅ **时区处理** - 使用印度时区(IST)

查看 `FIXES.md` 获取详细修复说明。

## ⚙️ 配置说明

编辑 `config.js` 修改业务规则：

```javascript
// VIP门槛
VIP: {
    DAILY_THRESHOLD: 5000,
    CONSECUTIVE_DAYS: 5,
}

// 等级门槛
TIER_THRESHOLDS: {
    1: 0,
    2: 5000,
    // ...
}

// 开奖时间
DRAW: {
    HOUR: 21,
    MINUTE: 0,
}

// 充值档位
RECHARGE_TIERS: {
    0: { tier: 'FREE', count: 1, weight: 1 },
    100: { tier: 'SILVER', count: 2, weight: 2 },
    // ...
}
```

## 🧪 测试

```bash
npm test
```

测试覆盖：
- 用户创建与等级分配
- 号码生成（免费/充值）
- 签到系统
- 邀请系统
- 充值审核
- VIP进度
- 奖池计算
- 等级升级

## 📊 数据存储

所有数据存储在 `data/` 目录下的 JSON 文件中：

- `users.json` - 用户信息
- `tierIdentities.json` - 等级身份
- `lotteryNumbers.json` - 号码记录
- `recharges.json` - 充值记录
- `pools.json` - 奖池记录
- `winners.json` - 中奖记录
- `inviteRecords.json` - 邀请记录
- `checkins.json` - 签到记录

## ⚠️ 注意事项

1. **备份**: 定期备份 `data/` 目录
2. **Token**: 保护好你的 BOT_TOKEN，不要提交到代码仓库
3. **管理员**: 配置正确的管理员ID才能接收审核通知
4. **时区**: 服务器建议使用 IST (Asia/Kolkata) 时区
5. **游戏API**: 目前游戏数据是模拟的，实际使用需要接入游戏API

## 📝 许可证

MIT

---

**版本**: v1.1.0 (Fixed & Enhanced)  
**作者**: 兔崽子 🐰
