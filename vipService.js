/**
 * ============================================================
 * VIP服务模块 (vipService.js) - FIXED & ENHANCED
 * ============================================================
 * 
 * 修复内容：
 * 1. 修复连续天数清零逻辑，避免不必要的重置
 * 2. 添加更好的日期比较逻辑
 * 3. 添加日志记录
 */

const Database = require('./database');
const CONFIG = require('./config');

class VIPService {

    /**
     * 检查用户某日是否达标
     * 
     * @param {string} userId - 用户ID
     * @param {string} checkDate - 检查日期 YYYY-MM-DD
     * @returns {boolean} 是否达标
     */
    async checkDailyQualification(userId, checkDate) {
        // 查询指定日期的已审核充值
        const recharges = await Database.findAll('recharges', {
            userId,
            status: 'APPROVED'
        });

        // 筛选指定日期的充值
        const dayRecharges = recharges.filter(r => {
            const rechargeDate = r.createdAt.split('T')[0];
            return rechargeDate === checkDate;
        });

        // 计算总额
        const total = dayRecharges.reduce((sum, r) => sum + r.amount, 0);
        return total >= CONFIG.VIP.DAILY_THRESHOLD;
    }

    /**
     * 处理VIP资格检查
     * 每日定时任务调用
     * 
     * @param {string} userId - 用户ID
     * @param {string} checkDate - 检查日期（昨日）
     * @returns {Object} 结果 { isQualified, consecutiveDays, isVIP }
     */
    async processVIPCheck(userId, checkDate) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (!identity || identity.isVIP) return null;

        // 检查指定日期是否达标
        const isQualified = await this.checkDailyQualification(userId, checkDate);

        let consecutiveDays = identity.consecutiveDays || 0;
        const lastQualifiedDate = identity.lastQualifiedDate;

        if (isQualified) {
            // 检查是否是连续的一天（昨天刚达标过）
            if (lastQualifiedDate) {
                const lastDate = new Date(lastQualifiedDate);
                const checkDateObj = new Date(checkDate);
                const diffDays = (checkDateObj - lastDate) / (1000 * 60 * 60 * 24);
                
                if (diffDays === 1) {
                    // 连续达标
                    consecutiveDays += 1;
                } else if (diffDays > 1) {
                    // 中间有间断，重新计数
                    consecutiveDays = 1;
                }
                // 同一天重复检查不增加计数
            } else {
                consecutiveDays = 1;
            }
        }
        // 注意：未达标时不立即清零，等待断连续续判断

        const updates = {
            consecutiveDays,
            lastQualifiedDate: isQualified ? checkDate : lastQualifiedDate
        };

        // 检查是否达到5天
        if (consecutiveDays >= CONFIG.VIP.CONSECUTIVE_DAYS) {
            updates.isVIP = true;
            updates.vipObtainDate = new Date().toISOString();
            // 更新显示名称，加上VIP前缀
            updates.displayName = `VIP·${identity.tierName}·${identity.number}`;
            console.log(`[VIP] User ${userId} achieved VIP status!`);
        }

        await Database.update('tierIdentities', identity.id, updates);
        
        return { 
            isQualified, 
            consecutiveDays, 
            isVIP: consecutiveDays >= CONFIG.VIP.CONSECUTIVE_DAYS 
        };
    }

    /**
     * 检查并更新VIP连续天数（用于定时任务）
     * 如果超过一天未达标，则清零
     * 
     * @param {string} userId - 用户ID
     * @param {string} today - 今天日期
     */
    async checkAndResetVIPStreak(userId, today) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (!identity || identity.isVIP) return;

        const lastQualifiedDate = identity.lastQualifiedDate;
        if (!lastQualifiedDate) return;

        const lastDate = new Date(lastQualifiedDate);
        const todayObj = new Date(today);
        const diffDays = (todayObj - lastDate) / (1000 * 60 * 60 * 24);

        // 超过2天未达标则清零（给一天缓冲）
        if (diffDays > 2) {
            await Database.update('tierIdentities', identity.id, {
                consecutiveDays: 0,
                lastQualifiedDate: null
            });
            console.log(`[VIP] User ${userId} streak reset due to inactivity`);
        }
    }

    /**
     * 获取VIP进度
     * 用于显示在用户账户页面
     * 
     * @param {string} userId - 用户ID
     * @returns {Object} VIP进度信息
     */
    async getVIPProgress(userId) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (!identity) return { isVIP: false };

        // 已是VIP
        if (identity.isVIP) {
            return { 
                isVIP: true,
                obtainDate: identity.vipObtainDate
            };
        }

        const today = new Date().toISOString().split('T')[0];
        
        // 获取今日充值金额
        const recharges = await Database.findAll('recharges', {
            userId,
            status: 'APPROVED'
        });

        const todayRecharges = recharges.filter(r => r.createdAt.startsWith(today));
        const todayAmount = todayRecharges.reduce((sum, r) => sum + r.amount, 0);

        return {
            isVIP: false,
            consecutiveDays: identity.consecutiveDays || 0,
            targetDays: CONFIG.VIP.CONSECUTIVE_DAYS,
            todayRecharge: todayAmount,
            threshold: CONFIG.VIP.DAILY_THRESHOLD,
            remaining: Math.max(0, CONFIG.VIP.DAILY_THRESHOLD - todayAmount)
        };
    }

    /**
     * 批量处理所有用户的VIP检查
     * 每日定时任务调用（检查昨日）
     * 
     * @param {string} checkDate - 检查日期（昨日）
     * @returns {Array} 处理结果列表
     */
    async batchVIPCheck(checkDate) {
        const identities = await Database.findAll('tierIdentities', { isVIP: false });
        const results = [];

        for (const identity of identities) {
            const result = await this.processVIPCheck(identity.userId, checkDate);
            if (result) {
                results.push({
                    userId: identity.userId,
                    ...result
                });
            }
        }

        console.log(`[VIP] Batch check completed for ${results.length} users`);
        return results;
    }

    /**
     * 批量检查并重置过期的VIP连续天数
     * @param {string} today - 今天日期
     */
    async batchResetExpiredStreaks(today) {
        const identities = await Database.findAll('tierIdentities', { isVIP: false });
        
        for (const identity of identities) {
            await this.checkAndResetVIPStreak(identity.userId, today);
        }
    }

    /**
     * 获取所有VIP用户
     * @returns {Array} VIP用户列表
     */
    async getAllVIPUsers() {
        return await Database.findAll('tierIdentities', { isVIP: true });
    }

    /**
     * 手动授予VIP（管理员功能）
     * @param {string} userId - 用户ID
     */
    async grantVIP(userId) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (!identity) return false;

        await Database.update('tierIdentities', identity.id, {
            isVIP: true,
            vipObtainDate: new Date().toISOString(),
            displayName: `VIP·${identity.tierName}·${identity.number}`
        });

        console.log(`[VIP] Manually granted to user ${userId}`);
        return true;
    }
    
    /**
     * 撤销VIP资格（管理员功能）
     * @param {string} userId - 用户ID
     */
    async revokeVIP(userId) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (!identity || !identity.isVIP) return false;

        await Database.update('tierIdentities', identity.id, {
            isVIP: false,
            vipObtainDate: null,
            displayName: `${identity.tierName}·${identity.number}`,
            consecutiveDays: 0
        });

        console.log(`[VIP] Revoked from user ${userId}`);
        return true;
    }
}

// 导出单例实例
module.exports = new VIPService();
