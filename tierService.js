/**
 * ============================================================
 * 等级服务模块 v2.0 (tierService.js)
 * ============================================================
 * 
 * 重构内容：
 * 1. 人人有等级 - 无数量限制
 * 2. 自动升级检测
 * 3. 累计充值追踪
 * 4. 移除"全球唯一号码"限制
 */

const Database = require('./database');
const TIER_CONFIG = require('./tierConfig');

class TierService {

    /**
     * 为用户创建等级身份（注册时调用）
     * 人人有等级，永不落空
     * 
     * @param {string} userId - 用户ID
     * @returns {Object} 创建的等级身份
     */
    async createTierIdentity(userId) {
        const now = new Date().toISOString();
        const defaultLevel = TIER_CONFIG.DEFAULT_LEVEL;
        const levelConfig = TIER_CONFIG.LEVELS[defaultLevel];

        const identity = {
            id: `tier_${userId}`,
            userId: userId,
            level: defaultLevel,
            name: levelConfig.name,
            displayName: levelConfig.displayName,
            emoji: levelConfig.emoji,
            totalRecharge: 0,
            isVIP: false,
            consecutiveVIPDays: 0,
            lastVIPDate: null,
            createdAt: now,
            updatedAt: now
        };

        await Database.insert('tierIdentities', identity);
        console.log(`[TIER] Created identity for user ${userId}: ${identity.displayName}`);
        
        return identity;
    }

    /**
     * 获取用户等级身份
     * 如果不存在，自动创建
     * 
     * @param {string} userId - 用户ID
     * @returns {Object|null} 等级身份
     */
    async getTierIdentity(userId) {
        let identity = await Database.findOne('tierIdentities', { userId });
        
        // 如果不存在，自动创建（兼容旧数据）
        if (!identity) {
            console.log(`[TIER] Identity not found for ${userId}, creating...`);
            identity = await this.createTierIdentity(userId);
        }
        
        return identity;
    }

    /**
     * 累加充值金额并检查升级
     * 
     * @param {string} userId - 用户ID
     * @param {number} amount - 充值金额
     * @returns {Object} 结果 { upgraded: boolean, newLevel?: number, identity: Object }
     */
    async addRecharge(userId, amount) {
        let identity = await this.getTierIdentity(userId);
        if (!identity) {
            identity = await this.createTierIdentity(userId);
        }

        // 累加充值金额
        const newTotal = identity.totalRecharge + amount;
        
        // 更新累计充值
        await Database.update('tierIdentities', identity.id, {
            totalRecharge: newTotal,
            updatedAt: new Date().toISOString()
        });

        // 检查是否可以升级
        const targetLevel = await this.checkLevelUp(userId);
        if (targetLevel) {
            const upgradedIdentity = await this.levelUp(userId, targetLevel);
            return { 
                upgraded: true, 
                newLevel: targetLevel,
                identity: upgradedIdentity 
            };
        }

        // 重新获取更新后的身份
        identity = await this.getTierIdentity(userId);
        return { 
            upgraded: false, 
            identity 
        };
    }

    /**
     * 检查用户是否可以升级
     * 
     * @param {string} userId - 用户ID
     * @returns {number|null} 目标等级或null
     */
    async checkLevelUp(userId) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return null;

        const currentLevel = identity.level;
        const totalRecharge = identity.totalRecharge;

        // 检查可以升到哪个等级（支持跨级晋升）
        let targetLevel = currentLevel;
        for (let level = currentLevel + 1; level <= TIER_CONFIG.MAX_LEVEL; level++) {
            const threshold = TIER_CONFIG.LEVELS[level].threshold;
            if (totalRecharge >= threshold) {
                targetLevel = level;
            } else {
                break;
            }
        }

        return targetLevel > currentLevel ? targetLevel : null;
    }

    /**
     * 执行等级晋升
     * 
     * @param {string} userId - 用户ID
     * @param {number} targetLevel - 目标等级
     * @returns {Object} 更新后的等级身份
     */
    async levelUp(userId, targetLevel) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return null;

        const levelConfig = TIER_CONFIG.LEVELS[targetLevel];
        
        await Database.update('tierIdentities', identity.id, {
            level: targetLevel,
            name: levelConfig.name,
            displayName: levelConfig.displayName,
            emoji: levelConfig.emoji,
            updatedAt: new Date().toISOString()
        });

        console.log(`[TIER] User ${userId} upgraded to ${levelConfig.displayName}`);
        
        return await this.getTierIdentity(userId);
    }

    /**
     * 获取升级进度信息
     * 
     * @param {string} userId - 用户ID
     * @returns {Object} 进度信息
     */
    async getUpgradeProgress(userId) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return null;

        const currentLevel = identity.level;
        const totalRecharge = identity.totalRecharge;

        // 如果已满级
        if (currentLevel >= TIER_CONFIG.MAX_LEVEL) {
            return {
                currentLevel,
                displayName: identity.displayName,
                isMaxLevel: true,
                message: '🌟 您已达到最高等级！'
            };
        }

        // 下一等级门槛
        const nextLevel = currentLevel + 1;
        const nextThreshold = TIER_CONFIG.LEVELS[nextLevel].threshold;
        const remaining = nextThreshold - totalRecharge;
        const progress = Math.min((totalRecharge / nextThreshold) * 100, 100);

        return {
            currentLevel,
            displayName: identity.displayName,
            nextLevel,
            nextDisplayName: TIER_CONFIG.LEVELS[nextLevel].displayName,
            nextThreshold,
            remaining,
            progress: Math.floor(progress),
            isMaxLevel: false
        };
    }

    /**
     * 获取用户奖池抽成率
     * 
     * @param {string} userId - 用户ID
     * @returns {number} 抽成率 (0.10 或 0.15)
     */
    async getPoolRate(userId) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return 0.15; // 默认15%

        const levelConfig = TIER_CONFIG.LEVELS[identity.level];
        return levelConfig ? levelConfig.poolRate : 0.15;
    }

    /**
     * 处理VIP检查（保持原有逻辑）
     * 
     * @param {string} userId - 用户ID
     * @param {string} today - 日期
     */
    async processVIPCheck(userId, today) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return;

        // 如果已经是永久VIP，跳过
        if (identity.isVIP && TIER_CONFIG.VIP.validForever) {
            return;
        }

        // 检查今日充值是否达标
        const recharges = await Database.findAll('recharges', {
            userId,
            status: 'APPROVED'
        });

        const todayRecharge = recharges
            .filter(r => r.createdAt.startsWith(today))
            .reduce((sum, r) => sum + r.amount, 0);

        if (todayRecharge >= TIER_CONFIG.VIP.dailyThreshold) {
            // 更新连续天数
            const lastDate = identity.lastVIPDate;
            const isConsecutive = lastDate && this.isYesterday(lastDate, today);
            
            const newConsecutiveDays = isConsecutive 
                ? identity.consecutiveVIPDays + 1 
                : 1;

            const updates = {
                consecutiveVIPDays: newConsecutiveDays,
                lastVIPDate: today
            };

            // 达到连续天数，升级为VIP
            if (newConsecutiveDays >= TIER_CONFIG.VIP.consecutiveDays) {
                updates.isVIP = true;
                console.log(`[VIP] User ${userId} became VIP!`);
            }

            await Database.update('tierIdentities', identity.id, updates);
        }
    }

    /**
     * 检查日期是否连续
     */
    isYesterday(lastDate, today) {
        const last = new Date(lastDate);
        const now = new Date(today);
        const diffTime = now - last;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays === 1;
    }

    /**
     * 获取升级提示消息
     * 
     * @param {number} level - 等级
     * @returns {string} 提示消息
     */
    getUpgradeMessage(level) {
        return TIER_CONFIG.UPGRADE_MESSAGES[level] || '🎉 恭喜升级！';
    }
}

// 导出单例实例
module.exports = new TierService();
