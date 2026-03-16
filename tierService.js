/**
 * ============================================================
 * 等级身份服务模块 (tierService.js)
 * ============================================================
 * 
 * 处理等级身份相关的业务逻辑：
 * - 等级号码分配（10个全球唯一的稀缺号码）
 * - 等级晋升（累计充值达标后升级）
 * - 冷静期管理（号码回收机制）
 */

const Database = require('./database');
const CONFIG = require('./config');

class TierService {

    /**
     * 获取可用的最低等级号码
     * 按等级从低到高查找空闲号码
     * 
     * @returns {Object|null} 可用的等级号码或null
     */
    async getAvailableTierNumber() {
        const pool = await Database.findAll('tierNumberPool', { status: 'FREE' });
        if (pool.length === 0) return null;
        
        // 按等级排序，返回最低的
        return pool.sort((a, b) => a.level - b.level)[0];
    }

    /**
     * 为用户分配等级号码
     * 分配当前可用的最低等级号码
     * 
     * @param {string} userId - 用户ID
     * @returns {Object|null} 创建的等级身份或null（如果没有空闲号码）
     */
    async assignTierNumber(userId) {
        // 获取可用号码
        const tierNum = await this.getAvailableTierNumber();
        if (!tierNum) return null;

        const now = new Date().toISOString();
        
        // 创建等级身份记录
        const identity = {
            id: `tier_${userId}`,
            userId,
            level: tierNum.level,
            tierName: tierNum.tierName,
            number: tierNum.number,
            displayName: `${tierNum.tierName}·${tierNum.number}`,
            totalRecharge: 0,           // 累计充值金额
            isVIP: false,               // VIP状态
            consecutiveDays: 0,         // VIP连续达标天数
            lastQualifiedDate: null,    // 最后达标日期
            status: 'OCCUPIED',         // 状态
            createdAt: now
        };

        // 保存等级身份
        await Database.insert('tierIdentities', identity);

        // 更新号码池状态
        await Database.update('tierNumberPool', tierNum.id, {
            status: 'OCCUPIED',
            userId,
            assignedAt: now
        });

        return identity;
    }

    /**
     * 获取用户的等级身份
     * @param {string} userId - 用户ID
     * @returns {Object|null} 等级身份或null
     */
    async getTierIdentity(userId) {
        return await Database.findOne('tierIdentities', { userId });
    }

    /**
     * 检查用户是否可以升级
     * 根据累计充值金额判断可晋升到的等级
     * 
     * @param {string} userId - 用户ID
     * @returns {number|null} 目标等级或null（不可升级）
     */
    async checkLevelUp(userId) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return null;

        const currentLevel = identity.level;
        const totalRecharge = identity.totalRecharge;

        // 检查可以升到哪个等级（支持跨级晋升）
        let targetLevel = currentLevel;
        for (let level = currentLevel + 1; level <= 10; level++) {
            if (totalRecharge >= CONFIG.TIER_THRESHOLDS[level]) {
                targetLevel = level;
            } else {
                break;
            }
        }

        return targetLevel > currentLevel ? targetLevel : null;
    }

    /**
     * 执行等级晋升
     * 将用户从当前等级晋升到目标等级
     * 
     * @param {string} userId - 用户ID
     * @param {number} targetLevel - 目标等级
     * @returns {boolean} 是否成功
     */
    async levelUp(userId, targetLevel) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return false;

        const [tierName, number] = CONFIG.TIER_NAMES[targetLevel];
        const targetNumId = `${tierName}·${number}`;
        
        // 检查目标等级号码是否可用
        const targetNum = await Database.findById('tierNumberPool', targetNumId);
        if (!targetNum || targetNum.status !== 'FREE') {
            return false;
        }

        const now = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];

        // ===== 原号码进入冷静期 =====
        const oldNumId = `${identity.tierName}·${identity.number}`;
        await Database.update('tierNumberPool', oldNumId, {
            status: 'COOLING',
            userId: null,
            coolingEndDate: this.addDays(today, CONFIG.COOLING_PERIOD_DAYS)
        });

        // ===== 分配新号码 =====
        await Database.update('tierNumberPool', targetNumId, {
            status: 'OCCUPIED',
            userId,
            assignedAt: now
        });

        // ===== 更新用户等级身份 =====
        const updates = {
            level: targetLevel,
            tierName,
            number,
            displayName: `${tierName}·${number}`
        };
        
        // 如果已是VIP，更新VIP显示名称
        if (identity.isVIP) {
            updates.displayName = `VIP·${tierName}·${number}`;
        }
        
        await Database.update('tierIdentities', identity.id, updates);

        return true;
    }

    /**
     * 累加充值金额并检查升级
     * 
     * @param {string} userId - 用户ID
     * @param {number} amount - 充值金额
     * @returns {Object} 结果 { upgraded: boolean, newLevel?: number, totalRecharge: number }
     */
    async addRecharge(userId, amount) {
        const identity = await this.getTierIdentity(userId);
        if (!identity) return { upgraded: false, totalRecharge: 0 };

        // 累加充值金额
        const newTotal = identity.totalRecharge + amount;
        await Database.update('tierIdentities', identity.id, {
            totalRecharge: newTotal
        });

        // 检查是否可以升级
        const targetLevel = await this.checkLevelUp(userId);
        if (targetLevel) {
            await this.levelUp(userId, targetLevel);
            return { 
                upgraded: true, 
                newLevel: targetLevel,
                totalRecharge: newTotal 
            };
        }

        return { 
            upgraded: false, 
            totalRecharge: newTotal 
        };
    }

    /**
     * 检查冷静期并释放号码
     * 定时任务调用，将已过冷静期的号码释放回号码池
     * @returns {number} 释放的号码数量
     */
    async checkCoolingPeriod() {
        const today = new Date().toISOString().split('T')[0];
        const coolingNumbers = await Database.findAll('tierNumberPool', { status: 'COOLING' });
        let releasedCount = 0;

        for (const num of coolingNumbers) {
            if (num.coolingEndDate && num.coolingEndDate <= today) {
                // 释放号码
                await Database.update('tierNumberPool', num.id, {
                    status: 'FREE',
                    userId: null,
                    coolingEndDate: null
                });
                console.log(`✅ 号码 ${num.id} 冷静期结束，已释放回号码池`);
                releasedCount++;
            }
        }
        return releasedCount;
    }

    /**
     * 辅助函数：给日期增加天数
     * @param {string} dateStr - 日期字符串 YYYY-MM-DD
     * @param {number} days - 增加的天数
     * @returns {string} 新的日期字符串
     */
    addDays(dateStr, days) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    /**
     * 获取候补队列中的用户
     * @returns {Array} 候补用户列表
     */
    async getWaitlistUsers() {
        // 获取所有已注册但没有等级身份的用户
        const allUsers = await Database.getAll('users');
        const tierUsers = await Database.getAll('tierIdentities');
        const tierUserIds = new Set(tierUsers.map(t => t.userId));
        
        return allUsers.filter(u => !tierUserIds.has(u.id));
    }
}

// 导出单例实例
module.exports = new TierService();
