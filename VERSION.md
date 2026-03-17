# 版本记录

## v1.5.0-stable (当前稳定版本)

**版本号:** d078038  
**标签:** v1.5.0-stable  
**日期:** 2026-03-17  
**状态:** ✅ 稳定运行

---

## 功能清单

### ✅ 核心功能
- [x] 双轨制参与流程（FREE + Recharge）
- [x] 档位选择系统（₹100 - ₹20,000）
- [x] 管理员审核系统
- [x] 号码生成系统（FREE/SILVER/GOLD/DIAMOND/CROWN/VIP）
- [x] 等级身份系统（Bronze~Star）
- [x] 自动升级机制

### ✅ 用户功能
- [x] 英文界面
- [x] 注册流程（/start）
- [x] 每日签到
- [x] 邀请好友奖励
- [x] 我的账户（My Account）
- [x] Current Pool（实时奖池）
- [x] Help菜单（英文）

### ✅ 奖池系统
- [x] 奖池计算（保底₹1,000 + 抽成10-15% + 周末30%）
- [x] 实时更新
- [x] 奖金分配（一等奖40% + 二等奖20%×2 + 三等奖20%）

### ✅ 邀请系统
- [x] 邀请码生成
- [x] 注册奖励（2 Silver）
- [x] 首充奖励（2 Gold）
- [x] 邀请统计

### ✅ 管理员功能
- [x] 管理员面板（中文按钮）
- [x] 待审核列表
- [x] 一键批准/拒绝
- [x] 批量操作
- [x] 今日统计
- [x] 手动开奖

### ✅ 开奖系统
- [x] 手动开奖（管理员）
- [x] 自动开奖（21:00 IST）- 待测试
- [x] 中奖私信通知
- [x] 未中奖私信通知
- [x] 频道/群组公告

---

## 版本对比

| 版本 | 功能 | 状态 |
|------|------|------|
| v1.3.0 | 基础功能 | 旧版本 |
| v1.5.0 | 英文界面 + 完善功能 | ✅ 当前稳定版 |
| v2.0.0 | 历史记录 + 菜单重构 | ⏸️ 开发中（已回退） |

---

## 回退记录

**回退原因:**
- 菜单系统重构出现问题
- 历史记录功能未完全测试
- 保持系统稳定性优先

**回退到:** d078038

---

## GitHub 链接

- **代码:** https://github.com/leigc0113-coder/teenpattiucky
- **稳定版本标签:** https://github.com/leigc0113-coder/teenpattiucky/releases/tag/v1.5.0-stable
- **提交记录:** d078038

---

## 部署命令

```bash
# 拉取稳定版本
git clone https://github.com/leigc0113-coder/teenpattiucky.git
cd teenpatti-lucky-bot
git checkout v1.5.0-stable

# 安装依赖
npm install

# 启动
npm start
```

---

## 备份信息

**本地备份路径:**
```
C:\Users\Admin\Desktop\teenpatti-lucky-bot
```

**关键文件:**
- bot.js - 主程序
- config.js - 配置
- adminCommands.js - 管理员功能
- lotteryService.js - 抽奖服务
- tierService.js - 等级服务
- drawService.js - 开奖服务

---

**记录时间:** 2026-03-17 23:03  
**记录人:** AI Assistant  
**下次更新:** 待测试稳定后再添加新功能
