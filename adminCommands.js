/**
 * ============================================================
 * 管理员命令模块 (adminCommands.js)
 * ============================================================
 * 
 * 管理员功能：
 * - /admin - 显示管理员面板
 * - /pending - 查看待审核列表
 * - /approve [ID] [金额] - 手动审核通过
 * - /reject [ID] [原因] - 手动拒绝
 * - /drawnow - 立即开奖
 * - /stats - 查看今日统计
 * - /users - 查看用户列表
 * - /winners - 查看今日中奖
 * - /broadcast [消息] - 广播消息
 * - /vip [用户ID] - 授予VIP
 * - /unvip [用户ID] - 撤销VIP
 */

const Database = require('./database');
const RechargeService = require('./rechargeService');
const LotteryService = require('./lotteryService');
const TierService = require('./tierService');
const VIPService = require('./vipService');
const PoolService = require('./poolService');
const DrawService = require('./drawService');
const { performDraw } = require('./bot');

class AdminCommands {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.setupHandlers();
    }

    isAdmin(userId) {
        return this.config.ADMIN_IDS.includes(userId);
    }

    setupHandlers() {
        // /admin - 管理员面板
        this.bot.onText(/\/admin/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                await this.bot.sendMessage(chatId, '❌ No permission');
                return;
            }

            await this.showAdminPanel(chatId);
        });

        // /pending - 待审核列表
        this.bot.onText(/\/pending/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            await this.showPendingList(chatId);
        });

        // /approve [ID] [金额] - 手动通过
        this.bot.onText(/\/approve\s+(\S+)\s+(\d+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const rechargeId = match[1];
            const amount = parseInt(match[2]);

            await this.manualApprove(chatId, userId, rechargeId, amount);
        });

        // /reject [ID] [原因] - 手动拒绝
        this.bot.onText(/\/reject\s+(\S+)\s*(.*)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const rechargeId = match[1];
            const reason = match[2] || 'Rejected';

            await this.manualReject(chatId, userId, rechargeId, reason);
        });

        // /drawnow - 立即开奖
        this.bot.onText(/\/drawnow/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            await this.bot.sendMessage(chatId, '🎲 Starting draw...');
            await performDraw();
            await this.bot.sendMessage(chatId, '✅ Draw completed!');
        });

        // /stats - 今日统计
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            await this.showStats(chatId);
        });

        // /users - 用户列表
        this.bot.onText(/\/users(?:\s+(\d+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const limit = parseInt(match[1]) || 10;
            await this.showUsers(chatId, limit);
        });

        // /winners - 今日中奖
        this.bot.onText(/\/winners(?:\s+(\d{4}-\d{2}-\d{2}))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const date = match[1] || new Date().toISOString().split('T')[0];
            await this.showWinners(chatId, date);
        });

        // /broadcast [消息] - 广播
        this.bot.onText(/\/broadcast\s+(.+)/s, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const message = match[1];
            await this.broadcast(chatId, message);
        });

        // /vip [用户ID] - 授予VIP
        this.bot.onText(/\/vip\s+(\S+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const targetUserId = match[1];
            await this.grantVIP(chatId, targetUserId);
        });

        // /unvip [用户ID] - 撤销VIP
        this.bot.onText(/\/unvip\s+(\S+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const targetUserId = match[1];
            await this.revokeVIP(chatId, targetUserId);
        });

        // /finduser [GameID] - 查找用户
        this.bot.onText(/\/finduser\s+(\d{7})/, async (msg, match) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            const gameId = match[1];
            await this.findUser(chatId, gameId);
        });
    }

    // 显示管理员面板
    async showAdminPanel(chatId) {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取统计数据
        const pendingCount = (await RechargeService.getAllPendingRecharges()).length;
        const stats = await RechargeService.getStats(today);
        const pool = await PoolService.getTodayPool();
        
        const panelText = 
            '🔧 *Admin Panel*\n' +
            '━━━━━━━━━━━━━━━━━━\n\n' +
            '📊 *Today\'s Stats*\n' +
            `• Pending Reviews: ${pendingCount}\n` +
            `• Total Recharge: ₹${stats.totalAmount.toLocaleString()}\n` +
            `• Users: ${stats.userCount}\n` +
            `• Pool: ₹${pool?.finalAmount?.toLocaleString() || '0'}\n\n` +
            '━━━━━━━━━━━━━━━━━━\n' +
            '*Quick Commands*\n\n' +
            '📋 /pending - View pending reviews\n' +
            '📊 /stats - View full statistics\n' +
            '👥 /users - List users\n' +
            '🏆 /winners - View winners\n' +
            '🎲 /drawnow - Trigger draw now\n\n' +
            '*Manual Actions*\n' +
            '`/approve [ID] [amount]`\n' +
            '`/reject [ID] [reason]`\n' +
            '`/vip [userId]`\n' +
            '`/unvip [userId]`\n' +
            '`/finduser [GameID]`\n\n' +
            '*Broadcast*\n' +
            '`/broadcast [message]`';

        await this.bot.sendMessage(chatId, panelText, { parse_mode: 'Markdown' });
    }

    // 显示待审核列表
    async showPendingList(chatId) {
        const pending = await RechargeService.getAllPendingRecharges();
        
        if (pending.length === 0) {
            await this.bot.sendMessage(chatId, '✅ No pending reviews');
            return;
        }

        let text = `📋 *Pending Reviews (${pending.length})*\n\n`;
        
        for (const item of pending.slice(0, 10)) {
            const user = await Database.findById('users', item.userId);
            text += 
                `🆔 \`${item.id.slice(-8)}\`\n` +
                `👤 ${user?.gameId || 'Unknown'}\n` +
                `⏱️ ${new Date(item.createdAt).toLocaleTimeString()}\n\n`;
        }

        if (pending.length > 10) {
            text += `_...and ${pending.length - 10} more_`;
        }

        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 手动通过
    async manualApprove(chatId, adminId, rechargeId, amount) {
        try {
            // 查找充值记录
            let recharge = await Database.findById('recharges', `rc_${rechargeId}`);
            if (!recharge) {
                const all = await Database.getAll('recharges');
                recharge = all.find(r => r.id.includes(rechargeId));
            }

            if (!recharge) {
                await this.bot.sendMessage(chatId, '❌ Recharge not found');
                return;
            }

            if (recharge.status !== 'PENDING') {
                await this.bot.sendMessage(chatId, '⚠️ Already processed');
                return;
            }

            // 调用审批流程
            const { processApproval } = require('./bot');
            await processApproval(adminId, chatId, recharge.id, amount, null);
            
            await this.bot.sendMessage(chatId, `✅ Approved ₹${amount}`);
        } catch (error) {
            console.error('[ADMIN] Manual approve error:', error);
            await this.bot.sendMessage(chatId, '❌ Approval failed');
        }
    }

    // 手动拒绝
    async manualReject(chatId, adminId, rechargeId, reason) {
        try {
            let recharge = await Database.findById('recharges', `rc_${rechargeId}`);
            if (!recharge) {
                const all = await Database.getAll('recharges');
                recharge = all.find(r => r.id.includes(rechargeId));
            }

            if (!recharge) {
                await this.bot.sendMessage(chatId, '❌ Recharge not found');
                return;
            }

            if (recharge.status !== 'PENDING') {
                await this.bot.sendMessage(chatId, '⚠️ Already processed');
                return;
            }

            const { processRejection } = require('./bot');
            await processRejection(adminId, chatId, recharge.id, reason, null);
            
            await this.bot.sendMessage(chatId, `❌ Rejected: ${reason}`);
        } catch (error) {
            console.error('[ADMIN] Manual reject error:', error);
            await this.bot.sendMessage(chatId, '❌ Rejection failed');
        }
    }

    // 显示统计
    async showStats(chatId) {
        const today = new Date().toISOString().split('T')[0];
        const stats = await RechargeService.getStats(today);
        const pool = await PoolService.getTodayPool();
        const users = await Database.getAll('users');
        const todayUsers = users.filter(u => u.createdAt.startsWith(today));

        const text = 
            '📊 *Today\'s Statistics*\n' +
            '━━━━━━━━━━━━━━━━━━\n\n' +
            '💰 *Recharge*\n' +
            `• Total: ₹${stats.totalAmount.toLocaleString()}\n` +
            `• Count: ${stats.count}\n` +
            `• Users: ${stats.userCount}\n` +
            `• Average: ₹${Math.round(stats.averageAmount).toLocaleString()}\n\n` +
            '👥 *Users*\n' +
            `• New today: ${todayUsers.length}\n` +
            `• Total: ${users.length}\n\n` +
            '🎰 *Pool*\n' +
            `• Amount: ₹${pool?.finalAmount?.toLocaleString() || '0'}\n` +
            `• Participants: ${pool?.participantCount || 0}`;

        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 显示用户列表
    async showUsers(chatId, limit) {
        const users = await Database.getAll('users');
        const recent = users
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        let text = `👥 *Recent Users (${recent.length}/${users.length})*\n\n`;
        
        for (const user of recent) {
            const tier = await TierService.getTierIdentity(user.id);
            text += 
                `🎮 ${user.gameId}\n` +
                `   ${tier?.displayName || 'No Tier'} | ₹${(tier?.totalRecharge || 0).toLocaleString()}\n\n`;
        }

        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 显示中奖列表
    async showWinners(chatId, date) {
        const winners = await Database.findAll('winners', { poolId: `pool_${date}` });
        
        if (winners.length === 0) {
            await this.bot.sendMessage(chatId, `📅 No winners on ${date}`);
            return;
        }

        let text = `🏆 *Winners - ${date}*\n\n`;
        
        for (let i = 0; i < winners.length; i++) {
            const w = winners[i];
            const user = await Database.findById('users', w.userId);
            const medal = i === 0 ? '🥇' : i <= 2 ? '🥈' : '🥉';
            text += 
                `${medal} ${w.number}\n` +
                `   ${user?.gameId || 'Unknown'} | ₹${w.amount.toLocaleString()}\n\n`;
        }

        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }

    // 广播消息
    async broadcast(chatId, message) {
        const users = await Database.getAll('users');
        let sent = 0;
        let failed = 0;

        await this.bot.sendMessage(chatId, `📢 Broadcasting to ${users.length} users...`);

        for (const user of users) {
            try {
                await this.bot.sendMessage(
                    user.telegramId,
                    `📢 *Announcement*\n\n${message}`,
                    { parse_mode: 'Markdown' }
                );
                sent++;
            } catch (e) {
                failed++;
            }
        }

        await this.bot.sendMessage(chatId, 
            `✅ Broadcast completed\n` +
            `• Sent: ${sent}\n` +
            `• Failed: ${failed}`
        );
    }

    // 授予VIP
    async grantVIP(chatId, userId) {
        const success = await VIPService.grantVIP(userId);
        if (success) {
            await this.bot.sendMessage(chatId, `✅ VIP granted to ${userId}`);
        } else {
            await this.bot.sendMessage(chatId, '❌ Failed to grant VIP');
        }
    }

    // 撤销VIP
    async revokeVIP(chatId, userId) {
        const success = await VIPService.revokeVIP(userId);
        if (success) {
            await this.bot.sendMessage(chatId, `✅ VIP revoked from ${userId}`);
        } else {
            await this.bot.sendMessage(chatId, '❌ Failed to revoke VIP');
        }
    }

    // 查找用户
    async findUser(chatId, gameId) {
        const user = await Database.findOne('users', { gameId });
        if (!user) {
            await this.bot.sendMessage(chatId, '❌ User not found');
            return;
        }

        const tier = await TierService.getTierIdentity(user.id);
        const today = new Date().toISOString().split('T')[0];
        const stats = await LotteryService.getUserNumberStats(user.id, today);

        const text = 
            '👤 *User Info*\n' +
            '━━━━━━━━━━━━━━━━━━\n\n' +
            `🎮 Game ID: ${user.gameId}\n` +
            `🆔 User ID: \`${user.id}\`\n` +
            `📱 Telegram: ${user.telegramId}\n` +
            `🏆 Tier: ${tier?.displayName || 'None'}\n` +
            `👑 VIP: ${tier?.isVIP ? 'Yes' : 'No'}\n` +
            `💰 Total Recharge: ₹${(tier?.totalRecharge || 0).toLocaleString()}\n` +
            `🎫 Today's Numbers: ${stats.totalCount}\n` +
            `📅 Registered: ${new Date(user.createdAt).toLocaleDateString()}`;

        await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    }
}

module.exports = AdminCommands;
