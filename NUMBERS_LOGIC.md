# 🎫 用户获得幸运号码数量逻辑

## 一、号码获取途径

用户可以通过以下方式获得幸运号码：

### 1. 注册参与 (新用户)
### 2. 每日签到
### 3. 充值获得
### 4. 邀请好友
### 5. 管理员赠送 (特殊情况)

---

## 二、各途径号码数量

### 🎁 1. 注册参与 (Join Now)

| 用户类型 | 号码等级 | 号码数量 |
|---------|---------|---------|
| 全新用户 (NEW) | 🎁 Free | 1个 |
| 新玩家 (NEW_PLAYER) | 🎁 Free | 1个 |
| 活跃玩家 (ACTIVE) | 🎁 Free | 1个 |
| 沉睡用户 (DORMANT) | ⭐ Silver | 2个 |
| VIP用户 (VIP) | ⭐ Silver | 3个 |
| 回流用户 (RETURNING) | 🎁 Free | 1个 |

**注意**: 当前版本简化为统一流程，所有新用户首次参与时：
- 发送截图 → 输入GameID → 审核通过
- 审核通过后根据**实际充值金额**发放对应档位号码

---

### 📅 2. 每日签到 (Daily Check-in)

| 签到情况 | 号码等级 | 号码数量 |
|---------|---------|---------|
| 普通签到 | 🎁 Free | 1个 |
| 连续7天签到 | ⭐ Silver | 5个 (bonus) |

**规则**:
- 每日可签到1次
- 连续签到7天获得额外奖励
- 断签后重新计算

---

### 💰 3. 充值获得 (主要途径)

根据充值金额自动匹配档位：

| 充值金额 | 号码等级 | 获得数量 | 单个权重 | 总权重 |
|---------|---------|---------|---------|--------|
| ₹0 (免费) | 🎁 Free | 1个 | 1x | 1x |
| ₹100 | ⭐ Silver | 2个 | 2x | 4x |
| ₹300 | ⭐ Silver | 3个 | 3x | 9x |
| ₹500 | ⭐⭐ Gold | 4个 | 4x | 16x |
| ₹999-1000 | ⭐⭐ Gold | 5个 | 5x | 25x |
| ₹2000 | ⭐⭐⭐ Diamond | 6个 | 6x | 36x |
| ₹3000 | ⭐⭐⭐ Diamond | 7个 | 7x | 49x |
| ₹4999-5000 | 👑 Crown | 8个 | 8x | 64x |
| ₹10000 | 👑 Crown | 10个 | 10x | 100x |
| ₹20000 | 👑👑 VIP | 12个 | 12x | 144x |

**计算逻辑**:
```
充值 ₹500:
→ 匹配 GOLD 档位
→ 获得 4个 Gold号码
→ 每个号码权重 4x
→ 总权重 = 4 × 4 = 16x
```

**VIP加成**:
- VIP用户所有号码权重 × 1.5
- 示例: Gold号码(4x) → VIP用户为(6x)

---

### 👥 4. 邀请好友奖励

| 邀请行为 | 奖励等级 | 号码数量 | 获得者 |
|---------|---------|---------|--------|
| 好友注册 | ⭐ Silver | 2个 | 邀请人 |
| 好友首充≥₹100 | ⭐⭐ Gold | 2个 | 邀请人 |

---

### 🔧 5. 管理员赠送 (特殊)

管理员可通过命令手动发放：

| 命令 | 参数 | 说明 |
|-----|------|------|
| `/givenumbers` | GameID + 数量 + 等级 | 指定数量/等级 |
| `/givetier` | GameID + 金额 | 按金额档位发放 |

示例:
```
/givenumbers 1234567 5 G
→ 给用户1234567发放5个Gold号码

/givetier 1234567 500
→ 给用户1234567发放相当于₹500的号码(4个Gold)
```

---

## 三、号码等级详解

| 等级代码 | 名称 | Emoji | 最低充值 | 权重 |
|---------|------|-------|---------|------|
| F | Free | 🎁 | ₹0 | 1x |
| S | Silver | ⭐ | ₹100 | 2x |
| G | Gold | ⭐⭐ | ₹500 | 4x |
| D | Diamond | ⭐⭐⭐ | ₹2000 | 6x |
| C | Crown | 👑 | ₹5000 | 8x |
| V | VIP Elite | 👑👑 | ₹20000 | 12x |

---

## 四、核心代码逻辑

### 1. 根据金额获取档位
```javascript
getTierByAmount(amount) {
    // 遍历所有档位阈值
    const tiers = [0, 100, 300, 500, 1000, 2000, 5000, 10000, 20000];
    
    let selected = RECHARGE_TIERS[0];  // 默认免费档
    
    for (const threshold of tiers) {
        if (amount >= threshold) {
            selected = RECHARGE_TIERS[threshold];
        }
    }
    
    return selected;  // { tier: 'GOLD', count: 4, weight: 4 }
}
```

### 2. 生成号码
```javascript
generateNumbers(userId, amount, source, date) {
    // 获取档位配置
    const tierConfig = getTierByAmount(amount);
    
    // 检查VIP加成
    let vipMultiplier = 1;
    if (userIsVIP) {
        vipMultiplier = 1.5;
    }
    
    // 生成指定数量的号码
    const numbers = [];
    for (let i = 0; i < tierConfig.count; i++) {
        numbers.push({
            number: `${tierConfig.code}-${序列号}`,
            tierCode: tierConfig.code,
            weight: tierConfig.weight,
            finalWeight: tierConfig.weight * vipMultiplier
        });
    }
    
    return {
        tier: tierConfig,
        numbers: numbers,
        count: tierConfig.count,
        baseWeight: tierConfig.weight,
        vipMultiplier: vipMultiplier
    };
}
```

---

## 五、示例场景

### 场景1: 新用户首次充值 ₹500
```
1. 发送截图
2. 输入GameID
3. 管理员审核通过 ₹500
4. 系统发放:
   → 4个 Gold号码
   → 号码示例: G-0001, G-0002, G-0003, G-0004
   → 每个权重 4x
   → 总权重 16x
```

### 场景2: VIP用户充值 ₹2000
```
1. 已有VIP身份
2. 充值 ₹2000
3. 系统发放:
   → 6个 Diamond号码
   → 号码示例: D-0001 ~ D-0006
   → 基础权重 6x
   → VIP加成后 9x (6 × 1.5)
   → 总权重 54x (6 × 9)
```

### 场景3: 老用户再次充值
```
用户已有10个号码，再次充值 ₹1000:
→ 获得 5个 Gold号码
→ 累计拥有 15个号码
→ 更多抽奖机会
```

---

## 六、关键配置 (config.js)

```javascript
RECHARGE_TIERS: {
    0:     { tier: 'FREE',    count: 1,  weight: 1 },
    100:   { tier: 'SILVER',  count: 2,  weight: 2 },
    300:   { tier: 'SILVER',  count: 3,  weight: 3 },
    500:   { tier: 'GOLD',    count: 4,  weight: 4 },
    1000:  { tier: 'GOLD',    count: 5,  weight: 5 },
    2000:  { tier: 'DIAMOND', count: 6,  weight: 6 },
    3000:  { tier: 'DIAMOND', count: 7,  weight: 7 },
    5000:  { tier: 'CROWN',   count: 8,  weight: 8 },
    10000: { tier: 'CROWN',   count: 10, weight: 10 },
    20000: { tier: 'VIP',     count: 12, weight: 12 }
}
```

---

## 七、修改号码数量

如需调整各档位号码数量，编辑 `config.js`:

```javascript
// 示例: 将 ₹500 档位从4个改为5个
500: { tier: 'GOLD', count: 5, weight: 4 },  // 原来是 count: 4
```

修改后重启机器人生效。
