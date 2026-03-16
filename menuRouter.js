/**
 * ============================================================
 * 菜单路由系统 (menuRouter.js)
 * ============================================================
 * 
 * 统一的菜单处理系统：
 * 1. 所有菜单回调集中处理
 * 2. 不依赖用户状态
 * 3. 支持动态内容
 * 4. 自动错误处理
 */

const MenuContent = require('./menuContent');
const LotteryService = require('./lotteryService');
const PoolService = require('./poolService');
const Database = require('./database');

class MenuRouter {
    constructor(bot, userService, tierService, vipService) {
        this.bot = bot;
        this.UserService = userService;
        this.TierService = tierService;
        this.VIPService = vipService;
        
        // 绑定所有方法
        this.handleCallback = this.handleCallback.bind(this);
        this.showMainMenu = this.showMainMenu.bind(this);
    }

    /**
     * 处理菜单回调
     */
    async handleCallback(query) {
        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;
        const messageId = query.message.message_id;

        console.log(`[MENU] User ${userId} clicked: ${data}`);

        try {
            // ==================== 主菜单 ====================
            if (data === 'menu_main') {
                await this.showMainMenu(chatId, messageId);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_close') {
                await this.bot.deleteMessage(chatId, messageId);
                await this.answerQuery(query, '菜单已关闭');
                return;
            }

            // ==================== 1. 如何参与 ====================
            if (data === 'menu_how_to_play') {
                await this.showPage(chatId, messageId, MenuContent.howToPlay);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_recharge_tiers') {
                await this.showPage(chatId, messageId, MenuContent.rechargeTiers);
                await this.answerQuery(query);
                return;
            }

            // ==================== 2. 奖池与奖金 ====================
            if (data === 'menu_pool_rules') {
                await this.showPage(chatId, messageId, MenuContent.poolRules);
                await this.answerQuery(query);
                return;
            }

            // ==================== 3. 号码与等级 ====================
            if (data === 'menu_numbers_guide') {
                await this.showPage(chatId, messageId, MenuContent.numbersGuide);
                await this.answerQuery(query);
                return;
            }

            // ==================== 4. 邀请好友 ====================
            if (data === 'menu_invite_guide') {
                await this.showPage(chatId, messageId, MenuContent.inviteGuide);
                await this.answerQuery(query);
                return;
            }

            // ==================== 5. 平台数据 ====================
            if (data === 'menu_platform_stats') {
                await this.showPlatformStats(chatId, messageId, userId);
                await this.answerQuery(query);
                return;
            }

            // ==================== 6. 帮助中心 ====================
            if (data === 'menu_help_center') {
                await this.showPage(chatId, messageId, MenuContent.helpCenter);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_faq') {
                await this.showPage(chatId, messageId, MenuContent.faq);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_user_rules') {
                await this.showPage(chatId, messageId, MenuContent.userRules);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_fairness') {
                await this.showPage(chatId, messageId, MenuContent.fairness);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_legal') {
                await this.showPage(chatId, messageId, MenuContent.legal);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_responsible') {
                await this.showPage(chatId, messageId, MenuContent.responsible);
                await this.answerQuery(query);
                return;
            }

            // ==================== 7. 立即参与 ====================
            if (data === 'menu_join_now' || data === 'action_join_now') {
                await this.showJoinOptions(chatId, messageId);
                await this.answerQuery(query, '选择参与方式');
                return;
            }

            if (data === 'action_join_recharge') {
                await this.showRechargeTiers(chatId, messageId, userId);
                await this.answerQuery(query, '选择充值档位');
                return;
            }

            // ==================== 8. 其他功能跳转 ====================
            if (data === 'action_current_pool') {
                await this.answerQuery(query, '请使用 Current Pool 按钮');
                return;
            }

            if (data === 'action_my_account') {
                await this.answerQuery(query, '请使用 My Account 按钮');
                return;
            }

            if (data === 'action_invite_friends') {
                await this.answerQuery(query, '请使用 Invite Friends 按钮');
                return;
            }

            if (data === 'action_support') {
                await this.answerQuery(query, '请联系客服 @support');
                return;
            }

            if (data === 'action_yesterday_winners') {
                await this.showYesterdayWinners(chatId, messageId);
                await this.answerQuery(query);
                return;
            }

            // ==================== 未知回调 ====================
            console.log(`[MENU] Unknown callback: ${data}`);
            await this.answerQuery(query, '该选项已更新，请从主菜单重新选择');

        } catch (error) {
            console.error('[MENU] Error handling callback:', error);
            await this.answerQuery(query, '❌ 处理失败，请重试');
        }
    }

    /**
     * 显示主菜单
     */
    async showMainMenu(chatId, messageId = null) {
        const content = MenuContent.mainMenu;
        const text = `${content.title}\n${content.subtitle}\n\n${content.description}`;
        
        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: content.buttons
            }
        };

        if (messageId) {
            await this.bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                ...options
            });
        } else {
            await this.bot.sendMessage(chatId, text, options);
        }
    }

    /**
     * 显示静态页面
     */
    async showPage(chatId, messageId, pageContent) {
        const text = `${pageContent.title}\n\n${pageContent.content}`;
        
        await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: pageContent.buttons
            }
        });
    }

    /**
     * 显示平台统计数据（动态内容）
     */
    async showPlatformStats(chatId, messageId, userId) {
        try {
            const today = new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const [month, day, year] = today.split('/');
            const todayStr = `${year}-${month}-${day}`;

            // 获取奖池数据
            let pool = await PoolService.calculateDailyPool(todayStr);
            
            // 获取参与人数
            const participantCount = await PoolService.getParticipantCount(todayStr);
            
            // 获取用户数据
            const user = await this.UserService.getUserByTelegramId(userId);
            let userNumbers = 0;
            let userWeight = 0;
            
            if (user) {
                const stats = await LotteryService.getUserNumberStats(user.id, todayStr);
                userNumbers = stats.totalCount || 0;
                userWeight = stats.totalWeight || 0;
            }

            // 构建动态内容
            let content = 
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📊 *今日数据*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                `💰 总奖池: ₹${(pool?.finalAmount || 0).toLocaleString()}\n` +
                `👥 参与人数: ${participantCount} 人\n` +
                `🎫 总号码数: 统计中...\n\n`;

            if (user) {
                content += 
                    '━━━━━━━━━━━━━━━━━━━\n' +
                    '👤 *我的数据*\n' +
                    '━━━━━━━━━━━━━━━━━━━\n\n' +
                    `🎫 我的号码: ${userNumbers} 个\n` +
                    `⚖️ 总权重: ${userWeight}x\n`;
            } else {
                content += 
                    '━━━━━━━━━━━━━━━━━━━\n' +
                    '⚠️ 您还未参与\n' +
                    '━━━━━━━━━━━━━━━━━━━\n\n' +
                    '点击 "立即参与" 加入！\n';
            }

            content += 
                '\n━━━━━━━━━━━━━━━━━━━\n' +
                '⏰ 开奖时间: 21:00 IST\n' +
                '━━━━━━━━━━━━━━━━━━━';

            const text = `${MenuContent.platformStats.title}\n\n${content}`;

            await this.bot.editMessageText(text, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: MenuContent.platformStats.buttons
                }
            });

        } catch (error) {
            console.error('[MENU] Error showing platform stats:', error);
            await this.showPage(chatId, messageId, {
                title: '❌ 数据加载失败',
                content: '请稍后重试，或使用 Current Pool 按钮查看',
                buttons: [[MenuContent.backToMain]]
            });
        }
    }

    /**
     * 显示参与选项
     */
    async showJoinOptions(chatId, messageId) {
        const text = 
            '🎯 *选择参与方式*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '🎁 *免费参与*\n' +
            '└ 1 个 FREE 号码\n' +
            '└ 只需发送 Game ID\n\n' +
            '💰 *充值参与*\n' +
            '└ 2-12 个号码\n' +
            '└ 更高中奖权重\n\n' +
            '⚠️ *注意：每人限参与一次*';

        await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎁 免费参与', callback_data: 'join_free' }],
                    [{ text: '💰 充值参与', callback_data: 'join_recharge' }],
                    [{ text: '🔙 返回', callback_data: 'menu_main' }]
                ]
            }
        });
    }

    /**
     * 显示充值档位（需要用户状态）
     */
    async showRechargeTiers(chatId, messageId, userId) {
        // 这个需要与现有流程集成，显示档位选择
        const text = 
            '💰 *选择充值档位*\n' +
            '━━━━━━━━━━━━━━━━━━━\n\n' +
            '请选择您要充值的金额：\n\n' +
            '💰 ₹100 - 2 Silver\n' +
            '💰 ₹300 - 3 Silver\n' +
            '💰 ₹500 - 4 Gold\n' +
            '💰 ₹1,000 - 5 Gold\n' +
            '💰 ₹2,000 - 6 Diamond\n' +
            '💰 ₹3,000 - 7 Diamond\n' +
            '💰 ₹5,000 - 8 Crown\n' +
            '💰 ₹10,000 - 10 Crown\n' +
            '💰 ₹20,000 - 12 VIP\n\n' +
            '⚠️ 请使用 Recharge 按钮继续';

        await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔙 返回', callback_data: 'menu_main' }]
                ]
            }
        });
    }

    /**
     * 显示昨日中奖者
     */
    async showYesterdayWinners(chatId, messageId) {
        try {
            // 计算昨日日期
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // 获取中奖记录
            const winners = await Database.findAll('winners', {
                poolId: `pool_${yesterdayStr}`
            });

            let content = '━━━━━━━━━━━━━━━━━━━\n';

            if (winners && winners.length > 0) {
                content += `🏆 昨日中奖者 (${winners.length}人)\n`;
                content += '━━━━━━━━━━━━━━━━━━━\n\n';

                winners.slice(0, 5).forEach((w, i) => {
                    const tier = i === 0 ? '🥇' : i <= 2 ? '🥈' : '🥉';
                    content += `${tier} 用户${w.userId.slice(-4)}: ₹${w.amount.toLocaleString()}\n`;
                });

                if (winners.length > 5) {
                    content += `\n... 还有 ${winners.length - 5} 位中奖者`;
                }
            } else {
                content += '📭 昨日暂无开奖记录\n';
                content += '━━━━━━━━━━━━━━━━━━━\n\n';
                content += '今日参与，明日中奖！';
            }

            await this.bot.editMessageText(`📊 昨日开奖结果\n\n${content}`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[MenuContent.backToMain]]
                }
            });

        } catch (error) {
            console.error('[MENU] Error showing yesterday winners:', error);
            await this.showPage(chatId, messageId, {
                title: '❌ 数据加载失败',
                content: '无法获取昨日开奖数据',
                buttons: [[MenuContent.backToMain]]
            });
        }
    }

    /**
     * 回答回调查询
     */
    async answerQuery(query, text = null) {
        try {
            if (text) {
                await this.bot.answerCallbackQuery(query.id, { text, show_alert: false });
            } else {
                await this.bot.answerCallbackQuery(query.id);
            }
        } catch (e) {
            // 忽略已回答的错误
            if (!e.message.includes('QUERY_ID_INVALID')) {
                console.error('[MENU] Error answering query:', e.message);
            }
        }
    }
}

module.exports = MenuRouter;
