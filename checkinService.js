/**
 * ============================================================
 * 签到服务模块 (checkinService.js)
 * ============================================================
 * 
 * 处理每日签到业务逻辑：
 * - 每日签到获得1个号码
 * - 连续7天签到额外获得5个号码
 */

const Database = require('./database');

class CheckinService {

    /**
     * 处理签到
     * 
     * @param {string} userId - 用户ID
     * @returns {Object} 签到结果
     *   - success: 是否成功
     *   - message: 错误消息（如果失败）
     *   - consecutiveDays: 连续签到天数
     *   - rewardCount: 获得号码数量
     *   - isWeeklyBonus: 是否获得7天奖励
     */
    async checkin(userId) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = this.getYesterday(today);

        // 检查今日是否已签到
        const existing = await Database.findOne('checkins', {
            userId,
            date: today
        });

        if (existing) {
            return { 
                success: false, 
                message: 'ALREADY_CHECKED_IN' 
            };
        }

        // 获取昨日签到记录
        const yesterdayCheckin = await Database.findOne('checkins', {
            userId,
            date: yesterday
        });

        // 计算连续天数
        const consecutiveDays = yesterdayCheckin ? yesterdayCheckin.consecutiveDays + 1 : 1;

        // 创建签到记录
        await Database.insert('checkins', {
            id: `chk_${userId}_${today}`,
            userId,
            date: today,
            consecutiveDays,
            createdAt: new Date().toISOString()
        });

        // 计算奖励
        const isWeeklyBonus = consecutiveDays % 7 === 0;
        const rewardCount = isWeeklyBonus ? 5 : 1;

        return {
            success: true,
            consecutiveDays,
            rewardCount,
            isWeeklyBonus
        };
    }

    /**
     * 获取昨天日期
     * @param {string} today - 今天日期 YYYY-MM-DD
     * @returns {string} 昨天日期
     */
    getYesterday(today) {
        const date = new Date(today);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }

    /**
     * 获取用户签到统计
     * @param {string} userId - 用户ID
     * @returns {Object} 统计信息
     */
    async getCheckinStats(userId) {
        const checkins = await Database.findAll('checkins', { userId });
        
        if (checkins.length === 0) {
            return { totalCheckins: 0, maxConsecutive: 0 };
        }

        // 计算最长连续天数
        const dates = checkins.map(c => c.date).sort();
        let maxConsecutive = 1;
        let currentStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1]);
            const curr = new Date(dates[i]);
            const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                currentStreak++;
                maxConsecutive = Math.max(maxConsecutive, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return {
            totalCheckins: checkins.length,
            maxConsecutive
        };
    }
}

module.exports = new CheckinService();
