/**
 * ============================================================
 * 邀请服务模块 (inviteService.js) - FIXED & ENHANCED
 * ============================================================
 * 
 * 修复内容：
 * 1. 添加 verifyInviteCode 方法验证邀请码有效性
 * 2. 添加 getInviterIdByCode 方法通过邀请码获取邀请人
 * 3. 完善邀请奖励发放追踪
 */

const Database = require('./database');

class InviteService {

    /**
     * 生成邀请码
     * 格式：REF + 8位随机字符
     * @returns {string} 邀请码
     */
    generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'REF';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * 创建邀请记录
     * @param {string} inviterId - 邀请人用户ID
     * @returns {Object} 邀请记录
     */
    async createInviteRecord(inviterId) {
        const code = this.generateInviteCode();
        const record = {
            id: `inv_${inviterId}_${Date.now()}`,
            inviterId,
            inviteeId: null,
            inviteCode: code,
            clickTime: new Date().toISOString(),
            registerTime: null,
            firstRechargeTime: null,
            firstRechargeAmount: null,
            status: 'clicked',  // clicked, registered, first_recharge
            registerRewardGiven: false,
            rechargeRewardGiven: false
        };
        
        await Database.insert('inviteRecords', record);
        return record;
    }

    /**
     * 验证邀请码是否有效
     * @param {string} inviteCode - 邀请码
     * @returns {boolean} 是否有效
     */
    async verifyInviteCode(inviteCode) {
        const record = await Database.findOne('inviteRecords', { inviteCode });
        // 邀请码有效：存在且未被使用
        return record && !record.inviteeId;
    }

    /**
     * 通过邀请码获取邀请人ID
     * @param {string} inviteCode - 邀请码
     * @returns {string|null} 邀请人ID
     */
    async getInviterIdByCode(inviteCode) {
        const record = await Database.findOne('inviteRecords', { inviteCode });
        return record ? record.inviterId : null;
    }

    /**
     * 获取用户的最新邀请记录
     * @param {string} inviterId - 邀请人用户ID
     * @returns {Object|null} 邀请记录
     */
    async getUserInviteRecord(inviterId) {
        const records = await Database.findAll('inviteRecords', { inviterId });
        // 按时间排序，返回最新的
        return records.sort((a, b) => 
            new Date(b.clickTime) - new Date(a.clickTime)
        )[0];
    }

    /**
     * 处理被邀请人注册
     * @param {string} inviteeId - 被邀请人用户ID
     * @param {string} inviteCode - 邀请码
     * @returns {boolean} 是否成功
     */
    async processInviteRegister(inviteeId, inviteCode) {
        if (!inviteCode) return false;
        
        const invite = await Database.findOne('inviteRecords', { inviteCode });
        if (!invite || invite.inviteeId) {
            return false;  // 邀请码无效或已被使用
        }

        await Database.update('inviteRecords', invite.id, {
            inviteeId,
            registerTime: new Date().toISOString(),
            status: 'registered'
        });

        return true;
    }

    /**
     * 处理被邀请人首充
     * @param {string} inviteeId - 被邀请人用户ID
     * @param {number} amount - 充值金额
     * @returns {boolean} 是否发放奖励
     */
    async processInviteRecharge(inviteeId, amount) {
        if (amount < 100) return false;

        const invite = await Database.findOne('inviteRecords', {
            inviteeId,
            status: 'registered'
        });

        if (!invite || invite.rechargeRewardGiven) return false;

        await Database.update('inviteRecords', invite.id, {
            firstRechargeTime: new Date().toISOString(),
            firstRechargeAmount: amount,
            rechargeRewardGiven: true,
            status: 'first_recharge'
        });
        
        return true;
    }

    /**
     * 获取邀请统计
     * @param {string} inviterId - 邀请人用户ID
     * @returns {Object} 统计数据
     */
    async getInviteStats(inviterId) {
        const records = await Database.findAll('inviteRecords', { inviterId });
        
        return {
            total: records.length,
            registered: records.filter(r => r.inviteeId).length,
            recharged: records.filter(r => r.status === 'first_recharge').length
        };
    }

    /**
     * 获取邀请人ID（通过被邀请人）
     * @param {string} inviteeId - 被邀请人用户ID
     * @returns {string|null} 邀请人ID
     */
    async getInviterId(inviteeId) {
        const record = await Database.findOne('inviteRecords', { inviteeId });
        return record ? record.inviterId : null;
    }
    
    /**
     * 获取待发放注册奖励的邀请记录
     * @param {string} inviterId - 邀请人ID
     * @returns {Array} 待发放奖励的记录列表
     */
    async getPendingRegisterRewards(inviterId) {
        const records = await Database.findAll('inviteRecords', { 
            inviterId,
            status: 'registered',
            registerRewardGiven: false
        });
        return records;
    }
    
    /**
     * 标记注册奖励已发放
     * @param {string} inviteId - 邀请记录ID
     */
    async markRegisterRewardGiven(inviteId) {
        await Database.update('inviteRecords', inviteId, {
            registerRewardGiven: true
        });
    }
}

module.exports = new InviteService();
