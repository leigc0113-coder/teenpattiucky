/**
 * ============================================================
 * 用户服务模块 (userService.js)
 * ============================================================
 * 
 * 处理用户相关的业务逻辑：
 * - 玩家类型识别（新用户、沉睡用户、VIP等）
 * - 用户注册和管理
 * - 免费号码数量计算
 */

const Database = require('./database');
const CONFIG = require('./config');

class UserService {
    
    /**
     * 识别玩家类型
     * 根据游戏数据判断用户属于哪种类型
     * 
     * @param {Object} gameData - 游戏数据
     *   - exists: 游戏ID是否存在
     *   - registerTime: 游戏账号注册时间
     *   - lastLogin: 最后登录时间
     *   - totalGames: 总局数
     *   - totalRecharge: 历史充值金额
     * 
     * @returns {string} 玩家类型：NEW, NEW_PLAYER, ACTIVE, DORMANT, VIP
     */
    identifyPlayerType(gameData) {
        // 游戏ID不存在于游戏数据库 = 全新用户
        if (!gameData || !gameData.exists) {
            return 'NEW';
        }

        const now = new Date();
        const registerTime = gameData.registerTime ? new Date(gameData.registerTime) : null;
        const lastLogin = gameData.lastLogin ? new Date(gameData.lastLogin) : null;
        const totalGames = gameData.totalGames || 0;
        const totalRecharge = gameData.totalRecharge || 0;

        // 历史充值 > ₹1000 = VIP玩家
        if (totalRecharge > 1000) {
            return 'VIP';
        }

        // 30天未登录 = 沉睡玩家
        if (lastLogin) {
            const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
            if (daysSinceLogin > 30) {
                return 'DORMANT';
            }
        }

        // 注册 < 7天 且 局数 < 50 = 新玩家
        if (registerTime) {
            const daysSinceRegister = (now - registerTime) / (1000 * 60 * 60 * 24);
            if (daysSinceRegister < 7 && totalGames < 50) {
                return 'NEW_PLAYER';
            }
        }

        // 近7天有游戏记录 = 活跃玩家
        if (lastLogin) {
            const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
            if (daysSinceLogin <= 7) {
                return 'ACTIVE';
            }
        }

        // 默认返回新用户
        return 'NEW';
    }

    /**
     * 获取免费号码数量
     * 根据玩家类型返回注册时应发放的号码数量
     * 
     * @param {string} playerType - 玩家类型
     * @returns {number} 免费号码数量
     */
    getFreeNumbersCount(playerType) {
        // 从配置中读取对应类型的免费号码数
        return CONFIG.FREE_NUMBERS[playerType] || 1;
    }

    /**
     * 创建新用户
     * 
     * @param {number} telegramId - Telegram用户ID
     * @param {string} gameId - 游戏ID（7位数字）
     * @param {string} nickname - 昵称
     * @param {string} playerType - 玩家类型
     * @returns {Object} 创建的用户对象
     */
    async createUser(telegramId, gameId, nickname, playerType) {
        const user = {
            id: `u_${telegramId}`,           // 唯一标识
            telegramId,                      // Telegram用户ID
            gameId,                          // 游戏ID（7位数字）
            nickname,                        // 昵称
            playerType,                      // 玩家类型
            riskLevel: 0,                   // 风险等级（0-100）
            createdAt: new Date().toISOString(),  // 注册时间
            lastActive: new Date().toISOString()  // 最后活跃时间
        };
        
        return await Database.insert('users', user);
    }

    /**
     * 通过Telegram ID获取用户
     * @param {number} telegramId - Telegram用户ID
     * @returns {Object|null} 用户对象或null
     */
    async getUserByTelegramId(telegramId) {
        const user = await Database.findOne('users', { telegramId });
        if (user && !user.id) {
            // 如果没有 id 字段，使用 telegramId 构造
            user.id = `u_${telegramId}`;
        }
        return user;
    }

    /**
     * 通过游戏ID获取用户
     * @param {string} gameId - 游戏ID
     * @returns {Object|null} 用户对象或null
     */
    async getUserByGameId(gameId) {
        return await Database.findOne('users', { gameId });
    }

    /**
     * 更新用户最后活跃时间
     * @param {string} userId - 用户ID
     */
    async updateLastActive(userId) {
        await Database.update('users', userId, {
            lastActive: new Date().toISOString()
        });
    }

    /**
     * 获取用户统计信息
     * @param {string} userId - 用户ID
     * @returns {Object} 统计信息
     */
    async getUserStats(userId) {
        const user = await Database.findById('users', userId);
        if (!user) return null;

        // 获取今日号码数量
        const today = Database.getTodayString();
        const todayNumbers = await Database.findAll('lotteryNumbers', {
            userId,
            date: today
        });

        // 获取累计充值
        const tierIdentity = await Database.findOne('tierIdentities', { userId });
        const totalRecharge = tierIdentity ? tierIdentity.totalRecharge : 0;

        // 获取中奖次数
        const winners = await Database.findAll('winners', { userId });
        const totalWon = winners.reduce((sum, w) => sum + w.amount, 0);

        return {
            registerDays: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
            totalNumbers: todayNumbers.length,
            totalRecharge,
            winCount: winners.length,
            totalWon
        };
    }
}

// 导出单例实例
module.exports = new UserService();
