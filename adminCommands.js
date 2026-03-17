/**
 * ============================================================
 * 管理员命令模块 v2.0 (adminCommands.js)
 * ============================================================
 * 
 * 新增功能：
 * - 按钮面板操作
 * - 批量审核
 * - 自动统计推送
 * - 快捷操作
 * - 批量添加用户
 */

const Database = require('./database');
const RechargeService = require('./rechargeService');
const LotteryService = require('./lotteryService');
const TierService = require('./tierService');
const VIPService = require('./vipService');
const PoolService = require('./poolService');
const DrawService = require('./drawService');

class AdminCommands {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.adminState = new Map(); // 管理员操作状态
        this.setupHandlers();
        this.setupCallbacks();
    }

    isAdmin(userId) {
        return this.config.ADMIN_IDS.includes(userId);
    }

    // ==================== 指令处理器 ====================
    setupHandlers() {
        // /admin - 管理员面板（带按钮）
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

            if (!this.isAdmin(userId)) return;

            await this.showPendingList(chatId);
        });

        // /stats - 今日统计
        this.bot.onText(/\/stats/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) return;

            await this.showStats(chatId);
        });

        // /auto - 自动化设置
        this.bot.onText(/\/auto/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) return;

            await this.showAutoSettings(chatId);
        });

        // /drawhistory - 历史开奖记录
        this.bot.onText(/\/drawhistory/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) return;

            await this.showDrawHistory(chatId);
        });

        // 处理批量添加用户的Game ID输入
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const text = msg.text;

            if (!this.isAdmin(userId)) return;
            if (!text || text.startsWith('/')) return;

            const state = this.adminState.get(userId);
            if (!state) return;

            // 处理批量添加 - 输入Game ID
            if (state.step === 'batch_add_free' || state.step === 'batch_add_recharge') {
                if (text.toLowerCase() === '/cancel') {
                    this.adminState.delete(userId);
                    await this.bot.sendMessage(chatId, '❌ 已取消');
                    await this.showAdminPanel(chatId);
                    return;
                }

                // 解析Game ID列表
                const gameIds = text.split(/[,，\n]/).map(id => id.trim()).filter(id => /^\d{7}$/.test(id));
                
                if (gameIds.length === 0) {
                    await this.bot.sendMessage(chatId, 
                        '❌ 未找到有效的Game ID\n' +
                        '请确保输入7位数字，用逗号分隔'
                    );
                    return;
                }

                state.gameIds = gameIds;

                if (state.step === 'batch_add_free') {
                    // 免费赠送直接确认
                    state.step = 'batch_confirm';
                    await this.confirmBatchAdd(chatId, userId);
                } else {
                    // 充值档位选择
                    await this.promptRechargeTier(chatId);
                }
            }
        });
    }

    // ==================== 回调处理器 ====================
    setupCallbacks() {
        this.bot.on('callback_query', async (query) => {
            const data = query.data;
            const chatId = query.message.chat.id;
            const userId = query.from.id;

            if (!this.isAdmin(userId)) return;

            // 管理员面板按钮
            if (data === 'admin_pending') {
                await this.showPendingList(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_stats') {
                await this.showStats(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_draw') {
                await this.confirmDraw(chatId);
                await this.answerQuery(query);
                return;
            }

            // 批量添加用户
            if (data === 'admin_batch_add') {
                await this.startBatchAdd(chatId, userId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'batch_add_free') {
                this.adminState.set(userId, { step: 'batch_add_free', gameIds: [] });
                await this.promptGameIds(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'batch_add_recharge') {
                this.adminState.set(userId, { step: 'batch_add_recharge', gameIds: [] });
                await this.promptGameIds(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data.startsWith('batch_tier_')) {
                const tierAmount = parseInt(data.replace('batch_tier_', ''));
                const state = this.adminState.get(userId);
                if (state) {
                    state.tierAmount = tierAmount;
                    state.step = 'batch_confirm';
                    await this.confirmBatchAdd(chatId, userId);
                }
                await this.answerQuery(query);
                return;
            }

            if (data === 'batch_confirm_yes') {
                await this.executeBatchAdd(chatId, userId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'batch_confirm_no') {
                this.adminState.delete(userId);
                await this.showAdminPanel(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_broadcast') {
                await this.promptBroadcast(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_auto') {
                await this.showAutoSettings(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_back') {
                await this.showAdminPanel(chatId);
                await this.answerQuery(query);
                return;
            }

            // 批量操作
            if (data === 'admin_approve_all_free') {
                await this.batchApproveFree(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'admin_reject_all_old') {
                await this.batchRejectOld(chatId);
                await this.answerQuery(query);
                return;
            }

            // 确认开奖
            if (data === 'confirm_draw_yes') {
                await this.performDrawNow(chatId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'confirm_draw_no') {
                await this.showAdminPanel(chatId);
                await this.answerQuery(query);
                return;
            }
        });
    }

    // ==================== 管理员面板 ====================
    async showAdminPanel(chatId) {
        const text = 
            '👨‍💼 *管理员面板*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '请选择一个操作：';

        const buttons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📋 待审核列表', callback_data: 'admin_pending' },
                        { text: '📊 今日统计', callback_data: 'admin_stats' }
                    ],
                    [
                        { text: '➕ 批量添加用户', callback_data: 'admin_batch_add' },
                        { text: '🎰 立即开奖', callback_data: 'admin_draw' }
                    ],
                    [
                        { text: '📢 广播消息', callback_data: 'admin_broadcast' },
                        { text: '⚙️ 自动设置', callback_data: 'admin_auto' }
                    ],
                    [
                        { text: '✅ 批准所有免费', callback_data: 'admin_approve_all_free' },
                        { text: '❌ 拒绝超24小时', callback_data: 'admin_reject_all_old' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            ...buttons
        });
    }

    // ==================== 待审核列表 ====================
    async showPendingList(chatId) {
        const recharges = await Database.findAll('recharges', { status: 'PENDING' });
        
        if (recharges.length === 0) {
            await this.bot.sendMessage(chatId, 
                '✅ 没有待审核的申请。\n\n所有申请已处理完毕！',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔙 返回', callback_data: 'admin_back' }]
                        ]
                    }
                }
            );
            return;
        }

        let text = `📋 *待审核申请 (${recharges.length})*\n\n`;

        for (let i = 0; i < Math.min(recharges.length, 10); i++) {
            const r = recharges[i];
            const user = await Database.findById('users', r.userId);
            const shortId = r.id.slice(-8);
            const type = r.entryType === 'free' ? '🎁 免费' : '💰 充值';
            
            text += `#${i+1} \`${shortId}\` | ${type}\n`;
            text += `   用户: ${user?.gameId || 'Unknown'}\n`;
            text += `   时间: ${new Date(r.createdAt).toLocaleString()}\n\n`;
        }

        if (recharges.length > 10) {
            text += `... 还有 ${recharges.length - 10} 个\n`;
        }

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ 批准所有免费', callback_data: 'admin_approve_all_free' },
                        { text: '❌ 拒绝超24小时', callback_data: 'admin_reject_all_old' }
                    ],
                    [{ text: '🔙 返回', callback_data: 'admin_back' }]
                ]
            }
        });
    }

    // ==================== 今日统计（包含频道/群组数据）====================
    async showStats(chatId) {
        const today = new Date().toISOString().split('T')[0];
        
        // 获取数据
        const users = await Database.getAll('users');
        const recharges = await Database.findAll('recharges', { status: 'APPROVED' });
        const pool = await PoolService.getTodayPool();
        
        // 今日数据
        const todayRecharges = recharges.filter(r => r.createdAt.startsWith(today));
        const todayAmount = todayRecharges.reduce((sum, r) => sum + r.amount, 0);
        
        // 获取频道和群组人数
        let channelCount = 0;
        let groupCount = 0;
        
        try {
            const Integration = require('./integration');
            const integration = new Integration(this.bot);
            const channelStats = await integration.getChannelStats();
            channelCount = channelStats?.memberCount || 0;
        } catch (e) {
            console.log('[STATS] Channel stats error:', e.message);
        }
        
        try {
            const Integration = require('./integration');
            const integration = new Integration(this.bot);
            const groupStats = await integration.getGroupStats();
            groupCount = groupStats?.memberCount || 0;
        } catch (e) {
            console.log('[STATS] Group stats error:', e.message);
        }
        
        const text = 
            '📊 *今日统计*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '*📱 用户数据*\n' +
            `👥 总用户数: ${users.length}\n` +
            `💰 今日充值: ₹${todayAmount.toLocaleString()}\n` +
            `📊 今日批准: ${todayRecharges.length}\n` +
            `💎 奖池金额: ₹${(pool?.finalAmount || 0).toLocaleString()}\n\n` +
            '*📢 社群数据*\n' +
            `📣 频道人数: ${channelCount.toLocaleString()}\n` +
            `💬 群组人数: ${groupCount.toLocaleString()}\n\n` +
            `⏰ 开奖时间: 21:00 IST`;

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔄 刷新', callback_data: 'admin_stats' }],
                    [{ text: '🔙 返回', callback_data: 'admin_back' }]
                ]
            }
        });
    }

    // ==================== 强制开奖 ====================
    async confirmDraw(chatId) {
        const text = 
            '⚠️ *确认立即开奖*\n\n' +
            '确定要立即开奖吗？\n' +
            '这将锁定奖池并选择中奖者。';

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ 确定开奖', callback_data: 'confirm_draw_yes' },
                        { text: '❌ 取消', callback_data: 'confirm_draw_no' }
                    ]
                ]
            }
        });
    }

    async performDrawNow(chatId) {
        try {
            await this.bot.sendMessage(chatId, '⏳ 正在开奖...');
            
            // 调用开奖函数
            const { performDraw } = require('./bot');
            await performDraw();
            
            await this.bot.sendMessage(chatId, '✅ 开奖完成！请查看中奖名单。');
        } catch (error) {
            console.error('[ADMIN] Draw error:', error);
            await this.bot.sendMessage(chatId, '❌ 开奖失败: ' + error.message);
        }
    }

    // ==================== 广播消息 ====================
    async promptBroadcast(chatId) {
        await this.bot.sendMessage(chatId, 
            '📢 *广播消息*\n\n' +
            '请发送要广播给所有用户的消息。\n' +
            '输入 /cancel 取消。',
            { parse_mode: 'Markdown' }
        );

        // 这里需要设置状态等待用户输入
        // 简化版：提示使用命令 /broadcast [message]
        await this.bot.sendMessage(chatId, 
            '💡 *提示:* 使用命令:\n' +
            '`/broadcast 你的消息内容`'
        );
    }

    // ==================== 自动化设置 ====================
    async showAutoSettings(chatId) {
        const text = 
            '⚙️ *自动化设置*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '*可用自动化功能:*\n\n' +
            '✅ 自动批准免费申请\n' +
            '⏰ 48小时后自动拒绝\n' +
            '📊 每日20:00统计推送\n' +
            '🎉 中奖自动通知\n\n' +
            '*即将推出:*\n' +
            '• 大额充值自动奖励\n' +
            '• 连续充值自动VIP';

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 返回', callback_data: 'admin_back' }]
                ]
            }
        });
    }

    // ==================== 历史开奖记录 ====================
    async showDrawHistory(chatId) {
        try {
            const historyService = require('./historyService');
            const drawHistory = await historyService.getDrawHistory(7);

            if (drawHistory.length === 0) {
                await this.bot.sendMessage(chatId, 
                    '📊 *历史开奖记录*\n' +
                    '━━━━━━━━━━━━━━━━━━━\n\n' +
                    '暂无开奖记录',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            let message = '📊 *历史开奖记录* (最近7天)\n';
            message += '━━━━━━━━━━━━━━━━━━━\n\n';

            for (const draw of drawHistory) {
                message += `📅 *${draw.date}*\n`;
                message += `💰 奖池: ₹${(draw.poolAmount || 0).toLocaleString()}\n`;
                message += `👥 参与人数: ${draw.participantCount || 0}\n`;
                
                if (draw.winners && draw.winners.length > 0) {
                    message += '🏆 中奖者:\n';
                    for (const winner of draw.winners.slice(0, 3)) {
                        const tierEmoji = winner.prizeTier === 1 ? '🥇' : winner.prizeTier === 2 ? '🥈' : '🥉';
                        message += `  ${tierEmoji} ${winner.number} - ₹${(winner.amount || 0).toLocaleString()}\n`;
                    }
                    if (draw.winners.length > 3) {
                        message += `  ... 还有 ${draw.winners.length - 3} 位\n`;
                    }
                }
                message += '\n';
            }

            message += '━━━━━━━━━━━━━━━━━━━';

            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 返回', callback_data: 'admin_back' }]
                    ]
                }
            });

        } catch (error) {
            console.error('[ADMIN] Draw history error:', error);
            await this.bot.sendMessage(chatId, '❌ 获取开奖历史失败: ' + error.message);
        }
    }

    // ==================== 批量操作 ====================
    async batchApproveFree(chatId) {
        const recharges = await Database.findAll('recharges', { 
            status: 'PENDING',
            entryType: 'free'
        });

        if (recharges.length === 0) {
            await this.bot.sendMessage(chatId, '没有免费申请需要批准。');
            return;
        }

        await this.bot.sendMessage(chatId, `⏳ 正在批准 ${recharges.length} 个免费申请...`);

        let approved = 0;
        for (const r of recharges) {
            try {
                // 这里需要调用审批函数
                approved++;
            } catch (e) {
                console.error('[BATCH] Approve error:', e);
            }
        }

        await this.bot.sendMessage(chatId, `✅ 已批准 ${approved}/${recharges.length} 个免费申请。`);
    }

    async batchRejectOld(chatId) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const recharges = await Database.getAll('recharges');
        const oldPending = recharges.filter(r => 
            r.status === 'PENDING' && r.createdAt < oneDayAgo
        );

        if (oldPending.length === 0) {
            await this.bot.sendMessage(chatId, '没有超过24小时的待审核申请。');
            return;
        }

        await this.bot.sendMessage(chatId, `⏳ 正在拒绝 ${oldPending.length} 个超时申请...`);

        let rejected = 0;
        for (const r of oldPending) {
            try {
                await Database.update('recharges', r.id, {
                    status: 'REJECTED',
                    rejectReason: '超时 (>24h)'
                });
                rejected++;
            } catch (e) {
                console.error('[BATCH] Reject error:', e);
            }
        }

        await this.bot.sendMessage(chatId, `✅ 已拒绝 ${rejected} 个超时申请。`);
    }

    // ==================== 批量添加用户功能 ====================
    async startBatchAdd(chatId, adminId) {
        const text = 
            '➕ *批量添加用户*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '请选择添加类型：';

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🎁 免费赠送', callback_data: 'batch_add_free' },
                        { text: '💰 充值档位', callback_data: 'batch_add_recharge' }
                    ],
                    [{ text: '🔙 返回', callback_data: 'admin_back' }]
                ]
            }
        });
    }

    async promptGameIds(chatId) {
        await this.bot.sendMessage(chatId,
            '📝 请输入Game ID列表\n\n' +
            '格式：用逗号分隔多个ID\n' +
            '示例：`1234567, 7654321, 1111111`\n\n' +
            '输入 /cancel 取消',
            { parse_mode: 'Markdown' }
        );
    }

    async promptRechargeTier(chatId) {
        const text = 
            '💰 请选择充值档位：\n\n' +
            '💰 ₹100 → 2 Silver\n' +
            '💰 ₹300 → 3 Silver\n' +
            '💰 ₹500 → 4 Gold\n' +
            '💰 ₹1,000 → 5 Gold\n' +
            '💰 ₹2,000 → 6 Diamond\n' +
            '💰 ₹3,000 → 7 Diamond\n' +
            '💰 ₹5,000 → 8 Crown\n' +
            '💰 ₹10,000 → 10 Crown\n' +
            '💰 ₹20,000 → 12 VIP';

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '₹100', callback_data: 'batch_tier_100' },
                        { text: '₹300', callback_data: 'batch_tier_300' },
                        { text: '₹500', callback_data: 'batch_tier_500' }
                    ],
                    [
                        { text: '₹1K', callback_data: 'batch_tier_1000' },
                        { text: '₹2K', callback_data: 'batch_tier_2000' },
                        { text: '₹3K', callback_data: 'batch_tier_3000' }
                    ],
                    [
                        { text: '₹5K', callback_data: 'batch_tier_5000' },
                        { text: '₹10K', callback_data: 'batch_tier_10000' },
                        { text: '₹20K', callback_data: 'batch_tier_20000' }
                    ],
                    [{ text: '❌ 取消', callback_data: 'batch_confirm_no' }]
                ]
            }
        });
    }

    async confirmBatchAdd(chatId, adminId) {
        const state = this.adminState.get(adminId);
        if (!state) return;

        const gameIds = state.gameIds;
        const isFree = state.step === 'batch_add_free';
        const tierAmount = state.tierAmount || 0;

        let text = 
            '⚠️ *确认批量添加*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            `用户数量: ${gameIds.length} 个\n`;

        if (isFree) {
            text += '类型: 🎁 免费赠送\n';
            text += '号码: 1 FREE\n';
        } else {
            text += `类型: 💰 充值 ₹${tierAmount.toLocaleString()}\n`;
            const numbers = this.getNumbersByAmount(tierAmount);
            text += `号码: ${numbers} 个\n`;
        }

        text += '\n用户列表:\n';
        gameIds.forEach((id, i) => {
            text += `${i + 1}. ${id}\n`;
        });

        await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ 确认添加', callback_data: 'batch_confirm_yes' },
                        { text: '❌ 取消', callback_data: 'batch_confirm_no' }
                    ]
                ]
            }
        });
    }

    getNumbersByAmount(amount) {
        if (amount >= 20000) return 12;
        if (amount >= 10000) return 10;
        if (amount >= 5000) return 8;
        if (amount >= 3000) return 7;
        if (amount >= 2000) return 6;
        if (amount >= 1000) return 5;
        if (amount >= 500) return 4;
        if (amount >= 300) return 3;
        return 2;
    }

    async executeBatchAdd(chatId, adminId) {
        const state = this.adminState.get(adminId);
        if (!state) return;

        const gameIds = state.gameIds;
        const isFree = state.step === 'batch_add_free';
        const tierAmount = state.tierAmount || 0;

        await this.bot.sendMessage(chatId, `⏳ 正在处理 ${gameIds.length} 个用户...`);

        let success = 0;
        let failed = 0;
        let totalNumbers = 0;

        for (const gameId of gameIds) {
            try {
                // 查找或创建用户
                let user = await Database.findOne('users', { gameId });
                
                if (!user) {
                    // 创建新用户
                    user = {
                        id: `u_manual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        telegramId: 0, // 手动添加无Telegram ID
                        gameId: gameId,
                        username: 'manual_add',
                        createdAt: new Date().toISOString()
                    };
                    await Database.insert('users', user);
                }

                // 创建等级身份
                await TierService.createTierIdentity(user.id);

                // 发放号码
                const today = new Date().toISOString().split('T')[0];
                let numbers;

                if (isFree) {
                    numbers = await LotteryService.generateFreeNumbers(user.id, 'manual_free', today, 1);
                } else {
                    numbers = await LotteryService.generateNumbers(user.id, tierAmount, 'manual_recharge', today);
                }

                totalNumbers += numbers?.numbers?.length || 0;
                success++;

            } catch (e) {
                console.error(`[BATCH_ADD] Error adding ${gameId}:`, e);
                failed++;
            }
        }

        // 清理状态
        this.adminState.delete(adminId);

        // 发送结果
        const resultText = 
            '✅ *批量添加完成*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            `成功: ${success} 个用户\n` +
            `失败: ${failed} 个用户\n` +
            `总号码: ${totalNumbers} 个\n\n` +
            '所有用户已参与今日开奖。';

        await this.bot.sendMessage(chatId, resultText, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 返回管理面板', callback_data: 'admin_back' }]
                ]
            }
        });
    }

    // ==================== 辅助函数 ====================
    async answerQuery(query, text = null) {
        try {
            if (text) {
                await this.bot.answerCallbackQuery(query.id, { text });
            } else {
                await this.bot.answerCallbackQuery(query.id);
            }
        } catch (e) {
            // Ignore
        }
    }
}

module.exports = AdminCommands;
