/**
 * ============================================================
 * 抽奖号码服务 (lotteryService.js) - 优化版
 * ============================================================
 * 
 * 整合号码等级系统
 */

const Database = require('./database');
const NumberTierService = require('./numberTierService');
const CONFIG = require('./config');

class LotteryService {
    
    /**
     * 为用户生成号码（新版，带等级）
     * 
     * @param {string} userId - 用户ID
     * @param {number} amount - 充值金额（0表示免费）
     * @param {string} source - 来源
     * @param {string} date - 日期
     * @returns {Object} 生成的号码信息
     */
    async generateNumbers(userId, amount, source, date) {
        console.log(`[生成号码] 用户: ${userId}, 金额: ${amount}, 来源: ${source}`);
        
        // 获取号码等级配置
        const tierConfig = NumberTierService.getTierByAmount(amount);
        console.log(`[生成号码] 档位配置:`, tierConfig);
        
        // 检查VIP加成
        const identity = await Database.findOne('tierIdentities', { userId });
        let vipMultiplier = 1;
        if (identity?.isVIP) {
            vipMultiplier = CONFIG.VIP.WEIGHT_MULTIPLIER;
        }
        
        // 生成号码
        const numbers = await NumberTierService.generateTierNumbers(
            tierConfig.code,
            tierConfig.count,
            date
        );
        
        console.log(`[生成号码] 生成了 ${numbers.length} 个号码`);
        
        // 保存到数据库
        const now = new Date().toISOString();
        for (const num of numbers) {
            const record = {
                ...num,
                userId,
                source,
                finalWeight: num.weight * vipMultiplier,
                status: 'VALID',
                createdAt: now
            };
            console.log(`[生成号码] 保存号码:`, record.number);
            await Database.insert('lotteryNumbers', record);
        }
        
        return {
            tier: tierConfig,
            numbers,
            count: numbers.length,
            baseWeight: tierConfig.baseWeight,
            vipMultiplier,
            finalWeight: tierConfig.baseWeight * vipMultiplier
        };
    }
    
    /**
     * 为用户生成免费号码
     * @param {string} userId - 用户ID
     * @param {string} source - 来源
     * @param {string} date - 日期
     * @param {number} count - 数量（默认1）
     */
    async generateFreeNumbers(userId, source, date, count = 1) {
        const numbers = [];
        const now = new Date().toISOString();
        const tier = CONFIG.NUMBER_TIERS.FREE;
        
        // 获取当日最大序号
        const existing = await Database.findAll('lotteryNumbers', { date });
        const freeNumbers = existing.filter(n => n.tierCode === 'F');
        let maxSeq = 0;
        
        for (const num of freeNumbers) {
            const seq = parseInt(num.number.split('-')[1] || 0);
            if (seq > maxSeq) maxSeq = seq;
        }
        
        for (let i = 1; i <= count; i++) {
            const seq = maxSeq + i;
            const num = {
                id: `F-${date}-${seq}`,
                number: `F-${seq.toString().padStart(4, '0')}`,
                tierCode: 'F',
                tierName: tier.name,
                emoji: tier.emoji,
                weight: tier.baseWeight,
                userId,
                source,
                date,
                status: 'VALID',
                createdAt: now
            };
            
            await Database.insert('lotteryNumbers', num);
            numbers.push(num);
        }
        
        return numbers;
    }
    
    /**
     * 获取用户今日号码（带等级信息）
     * @param {string} userId - 用户ID
     * @param {string} date - 日期
     * @returns {Array} 号码列表
     */
    async getTodayNumbers(userId, date) {
        console.log(`[查询] 获取用户 ${userId} 在 ${date} 的号码`);
        
        const allNumbers = await Database.getAll('lotteryNumbers');
        const userNumbers = allNumbers.filter(n => 
            n.userId === userId && 
            n.date === date && 
            (n.status === 'VALID' || n.status === 'WON')
        );
        
        console.log(`[查询] 找到 ${userNumbers.length} 个号码`);
        return userNumbers;
    }
    
    /**
     * 获取用户号码统计（新版）
     * @param {string} userId - 用户ID
     * @param {string} date - 日期
     * @returns {Object} 统计信息
     */
    async getUserNumberStats(userId, date) {
        console.log(`[统计] 用户: ${userId}, 日期: ${date}`);
        
        const numbers = await this.getTodayNumbers(userId, date);
        console.log(`[统计] 查询到 ${numbers.length} 个号码`);
        
        const { distribution, totalWeight, totalCount } = 
            await NumberTierService.getNumberDistribution(userId, date);
        
        const prob = await NumberTierService.getWinProbability(userId, date);
        
        return {
            numbers,
            distribution,
            totalCount,
            totalWeight,
            probability: prob
        };
    }
    
    /**
     * 计算权重（考虑VIP加成）
     * @param {string} userId - 用户ID
     * @returns {number} 权重倍数
     */
    async calculateWeight(userId) {
        const identity = await Database.findOne('tierIdentities', { userId });
        if (identity?.isVIP) {
            return CONFIG.VIP.WEIGHT_MULTIPLIER;
        }
        return 1;
    }
    
    /**
     * 格式化号码展示（供消息使用）
     * @param {Array} numbers - 号码列表
     * @returns {string} 格式化文本
     */
    formatNumbersForDisplay(numbers) {
        return NumberTierService.formatNumbersDisplay(numbers, true);
    }
}

module.exports = new LotteryService();
