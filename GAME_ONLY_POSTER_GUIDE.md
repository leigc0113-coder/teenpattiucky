# 🎮 游戏推荐自动发帖系统

## ✅ 已完成

### 新增文件
| 文件 | 功能 |
|------|------|
| `gameOnlyPoster.js` | 只发送游戏推荐的自动发帖器 |
| `contentGeneratorDual.js` (更新) | 扩展至 10 种游戏模板 |

---

## 📋 功能特点

### 🎯 只发游戏推荐
- ❌ 移除：早安、奖池、倒计时、开奖结果、晚安帖
- ✅ 保留：仅游戏推荐帖子

### 🎮 10 种游戏模板

| 游戏ID | 游戏名称 | 风格 |
|--------|----------|------|
| `aviator` | Aviator ✈️ | 飞机倍增 |
| `dragon` | Dragon vs Tiger 🐉⚡ | 龙虎斗 |
| `slots` | Wealth Slot 💎 | 老虎机 |
| `chicken` | Chicken Road 🐔 | 策略闯关 |
| `teenpatti` | Teen Patti 🇮🇳 | 印度扑克 |
| `roulette` | Roulette 🎡 | **新增** 轮盘 |
| `blackjack` | Blackjack 🃏 | **新增** 21点 |
| `baccarat` | Baccarat 💰 | **新增** 百家乐 |
| `poker` | Texas Hold'em 🎰 | **新增** 德州扑克 |
| `andar_bahar` | Andar Bahar 🎴 | **新增** 印度纸牌 |

---

## ⏰ 发帖时间表

每天只发 **8 条**游戏推荐帖子：

| 时间 | 频道 (@telltest222) | 群组 (@tkgfg) |
|------|---------------------|---------------|
| 09:00 | 游戏推荐 | - |
| 09:30 | - | 游戏推荐 |
| 12:00 | 游戏推荐 | - |
| 12:30 | - | 游戏推荐 |
| 15:00 | 游戏推荐 | - |
| 15:30 | - | 游戏推荐 |
| 18:00 | 游戏推荐 | - |
| 18:30 | - | 游戏推荐 |

**轮播机制**：10 种游戏按顺序循环，不会重复

---

## 🚀 如何启用

### 方式 1：替换现有 autoPost.js（推荐）

编辑 `bot.js`，替换自动发帖模块：

```javascript
// 旧代码（注释掉或删除）
// const AutoPoster = require('./autoPost');
// const autoPoster = new AutoPoster(bot);
// autoPoster.startScheduledPosts();

// 新代码（只发游戏推荐）
const GameOnlyPoster = require('./gameOnlyPoster');
const gamePoster = new GameOnlyPoster(bot);
gamePoster.startScheduledPosts();
```

### 方式 2：同时运行（高级）

```javascript
// 保留原有自动发帖
const AutoPoster = require('./autoPost');
const autoPoster = new AutoPoster(bot);
autoPoster.startScheduledPosts();

// 额外添加游戏推荐
const GameOnlyPoster = require('./gameOnlyPoster');
const gamePoster = new GameOnlyPoster(bot);
gamePoster.startScheduledPosts();
```

---

## 🎨 自定义游戏模板

### 添加新游戏

编辑 `contentGeneratorDual.js`：

**频道模板**：
```javascript
channel_game(data) {
    const games = {
        // ... 现有游戏 ...
        
        your_new_game: {
            name: 'Game Name 🎮',
            tagline: 'Catchy tagline here!',
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            tip: 'Pro tip for players'
        }
    };
}
```

**群组模板**：
```javascript
group_game(data) {
    const games = {
        // ... 现有游戏 ...
        
        your_new_game: {
            hook: 'Opening hook sentence...',
            vibe: 'Vibe description...',
            tip: 'Player tip...',
            ask: 'Question to engage...'
        }
    };
}
```

### 修改 gameOnlyPoster.js 游戏列表

```javascript
// 添加新游戏到轮播列表
this.gameTypes = [
    'aviator',
    'dragon', 
    'slots',
    'chicken',
    'teenpatti',
    'roulette',
    'blackjack',
    'baccarat',
    'poker',
    'andar_bahar',
    'your_new_game'  // ← 添加这里
];
```

---

## 🧪 测试命令

在 Telegram 中发送：

```
/testgame channel aviator    # 测试频道 Aviator 游戏
/testgame group blackjack    # 测试群组 Blackjack 游戏
/testgame channel roulette   # 测试频道 Roulette
```

---

## 📊 与原有系统对比

| 特性 | 原系统 (autoPost.js) | 游戏专用 (gameOnlyPoster.js) |
|------|---------------------|------------------------------|
| 帖子类型 | 11 种类型 | 只发游戏 |
| 每日数量 | 22 帖 | 8 帖 |
| 内容来源 | AI + 模板 | AI + 模板 |
| 游戏数量 | 5 种 | 10 种 |
| 适用场景 | 全面运营 | 专注游戏推广 |

---

## 🔧 故障排除

### 问题：没有发帖
**检查**：
1. `CHANNEL_ID` 和 `GROUP_ID` 是否正确配置
2. 机器人是否是频道/群组的管理员
3. Railway 环境变量是否设置

### 问题：只发了几次就停了
**原因**：`hasPostedToday` 防止同一天重复发送同类型
**解决**：每种游戏每天只发一次，10 种游戏可发 5 天

---

## 💡 建议

- **新游戏上线**：添加到模板列表，自动推广
- **节日活动**：修改特定游戏的 tip，增加节日元素
- **A/B 测试**：频道用广告风，群组用社群风，对比效果
