/**
 * ============================================================
 * IST 时间修复指南
 * ============================================================
 * 
 * 问题：服务器使用 UTC 时间，但业务逻辑需要 IST (印度时间)
 * UTC+5:30
 * 
 * 解决方案：使用 timeUtil.js 统一处理
 */

// 旧的错误用法（UTC）：
const today = new Date().toISOString().split('T')[0];  // "2026-03-19" UTC

// 新的正确用法（IST）：
const TimeUtil = require('./timeUtil');
const today = TimeUtil.getTodayIST();  // "2026-03-20" IST

// ========================================
// 需要修改的文件清单
// ========================================

// 1. adminCommands.js - ✅ 已修复
// 2. adminGiveNumbers.js - ✅ 已添加 TimeUtil
// 3. autoGrowthSystem.js - 需要修复
// 4. autoPost.js - 需要修复  
// 5. bot.js - 已有 getTodayIST()，检查其他地方
// 6. rechargeService.js - ✅ 已修复

// ========================================
// 修复示例
// ========================================

// 示例1：日期比较
// 旧：
if (r.createdAt.startsWith(new Date().toISOString().split('T')[0]))
// 新：
if (r.createdAt.startsWith(TimeUtil.getTodayIST()))

// 示例2：记录创建时间（保持 ISO 格式存储）
// 旧：
createdAt: new Date().toISOString()
// 新（如果需要显示 IST）：
createdAt: new Date().toISOString()  // 存储仍用 UTC ISO，显示时转换

// 示例3：获取今日充值
// 旧：
const today = new Date().toISOString().split('T')[0];
const todayAmount = recharges.filter(r => r.createdAt.startsWith(today));
// 新：
const today = TimeUtil.getTodayIST();
const todayAmount = recharges.filter(r => r.createdAt.startsWith(today));

// ========================================
// 关键检查点
// ========================================

// 1. 奖池计算 - 使用 IST 日期
// 2. 充值统计 - 使用 IST 日期
// 3. 开奖时间 - 21:00 IST
// 4. VIP 检查 - 基于 IST 日期
// 5. 定时任务 - cron 使用 IST 时区
