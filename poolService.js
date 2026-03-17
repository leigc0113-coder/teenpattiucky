/**
 * ============================================================
 * 奖池服务模块 (poolService.js) - v2.0
 * ============================================================
 * 
 * 更新内容：
 * - 使用新的等级系统（人人有等级）
 * - Bronze 等级抽成 15%，Silver+ 抽成 10%
 * - 支持无限用户
 */

const Database = require('./database');
const CONFIG = require('./config');
const TierService = require('./tierService');

class PoolService {

    /**
     * 计算每日奖池
     * 
     * @param {string} calcDate - 计算日期 YYYY-MM-DD
     * @returns {Object} 奖池对象
     */
    async calculateDailyPool(calcDate) {
        // 检查是否已存在且已锁定
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

        // 统计当日充值（处理时区问题）
        const recharges = await Database.findAll('recharges', { status: 'APPROVED' });
        
        // 将 IST 日期转换为当天的 UTC 时间范围
        const istDate = new Date(calcDate + 'T00:00:00+05:30');
        const istDateNext = new Date(calcDate + 'T23:59:59+05:30');
        
        const dayRecharges = recharges.filter(r => {
            const rechargeDate = new Date(r.createdAt);
            return rechargeDate >= istDate && rechargeDate <= istDateNext;
        });

        // 新等级系统：
        // Bronze (Level 1): 15% 抽成
        // Silver+ (Level 2-6): 10% 抽成
        let bronzeRecharge = 0;   // Bronze 等级充值（15%）
        let silverRecharge = 0;   // Silver+ 等级充值（10%）

        console.log(`[POOL] Found ${dayRecharges.length} recharges for ${calcDate}`);

        for (const r of dayRecharges) {
            const poolRate = await TierService.getPoolRate(r.userId);
            console.log(`[POOL] User ${r.userId}: amount=₹${r.amount}, poolRate=${poolRate}`);
            
            if (poolRate <= 0.10) {
                // Silver+ 等级（10%抽成）
                silverRecharge += r.amount;
                console.log(`[POOL]   -> Silver+ user (10% rate)`);
            } else {
                // Bronze 等级（15%抽成）
                bronzeRecharge += r.amount;
                console.log(`[POOL]   -> Bronze user (15% rate)`);
            }
        }

        // 计算各部分
        const base = CONFIG.POOL.BASE_AMOUNT;
        const bronzeContribution = bronzeRecharge * 0.15;  // Bronze 15%
        const silverContribution = silverRecharge * 0.10;  // Silver+ 10%
        
        console.log(`[POOL] Calculation: base=₹${base}, bronze=₹${bronzeRecharge}(₹${bronzeContribution}), silver=₹${silverRecharge}(₹${silverContribution})`);
        
        // 节日加成
        const date = new Date(calcDate);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const bonusRate = isWeekend ? CONFIG.POOL.WEEKEND_BONUS : 0;
        
        const subtotal = base + bronzeContribution + silverContribution;
        const bonus = subtotal * bonusRate;

        // 计算最终奖池
        let finalAmount = subtotal + bonus;

        // ===== 应用安全边界 =====
        
        // 获取参与人数
        const participantCount = await this.getParticipantCount(calcDate);
        
        // 最低边界
        const minPool = Math.max(finalAmount, participantCount * 2, CONFIG.POOL.MIN_POOL);
        
        // 最高边界
        const maxPool = Math.min(minPool, CONFIG.POOL.MAX_POOL);

        pool.baseAmount = base;
        pool.bronzeContribution = bronzeContribution;
        pool.silverContribution = silverContribution;
        pool.bronzeRecharge = bronzeRecharge;
        pool.silverRecharge = silverRecharge;
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
     * @param {string} date - 日期 (IST格式 YYYY-MM-DD)
     * @returns {number} 参与人数
     */
    async getParticipantCount(date) {
        // 将 IST 日期转换为当天的 UTC 时间范围
        const istDate = new Date(date + 'T00:00:00+05:30');
        const istDateNext = new Date(date + 'T23:59:59+05:30');
        
        const numbers = await Database.getAll('lotteryNumbers');
        
        // 过滤当天的号码（按创建时间）
        const dayNumbers = numbers.filter(n => {
            if (n.status !== 'VALID') return false;
            const numDate = new Date(n.createdAt);
            return numDate >= istDate && numDate <= istDateNext;
        });
        
        // 去重用户数
        const userIds = new Set(dayNumbers.map(n => n.userId));
        return userIds.size;
    }

    /**
     * 获取今日奖池
     * @returns {Object|null} 奖池对象
     */
    async getTodayPool() {
        // 使用与 calculateDailyPool 相同的 IST 日期格式
        const istString = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        // 格式转换: "03/17/2026" -> "2026-03-17"
        const [month, day, year] = istString.split('/');
        const today = `${year}-${month}-${day}`;
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
