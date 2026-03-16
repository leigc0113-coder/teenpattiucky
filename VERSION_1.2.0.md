# TeenPatti Lucky Bot - Version 1.2.0

## 保存日期
2026-03-16 22:00 GMT+8

## 版本说明
此版本为稳定运行版本，已部署到 Railway 并正常运行。

## 用户流程
1. 用户点击 **🎮 Join Now**
2. 输入 **Game ID**（7位数字）
3. 发送 **截图**（游戏ID截图或充值截图）
4. **管理员审核**
5. 审核通过后 **发放号码**

## 核心文件（19个）
- bot.js - 主程序
- config.js - 配置
- cronJobs.js - 定时任务
- database.js - 数据库
- dateUtils.js - 日期工具
- checkinService.js - 签到服务
- rechargeService.js - 充值服务
- adminCommands.js - 管理员命令
- adminGiveNumbers.js - 管理员发号
- drawNotification.js - 开奖通知
- drawService.js - 开奖服务
- inviteService.js - 邀请服务
- lotteryService.js - 抽奖服务
- messages.js - 消息模板
- numberTierService.js - 号码档位
- poolService.js - 奖池服务
- tierService.js - 等级服务
- userService.js - 用户服务
- vipService.js - VIP服务

## 配置文件
- package.json - 依赖配置
- .env.example - 环境变量示例

## 部署配置
- 平台：Railway
- 状态：✅ 正常运行
- 错误：无

## 功能特性
- ✅ 10个等级身份系统
- ✅ VIP特权体系
- ✅ 每日21:00 IST开奖
- ✅ 邀请裂变系统
- ✅ 管理员审核流程
- ✅ 等级权重系统
- ✅ 自动中奖通知

## 注意事项
1. 确保 Railway 环境变量 BOT_TOKEN 已设置
2. 确保 ADMIN_IDS 已配置管理员ID
3. 确保 GAME_DOWNLOAD_URL 已设置游戏下载链接

## 备份建议
定期备份 data/ 目录中的数据库文件。
