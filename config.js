/**
 * ============================================================
 * 全局配置文件 (config.js) - 优化版
 * ============================================================
 * 
 * 优化内容：
 * 1. 精简号码数量（最多12个）
 * 2. 添加等级标记系统
 * 3. 权重加成机制
 */

module.exports = {
    
    // ==================== 基础配置 ====================
    
    BOT_TOKEN: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    CURRENCY: '₹',
    TIMEZONE: 'Asia/Kolkata',
    
    // ==================== 私域流量配置 ====================
    
    /**
     * 官方频道ID（数字格式）
     * 使用环境变量或默认值
     */
    CHANNEL_ID: process.env.CHANNEL_ID || '-1003881508220',
    
    /**
     * 官方频道用户名
     */
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME || '@telltest222',
    
    /**
     * 玩家群组ID（数字格式，用于API调用）
     */
    GROUP_ID: process.env.GROUP_ID || '-1003858436956',
    
    /**
     * 玩家群组用户名（@格式，用于显示和跳转）
     * 从环境变量读取，方便随时更换
     */
    GROUP_USERNAME: process.env.GROUP_USERNAME || '@tkgfg',
    
    /**
     * 是否强制要求关注频道
     */
    REQUIRE_CHANNEL_SUBSCRIPTION: false,
    
    // ==================== AI 自动发帖配置 ====================
    
    /**
     * 游戏APP下载链接
     */
    GAME_LINK: process.env.GAME_LINK || 'https://www.teenpatty-master.com/eGBic1p2XEJ7fAA=',
    
    /**
     * 机器人名称
     */
    BOT_NAME: process.env.BOT_NAME || 'TeenPatti Lucky Bot',
    
    /**
     * APP名称
     */
    APP_NAME: process.env.APP_NAME || 'TeenPatti Master',
    
    /**
     * 频道关注奖励
     */
    CHANNEL_REWARD: {
        ENABLED: true,
        TIER: 'FREE',
        COUNT: 1,
        COOLDOWN_HOURS: 24
    },
    
    // ==================== 管理员配置 ====================
    
    /**
     * 管理员ID列表（用于接收审核通知）
     * 填写Telegram用户ID，多个用逗号分隔
     * 示例: [123456789, 987654321]
     */
    ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [],
    
    /**
     * 审核群组ID（可选）
     * 如果有审核群组，可以填写群组ID（格式：-100xxxxxxxxx）
     */
    ADMIN_GROUP_ID: process.env.ADMIN_GROUP_ID || null,
    
    // ==================== VIP 配置 ====================
    
    VIP: {
        DAILY_THRESHOLD: 5000,
        CONSECUTIVE_DAYS: 5,
        VALID_FOREVER: true,
        WEIGHT_MULTIPLIER: 1.5  // VIP权重加成1.5倍
    },
    
    // ==================== 开奖配置 ====================
    
    DRAW: {
        HOUR: 21,
        MINUTE: 0,
        TIMEZONE: 'Asia/Kolkata'
    },
    
    // ==================== 奖池配置 ====================
    
    POOL: {
        BASE_AMOUNT: 2000,           // 平日基础奖池: ₹2,000
        WEEKEND_BASE_AMOUNT: 3000,   // 周末基础奖池: ₹3,000
        FESTIVAL_BASE_AMOUNT: 3000,  // 节日基础奖池: ₹3,000
        REGULAR_RATE: 0.15,
        TIER_RATE: 0.10,
        WEEKEND_BONUS: 0.30,
        FESTIVAL_BONUS: 0.50,
        MIN_POOL: 2000,              // 最低保证: ₹2,000
        MAX_POOL: 10000              // 最高上限: ₹10,000
    },
    
    // ==================== 印度重要节日配置 ====================
    // 格式: "MM-DD": "节日名称"
    INDIAN_FESTIVALS: {
        "01-01": "New Year",
        "01-26": "Republic Day",
        "03-14": "Holi",
        "04-14": "Ambedkar Jayanti",
        "05-01": "Labour Day",
        "08-15": "Independence Day",
        "08-19": "Raksha Bandhan",
        "09-07": "Ganesh Chaturthi",
        "10-02": "Gandhi Jayanti",
        "10-12": "Dussehra",
        "11-01": "Diwali",
        "11-02": "Govardhan Puja",
        "12-25": "Christmas"
    },
    
    // 管理员通知配置
    ADMIN_NOTIFICATIONS: {
        FESTIVAL_POOL_ADJUSTMENT: true,  // 节日时通知管理员调整奖池
    },
    
    // ==================== 等级冷静期 ====================
    
    COOLING_PERIOD_DAYS: 7,
    CLAIM_HOURS: 48,
    
    // ==================== 等级门槛配置 ====================
    
    TIER_THRESHOLDS: {
        1: 0,
        2: 5000,
        3: 15000,
        4: 30000,
        5: 50000,
        6: 80000,
        7: 120000,
        8: 170000,
        9: 230000,
        10: 300000
    },
    
    TIER_NAMES: {
        1: ['Bronze', '01'],
        2: ['Bronze', '02'],
        3: ['Silver', '01'],
        4: ['Silver', '02'],
        5: ['Gold', '01'],
        6: ['Gold', '02'],
        7: ['Platinum', '01'],
        8: ['Platinum', '02'],
        9: ['Diamond', '01'],
        10: ['Star', '01']
    },
    
    // ==================== 号码等级配置（新版）====================
    
    /**
     * 号码等级定义
     * 等级越高，数量越少，权重越高
     */
    NUMBER_TIERS: {
        FREE: {
            code: 'F',
            emoji: '🎁',
            name: 'Free',
            minRecharge: 0,
            baseWeight: 1,
            maxCount: 1
        },
        SILVER: {
            code: 'S',
            emoji: '⭐',
            name: 'Silver',
            minRecharge: 100,
            baseWeight: 2,
            maxCount: 3
        },
        GOLD: {
            code: 'G',
            emoji: '⭐⭐',
            name: 'Gold',
            minRecharge: 500,
            baseWeight: 4,
            maxCount: 5
        },
        DIAMOND: {
            code: 'D',
            emoji: '⭐⭐⭐',
            name: 'Diamond',
            minRecharge: 2000,
            baseWeight: 6,
            maxCount: 7
        },
        CROWN: {
            code: 'C',
            emoji: '👑',
            name: 'Crown',
            minRecharge: 4999,
            baseWeight: 8,
            maxCount: 10
        },
        VIP: {
            code: 'V',
            emoji: '👑👑',
            name: 'VIP Elite',
            minRecharge: 20000,
            baseWeight: 12,
            maxCount: 12
        }
    },
    
    /**
     * 充值档位配置（精简版）
     * 金额 -> { 等级, 数量, 权重 }
     */
    RECHARGE_TIERS: {
        0: { tier: 'FREE', count: 1, weight: 1 },
        100: { tier: 'SILVER', count: 2, weight: 2 },
        300: { tier: 'SILVER', count: 3, weight: 3 },
        500: { tier: 'GOLD', count: 4, weight: 4 },
        999: { tier: 'GOLD', count: 5, weight: 5 },
        1000: { tier: 'GOLD', count: 5, weight: 5 },
        2000: { tier: 'DIAMOND', count: 6, weight: 6 },
        3000: { tier: 'DIAMOND', count: 7, weight: 7 },
        4999: { tier: 'CROWN', count: 8, weight: 8 },
        5000: { tier: 'CROWN', count: 8, weight: 8 },
        10000: { tier: 'CROWN', count: 10, weight: 10 },
        20000: { tier: 'VIP', count: 12, weight: 12 }
    },
    
    // ==================== 免费号码配置 ====================
    
    FREE_NUMBERS: {
        NEW: { tier: 'FREE', count: 1 },
        NEW_PLAYER: { tier: 'FREE', count: 1 },
        ACTIVE: { tier: 'FREE', count: 1 },
        DORMANT: { tier: 'SILVER', count: 2 },
        VIP: { tier: 'SILVER', count: 3 },
        RETURNING: { tier: 'FREE', count: 1 }
    },
    
    // ==================== 邀请奖励配置 ====================
    
    INVITE: {
        REGISTER_REWARD: { tier: 'SILVER', count: 2 },
        RECHARGE_REWARD: { tier: 'GOLD', count: 2 }
    },
    
    // ==================== 风控配置 ====================
    
    RISK: {
        DAILY_RECHARGE_LIMIT: 50000,
        DAILY_RECHARGE_COUNT: 5,
        MIN_RECHARGE: 100,
        SCREENSHOT_VALID_HOURS: 48,
        AMOUNT_TOLERANCE: 10
    }
};
