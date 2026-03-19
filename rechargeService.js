/**
 * ============================================================
 * 充值服务 (rechargeService.js) - UPDATED FLOW
 * ============================================================
 * 
 * 新流程支持：
 * 1. 用户发送截图
 * 2. 用户输入游戏ID
 * 3. 一起提交审核（金额为0，等待管理员确认）
 */

const Database = require('./database');
const NumberTierService = require('./numberTierService');
const CONFIG = require('./config');

class RechargeService {
    
    /**
     * 提交充值申请（新流程）
     * 截图 + 游戏ID 一起提交，金额待管理员确认
     * 
     * @param {string} userId - 用户ID
     * @param {string} screenshotUrl - 截图文件ID
     * @param {string} gameId - 游戏ID
     */
    async submitRechargeForReview(userId, screenshotUrl, gameId) {
        const recharge = {
            id: `rc_${userId}_${Date.now()}`,
            userId,
            amount: 0,              // 等待管理员确认
            gameId,                 // 存储游戏ID
            screenshotUrl,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewerId: null,
            notes: null
        };

        await Database.insert('recharges', recharge);
        console.log(`[RECHARGE] Submitted for review: ${recharge.id}, User: ${userId}, GameID: ${gameId}`);
        return recharge;
    }
    
    /**
     * 提交充值申请（旧方法保留兼容）
     */
    async submitRecharge(userId, screenshotUrl, expectedAmount = 0, tier = null) {
        // 风控检查
        const todayRecharges = await this.getTodayRecharges(userId);
        
        if (todayRecharges.length >= CONFIG.RISK.DAILY_RECHARGE_COUNT) {
            throw new Error('DAILY_LIMIT_EXCEEDED');
        }
        
        const todayTotal = todayRecharges.reduce((sum, r) => sum + (r.amount || 0), 0);
        if (todayTotal >= CONFIG.RISK.DAILY_RECHARGE_LIMIT) {
            throw new Error('DAILY_AMOUNT_EXCEEDED');
        }

        const recharge = {
            id: `rc_${userId}_${Date.now()}`,
            userId,
            amount: 0,
            expectedAmount,
            tier,
            screenshotUrl,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            reviewedAt: null,
            reviewerId: null,
            notes: null
        };

        await Database.insert('recharges', recharge);
        console.log(`[RECHARGE] Submitted: ${recharge.id}`);
        return recharge;
    }
    
    /**
     * 获取用户今日充值记录
     */
    async getTodayRecharges(userId) {
        const today = new Date().toISOString().split('T')[0];
        const recharges = await Database.findAll('recharges', { userId });
        return recharges.filter(r => r.createdAt.startsWith(today));
    }
    
    /**
     * 审核通过充值
     * @param {string} rechargeId - 充值记录ID
     * @param {number} amount - 实际金额（管理员确认）
     * @param {string} reviewerId - 审核人
     */
    async approveRecharge(rechargeId, amount, reviewerId) {
        const recharge = await Database.findById('recharges', rechargeId);
        if (!recharge) {
            console.error(`[RECHARGE] Not found: ${rechargeId}`);
            return null;
        }
        
        if (recharge.status !== 'PENDING') {
            console.error(`[RECHARGE] Already processed: ${rechargeId}`);
            return null;
        }

        // 获取号码等级配置
        const tierConfig = NumberTierService.getTierByAmount(amount);

        const updates = {
            amount,
            tier: tierConfig.tier,
            status: 'APPROVED',
            reviewerId,
            reviewedAt: new Date().toISOString()
        };

        await Database.update('recharges', rechargeId, updates);
        console.log(`[RECHARGE] Approved: ${rechargeId}, Amount: ${amount}`);

        return {
            recharge: { ...recharge, ...updates },
            tierConfig,
            amount
        };
    }
    
    /**
     * 拒绝充值
     */
    async rejectRecharge(rechargeId, reviewerId, reason = 'Rejected') {
        const recharge = await Database.findById('recharges', rechargeId);
        if (!recharge) return false;
        
        if (recharge.status !== 'PENDING') {
            console.error(`[RECHARGE] Already processed: ${rechargeId}`);
            return false;
        }

        await Database.update('recharges', rechargeId, {
            status: 'REJECTED',
            reviewerId,
            reviewedAt: new Date().toISOString(),
            notes: reason
        });
        
        console.log(`[RECHARGE] Rejected: ${rechargeId}, Reason: ${reason}`);
        return true;
    }
    
    /**
     * 获取待审核列表
     */
    async getAllPendingRecharges() {
        return await Database.findAll('recharges', { status: 'PENDING' });
    }
    
    /**
     * 获取用户今日已审核金额
     */
    async getTodayApprovedAmount(userId) {
        // 使用 IST 时区获取今天的日期
        const istString = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const [month, day, year] = istString.split('/');
        const today = `${year}-${month}-${day}`;
        
        console.log(`[RECHARGE] getTodayApprovedAmount: userId=${userId}, today=${today}`);
        
        const recharges = await Database.findAll('recharges', {
            userId,
            status: 'APPROVED'
        });

        const todayAmount = recharges
            .filter(r => {
                // 使用 startsWith 匹配日期部分
                const matches = r.createdAt.startsWith(today);
                console.log(`[RECHARGE] Checking: ${r.id}, createdAt=${r.createdAt}, amount=${r.amount}, matches=${matches}`);
                return matches;
            })
            .reduce((sum, r) => sum + (parseInt(r.amount) || 0), 0);
            
        console.log(`[RECHARGE] Today approved amount: ${todayAmount}`);
        return todayAmount;
    }
    
    /**
     * 获取用户充值历史
     */
    async getUserRechargeHistory(userId, limit = 10) {
        const recharges = await Database.findAll('recharges', { userId });
        return recharges
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
    
    /**
     * 获取统计信息
     */
    async getStats(date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const allRecharges = await Database.getAll('recharges');
        
        const dayRecharges = allRecharges.filter(r => {
            return r.createdAt.startsWith(targetDate) && r.status === 'APPROVED';
        });
        
        const totalAmount = dayRecharges.reduce((sum, r) => sum + r.amount, 0);
        const userCount = new Set(dayRecharges.map(r => r.userId)).size;
        
        return {
            date: targetDate,
            totalAmount,
            count: dayRecharges.length,
            userCount,
            averageAmount: dayRecharges.length > 0 ? totalAmount / dayRecharges.length : 0
        };
    }
}

module.exports = new RechargeService();
