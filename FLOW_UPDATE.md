# Teen Patti Lucky Bot - 更新日志

## 版本: 1.2.0 - 流程更新
更新日期: 2026-03-15

---

## 🔄 用户流程变更

### 旧流程
1. 点击 /start
2. 输入 Game ID
3. 选择充值档次
4. 发送截图
5. 等待审核

### 新流程 (当前)
1. 点击 /start → 显示欢迎和 **[🎮 Join Now]** 按钮
2. 点击 **[Join Now]** → 提示**发送截图**
3. 发送截图 → 提示**输入 Game ID**
4. 输入 Game ID → **提交审核**，显示等待消息
5. 管理员审核 → 通过后发放号码

---

## ✨ 新流程优势

1. **更直观** - 先看到参与方式再行动
2. **减少步骤** - 不需要先选择充值档次
3. **管理员确认金额** - 根据截图实际金额发放号码
4. **更好的引导** - 每个步骤都有清晰说明

---

## 📝 界面文案 (英文)

### 欢迎消息
```
🎰 Welcome to Teen Patti Master Lucky Draw!

💰 Today's Pool: ₹2,000 (Weekdays) / ₹5,000 (Weekends)
⏰ Draw Time: 21:00 IST Daily

🎁 How to Join:
1. Send recharge screenshot
2. Enter your Game ID
3. Get lottery numbers!

👇 Click button to start:
[🎮 Join Now] [📋 Rules] [📞 Support]
```

### 参与指引
```
📱 How to Participate:

1️⃣ Open Teen Patti Master game
2️⃣ Recharge any amount
3️⃣ Screenshot the payment success page
4️⃣ Send the screenshot here

⚠️ Screenshot must show:
• Payment amount
• Transaction time

📤 Please send your screenshot now:
```

### 收到截图后
```
✅ Screenshot received!

🎮 Please enter your Teen Patti Game ID:
(You can find it in your game profile)

💡 Example: 1234567
```

### 提交成功
```
✅ Application Submitted!

📋 Application Details:
━━━━━━━━━━━━━━━
🎮 Game ID: 1234567
📸 Screenshot: Uploaded
━━━━━━━━━━━━━━━

⏳ Status: Pending admin review
⏱️ Usually takes 5-30 minutes

📢 After approval, you will receive:
• Lottery numbers based on your recharge amount
• Entry into today's draw at 21:00 IST
```

### 审核通过
```
🎉 Application Approved!

💰 Amount: ₹500
🏆 Tier: ⭐⭐ Gold
🎁 You received 6 lottery numbers:
┌─────────────────────────┐
│ G-0001 G-0002 G-0003    │
│ G-0004 G-0005 G-0006    │
└─────────────────────────┘

⚖️ Weight: 4x each
📊 Total numbers: 6
⚡ Total weight: 24x

💰 Today's Pool: ₹2,000
⏰ Draw Time: Tonight 21:00 IST

📌 Save your numbers!
```

---

## 🔧 技术变更

### 状态管理更新
```javascript
// 新状态管理
const userState = new Map();        // 用户当前步骤
const pendingScreenshots = new Map(); // 待处理截图

// 状态流程
waiting_screenshot → waiting_gameid → (submit) → done
```

### 修改的文件
1. **bot.js** - 重写流程逻辑
2. **rechargeService.js** - 添加 `submitRechargeForReview()`

---

## 🎯 管理员审核界面

管理员收到通知：
```
🔔 New Recharge Pending Review!

👤 User: 123456789
🎮 Game ID: 1234567
🆔 Ref: XXXXXXXX

💰 Select Amount to Approve:
[✅ ₹100] [✅ ₹300] [✅ ₹500]
[✅ ₹1K]  [✅ ₹2K]  [✅ ₹5K]
[✅ ₹10K] [✅ ₹20K]
[❌ Reject]
```

---

## ⚠️ 注意事项

1. **游戏ID唯一性** - 同一个游戏ID不能重复注册
2. **截图要求** - 必须显示支付金额和时间
3. **审核时效** - 通常5-30分钟
4. **号码发放** - 根据管理员确认的实际金额发放

---

## 🧪 测试检查清单

- [ ] /start 显示欢迎界面
- [ ] Join Now 按钮正常
- [ ] 发送截图后提示输入GameID
- [ ] 输入7位数字GameID后提交
- [ ] 提交成功显示等待消息
- [ ] 管理员收到审核通知
- [ ] 管理员可选择金额通过
- [ ] 用户收到号码通知
- [ ] 拒绝流程正常

---

**更新者**: 兔崽子 🐰  
**日期**: 2026-03-15
