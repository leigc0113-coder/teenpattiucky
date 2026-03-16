# 🔧 管理员命令指南

## 快速开始

发送 `/admin` 显示管理员面板  
发送 `/adminhelp` 显示手动发号帮助

---

## 📋 命令列表

### 查看类

| 命令 | 说明 | 示例 |
|------|------|------|
| `/admin` | 显示管理员面板 | `/admin` |
| `/pending` | 查看待审核列表 | `/pending` |
| `/stats` | 查看今日统计 | `/stats` |
| `/users` | 查看用户列表 | `/users` 或 `/users 20` |
| `/winners` | 查看中奖列表 | `/winners` 或 `/winners 2026-03-15` |

### 充值审核类

| 命令 | 说明 | 示例 |
|------|------|------|
| `/approve` | 手动通过充值 | `/approve abc123 500` |
| `/reject` | 手动拒绝充值 | `/reject abc123 Invalid` |

### 手动发号类 ⚠️

| 命令 | 说明 | 示例 |
|------|------|------|
| `/givenumbers` | 指定等级发号 | `/givenumbers 1234567 5 G Reward` |
| `/givetier` | 按金额档位发号 | `/givetier 1234567 500 Bonus` |
| `/addtowinners` | 手动添加中奖 | `/addtowinners 1234567 1` |
| `/removenumber` | 移除指定号码 | `/removenumber G-0001` |
| `/listnumbers` | 查看用户号码 | `/listnumbers 1234567` |
| `/adminhelp` | 发号功能帮助 | `/adminhelp` |

### 其他管理类

| 命令 | 说明 | 示例 |
|------|------|------|
| `/drawnow` | 立即开奖 | `/drawnow` |
| `/vip` | 授予VIP | `/vip u_123456` |
| `/unvip` | 撤销VIP | `/unvip u_123456` |
| `/finduser` | 查找用户 | `/finduser 1234567` |
| `/broadcast` | 广播消息 | `/broadcast 今日开奖时间提前到20:00` |

---

## 📱 管理员面板 (/admin)

```
🔧 Admin Panel
━━━━━━━━━━━━━━━━━━

📊 Today's Stats
• Pending Reviews: 5
• Total Recharge: ₹50,000
• Users: 25
• Pool: ₹5,000

━━━━━━━━━━━━━━━━━━
Quick Commands

📋 /pending - View pending reviews
📊 /stats - View full statistics
👥 /users - List users
🏆 /winners - View winners
🎲 /drawnow - Trigger draw now

Manual Actions
`/approve [ID] [amount]`
`/reject [ID] [reason]`
`/vip [userId]`
`/unvip [userId]`
`/finduser [GameID]`

Broadcast
`/broadcast [message]`
```

---

## 🎁 手动发号功能 (/adminhelp)

### ⚠️ 警告
- 所有操作都会被记录
- 仅用于正当用途（补偿、奖励、测试）
- 滥用可能导致用户信任丧失或平台封禁

### 等级代码
| 代码 | 等级 | 权重 |
|------|------|------|
| F | Free | 1x |
| S | Silver | 2x |
| G | Gold | 4x |
| D | Diamond | 6x |
| C | Crown | 8x |
| V | VIP | 12x |

### 命令详情

#### 1. 指定等级发号
```
/givenumbers [GameID] [数量] [等级] [原因]

示例:
/givenumbers 1234567 5 G Activity reward

结果:
给用户1234567发送5个Gold(G)号码
```

#### 2. 按金额档位发号
```
/givetier [GameID] [金额] [原因]

示例:
/givetier 1234567 500 Welcome bonus

结果:
给用户1234567发送相当于₹500充值的号码
（根据配置，可能是4个Gold号码）
```

#### 3. 手动添加中奖者
```
/addtowinners [GameID] [奖项]

奖项: 1=一等奖, 2=二等奖, 3=三等奖

示例:
/addtowinners 1234567 1

结果:
将用户1234567添加为一等奖中奖者
使用其今日的第一个号码作为中奖号码
```

#### 4. 移除号码
```
/removenumber [号码ID]

示例:
/removenumber G-0001

结果:
将号码G-0001标记为已移除
```

#### 5. 查看用户号码
```
/listnumbers [GameID]

示例:
/listnumbers 1234567

结果:
显示该用户今日所有号码及状态
```

---

## 🔍 使用场景

### 场景1: 补偿用户
用户充值遇到问题，手动补发号码：
```
/givetier 1234567 500 Compensation for payment issue
```

### 场景2: 活动奖励
活动获奖用户发放奖励：
```
/givenumbers 1234567 10 V Event winner prize
```

### 场景3: 测试开奖
测试中奖通知流程：
```
/addtowinners 1234567 2
```

### 场景4: 查看用户
调查用户投诉：
```
/listnumbers 1234567
```

---

## 💡 提示

1. **充值ID**: 使用 `/pending` 查看ID（显示为8位字符）
2. **用户ID**: 使用 `/finduser` 或 `/users` 查看
3. **日期格式**: 中奖查询使用 `YYYY-MM-DD` 格式
4. **广播限制**: 广播给所有用户，谨慎使用
5. **日志记录**: 所有手动操作都会记录到控制台

---

## 🔒 权限

只有 `config.js` 中 `ADMIN_IDS` 列表中的用户才能使用管理员命令
