/**
 * ============================================================
 * 多语言菜单路由系统 (menuRouter.i18n.js)
 * ============================================================
 */

const MenuContent = require('./menuContent.i18n');
const LotteryService = require('./lotteryService');
const PoolService = require('./poolService');
const Database = require('./database');

class MenuRouter {
    constructor(bot, userService, tierService, vipService) {
        this.bot = bot;
        this.UserService = userService;
        this.TierService = tierService;
        this.VIPService = vipService;
    }

    /**
     * 获取用户语言
     */
    getUserLanguage(user) {
        return MenuContent.getUserLanguage(user);
    }

    /**
     * 处理菜单回调
     */
    async handleCallback(query) {
        const chatId = query.message.chat.id;
        const user = query.from;
        const userId = user.id;
        const data = query.data;
        const messageId = query.message.message_id;
        const lang = this.getUserLanguage(user);

        console.log(`[MENU] User ${userId} (${lang}): ${data}`);

        try {
            // 主菜单
            if (data === 'menu_main') {
                await this.showMainMenu(chatId, messageId, lang);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_close') {
                await this.bot.deleteMessage(chatId, messageId);
                await this.answerQuery(query, lang === 'zh' ? '菜单已关闭' : 'Menu closed');
                return;
            }

            // 如何参与
            if (data === 'menu_how_to_play') {
                await this.showPage(chatId, messageId, 'howToPlay', lang);
                await this.answerQuery(query);
                return;
            }

            // 奖池规则
            if (data === 'menu_pool_rules') {
                await this.showPage(chatId, messageId, 'poolRules', lang);
                await this.answerQuery(query);
                return;
            }

            // 号码与等级
            if (data === 'menu_numbers_guide') {
                await this.showPage(chatId, messageId, 'numbersGuide', lang);
                await this.answerQuery(query);
                return;
            }

            // 邀请好友
            if (data === 'menu_invite_guide') {
                await this.showPage(chatId, messageId, 'inviteGuide', lang);
                await this.answerQuery(query);
                return;
            }

            // 平台统计
            if (data === 'menu_platform_stats') {
                await this.showPlatformStats(chatId, messageId, userId, lang);
                await this.answerQuery(query);
                return;
            }

            // 帮助中心
            if (data === 'menu_help_center') {
                await this.showPage(chatId, messageId, 'helpCenter', lang);
                await this.answerQuery(query);
                return;
            }

            if (data === 'menu_faq') {
                await this.showPage(chatId, messageId, 'faq', lang);
                await this.answerQuery(query);
                return;
            }

            // 立即参与
            if (data === 'menu_join_now' || data === 'action_join_now') {
                await this.showJoinOptions(chatId, messageId, lang);
                await this.answerQuery(query, lang === 'zh' ? '选择参与方式' : 'Choose method');
                return;
            }

            // 其他功能
            if (data.startsWith('action_')) {
                const actionName = data.replace('action_', '');
                const msg = lang === 'zh' 
                    ? `请使用主菜单的"${actionName}"按钮`
                    : `Please use the "${actionName}" button in main menu`;
                await this.answerQuery(query, msg);
                return;
            }

            // 未知回调
            console.log(`[MENU] Unknown callback: ${data}`);
            const unknownMsg = lang === 'zh' 
                ? '该选项已更新，请从主菜单重新选择'
                : 'Option updated, please select from main menu';
            await this.answerQuery(query, unknownMsg);

        } catch (error) {
            console.error('[MENU] Error:', error);
            const errorMsg = lang === 'zh' ? '处理失败，请重试' : 'Error, please retry';
            await this.answerQuery(query, errorMsg);
        }
    }

    /**
     * 显示主菜单
     */
    async showMainMenu(chatId, messageId = null, lang = 'en') {
        const content = MenuContent.get('mainMenu', lang);
        const text = `${content.title}\n${content.subtitle}\n\n${content.description}`;
        
        const options = {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: content.buttons }
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
    async showPage(chatId, messageId, pageKey, lang = 'en') {
        const content = MenuContent.get(pageKey, lang);
        if (!content) return;

        const text = `${content.title}\n\n${content.content}`;
        
        await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: content.buttons }
        });
    }

    /**
     * 显示平台统计
     */
    async showPlatformStats(chatId, messageId, userId, lang = 'en') {
        try {
            const today = new Date().toLocaleString('en-US', { 
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const [month, day, year] = today.split('/');
            const todayStr = `${year}-${month}-${day}`;

            let pool = await PoolService.calculateDailyPool(todayStr);
            const participantCount = await PoolService.getParticipantCount(todayStr);
            
            const user = await this.UserService.getUserByTelegramId(userId);
            let userNumbers = 0;
            
            if (user) {
                const stats = await LotteryService.getUserNumberStats(user.id, todayStr);
                userNumbers = stats.totalCount || 0;
            }

            let content;
            if (lang === 'zh') {
                content = 
                    '━━━━━━━━━━━━━━━━━━━\n' +
                    '📊 *今日数据*\n' +
                    '━━━━━━━━━━━━━━━━━━━\n\n' +
                    `💰 总奖池: ₹${(pool?.finalAmount || 0).toLocaleString()}\n` +
                    `👥 参与人数: ${participantCount} 人\n\n`;

                if (user) {
                    content += 
                        '━━━━━━━━━━━━━━━━━━━\n' +
                        '👤 *我的数据*\n' +
                        '━━━━━━━━━━━━━━━━━━━\n\n' +
                        `🎫 我的号码: ${userNumbers} 个\n`;
                }

                content += '\n⏰ 开奖时间: 21:00 IST';
            } else {
                content = 
                    '━━━━━━━━━━━━━━━━━━━\n' +
                    '📊 *Today\'s Stats*\n' +
                    '━━━━━━━━━━━━━━━━━━━\n\n' +
                    `💰 Pool: ₹${(pool?.finalAmount || 0).toLocaleString()}\n` +
                    `👥 Participants: ${participantCount}\n\n`;

                if (user) {
                    content += 
                        '━━━━━━━━━━━━━━━━━━━\n' +
                        '👤 *My Stats*\n' +
                        '━━━━━━━━━━━━━━━━━━━\n\n' +
                        `🎫 My Numbers: ${userNumbers}\n`;
                }

                content += '\n⏰ Draw: 21:00 IST';
            }

            const title = lang === 'zh' ? '📊 平台数据统计' : '📊 Platform Statistics';
            const buttons = lang === 'zh' ? [
                [{ text: '💰 当前奖池', callback_data: 'action_current_pool' }],
                [{ text: '🏆 昨日中奖', callback_data: 'action_yesterday_winners' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ] : [
                [{ text: '💰 Current Pool', callback_data: 'action_current_pool' }],
                [{ text: '🏆 Yesterday', callback_data: 'action_yesterday_winners' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ];

            await this.bot.editMessageText(`${title}\n\n${content}`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });

        } catch (error) {
            console.error('[MENU] Stats error:', error);
            const errorMsg = lang === 'zh' ? '数据加载失败' : 'Failed to load stats';
            await this.bot.editMessageText(`❌ ${errorMsg}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [[
                        { text: lang === 'zh' ? '🔙 返回' : '🔙 Back', callback_data: 'menu_main' }
                    ]]
                }
            });
        }
    }

    /**
     * 显示参与选项
     */
    async showJoinOptions(chatId, messageId, lang = 'en') {
        let text, buttons;
        
        if (lang === 'zh') {
            text = 
                '🎯 *选择参与方式*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '🎁 *免费参与*\n' +
                '└ 1个 FREE 号码\n\n' +
                '💰 *充值参与*\n' +
                '└ 2-12个号码\n\n' +
                '⚠️ 每人限参与一次';
            buttons = [
                [{ text: '🎁 免费参与', callback_data: 'join_free' }],
                [{ text: '💰 充值参与', callback_data: 'join_recharge' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ];
        } else {
            text = 
                '🎯 *Choose Method*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '🎁 *FREE Entry*\n' +
                '└ 1 FREE number\n\n' +
                '💰 *Recharge*\n' +
                '└ 2-12 numbers\n\n' +
                '⚠️ One entry per user';
            buttons = [
                [{ text: '🎁 FREE Entry', callback_data: 'join_free' }],
                [{ text: '💰 Recharge', callback_data: 'join_recharge' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ];
        }

        await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
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
            if (!e.message.includes('QUERY_ID_INVALID')) {
                console.error('[MENU] Answer error:', e.message);
            }
        }
    }
}

module.exports = MenuRouter;
