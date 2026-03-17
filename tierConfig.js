/**
 * ============================================================
 * 等级配置 (tierConfig.js)
 * ============================================================
 * 
 * 新的等级系统配置：
 * - 人人有等级（无数量限制）
 * - 累计充值自动升级
 * - 差异化奖池抽成率
 */

const TIER_CONFIG = {
    
    // 等级定义（按累计充值门槛）
    LEVELS: {
        1: {
            level: 1,
            name: 'Bronze',
            displayName: 'Bronze Member',
            emoji: '🥉',
            threshold: 0,              // 累计充值门槛
            poolRate: 0.15,            // 奖池抽成率（15%）
            description: '入门等级，新用户默认'
        },
        2: {
            level: 2,
            name: 'Silver',
            displayName: 'Silver Member',
            emoji: '🥈',
            threshold: 5000,           // ₹5,000
            poolRate: 0.10,            // 奖池抽成率（10%）
            description: '累计充值达到 ₹5,000'
        },
        3: {
            level: 3,
            name: 'Gold',
            displayName: 'Gold Member',
            emoji: '🥇',
            threshold: 15000,          // ₹15,000
            poolRate: 0.10,
            description: '累计充值达到 ₹15,000'
        },
        4: {
            level: 4,
            name: 'Platinum',
            displayName: 'Platinum Member',
            emoji: '💎',
            threshold: 50000,          // ₹50,000
            poolRate: 0.10,
            description: '累计充值达到 ₹50,000'
        },
        5: {
            level: 5,
            name: 'Diamond',
            displayName: 'Diamond Member',
            emoji: '💠',
            threshold: 120000,         // ₹120,000
            poolRate: 0.10,
            description: '累计充值达到 ₹120,000'
        },
        6: {
            level: 6,
            name: 'Star',
            displayName: 'Star Member',
            emoji: '🌟',
            threshold: 300000,         // ₹300,000
            poolRate: 0.10,
            description: '累计充值达到 ₹300,000'
        }
    },

    // 最大等级数
    MAX_LEVEL: 6,

    // 默认等级（新用户）
    DEFAULT_LEVEL: 1,

    // VIP 配置
    VIP: {
        dailyThreshold: 5000,        // 每日充值门槛
        consecutiveDays: 5,          // 连续天数
        weightMultiplier: 1.5,       // 权重加成
        validForever: true           // 是否永久有效
    },

    // 等级升级提示消息
    UPGRADE_MESSAGES: {
        2: '🎉 恭喜升级！您现在是 Silver Member！',
        3: '🎉 恭喜升级！您现在是 Gold Member！',
        4: '🎉 恭喜升级！您现在是 Platinum Member！',
        5: '🎉 恭喜升级！您现在是 Diamond Member！',
        6: '🎉 恭喜升级！您现在是 Star Member！最高等级！'
    }
};

module.exports = TIER_CONFIG;
