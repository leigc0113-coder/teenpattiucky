/**
 * ============================================================
 * 奖池服务模块 (poolService.js)
 * ============================================================
 * 
 * 处理奖池计算相关的业务逻辑：
 * - 每日奖池计算
 * - 充值贡献统计
 * - 安全边界应用（最低/最高限制）
 * 
 * 奖池公式：
 * 奖池 = 保底(₹1,000) + 充值抽成(15%) + 节日加成(周末30%)
 */

const Database = require('./database');
const CONFIG = require('./config');

class PoolService {

    /**
     * 计算每日奖池
     * 
     * @param {string} calcDate - 计算日期 YYYY-MM-DD
     * @returns {Object} 奖池对象
     */
    async calculateDailyPool(calcDate) {
        // 检查是否已存在
        let pool = await Database.findOne('pools', { date: calcDate });
        
        if (pool && pool.locked) {
            return pool;  // 已锁定，直接返回
        }

        if (!pool) {
            pool = {
                id: `pool_${calcDate}`,
                date: calcDate
            };
        }

        // 统计当日充值
        const recharges = await Database.findAll('recharges', { status: 'APPROVED' });
        const dayRecharges = recharges.filter(r => r.createdAt.startsWith(calcDate));

        let regularRecharge = 0;  // 普通号码用户充值
        let tierRecharge = 0;     // 等级号码用户充值

        for (const r of dayRecharges) {
            const identity = await Database.findOne('tierIdentities', { userId: r.userId });
            if (identity) {
                tierRecharge += r.amount;
            } else {
                regularRecharge += r.amount;
            }
        }

        // 计算各部分
        const base = CONFIG.POOL.BASE_AMOUNT;
        const regularContribution = regularRecharge * CONFIG.POOL.REGULAR_RATE;
        const tierContribution = tierRecharge * CONFIG.POOL.TIER_RATE;
        
        // 节日加成
        const date = new Date(calcDate);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;  // 0=周日, 6=周六
        const bonusRate = isWeekend ? CONFIG.POOL.WEEKEND_BONUS : 0;
        
        const subtotal = base + regularContribution + tierContribution;
        const bonus = subtotal * bonusRate;

        // 计算最终奖池
        let finalAmount = subtotal + bonus;

        // ===== 应用安全边界 =====
        
        // 获取参与人数
        const participantCount = await this.getParticipantCount(calcDate);
        
        // 最低边界：不低于保底，不低于参与人数×2
        const minPool = Math.max(finalAmount, participantCount * 2, CONFIG.POOL.MIN_POOL);
        
        // 最高边界：封顶
        const maxPool = Math.min(minPool, CONFIG.POOL.MAX_POOL);

        pool.baseAmount = base;
        pool.regularContribution = regularContribution;
        pool.tierContribution = tierContribution;
        pool.bonus = bonus;
        pool.finalAmount = Math.floor(maxPool);
        pool.participantCount = participantCount;
        pool.locked = false;
        pool.createdAt = new Date().toISOString();

        // 保存奖池
        if (pool.id) {
            const existing = await Database.findById('pools', pool.id);
            if (existing) {
                await Database.update('pools', pool.id, pool);
            } else {
                await Database.insert('pools', pool);
            }
        } else {
            await Database.insert('pools', pool);
        }

        return pool;
    }

    /**
     * 锁定奖池
     * 开奖前调用，锁定后不可修改
     * 
     * @param {string} poolDate - 日期
     */
    async lockPool(poolDate) {
        const pool = await Database.findOne('pools', { date: poolDate });
        if (pool) {
            await Database.update('pools', pool.id, { locked: true });
        }
    }

    /**
     * 获取参与人数
     * @param {string} date - 日期
     * @returns {number} 参与人数
     */
    async getParticipantCount(date) {
        const numbers = await Database.findAll('lotteryNumbers', {
            date,
            status: 'VALID'
        });
        
        // 去重用户数
        const userIds = new Set(numbers.map(n => n.userId));
        return userIds.size;
    }

    /**
     * 获取今日奖池
     * @returns {Object|null} 奖池对象
     */
    async getTodayPool() {
        const today = new Date().toISOString().split('T')[0];
        return await Database.findOne('pools', { date: today });
    }

    /**
     * 获取历史奖池
     * @param {number} limit - 返回数量
     * @returns {Array} 奖池列表
     */
    async getPoolHistory(limit = 7) {
        const pools = await Database.getAll('pools');
        return pools
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
}

module.exports = new PoolService();
