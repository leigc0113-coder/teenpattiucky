/**
 * ============================================================
 * Telegram 私域联动系统 (Channel-Group-Bot Integration)
 * ============================================================
 * 
 * 架构设计：
 * 频道(Channel) → 广播中心
 * 群组(Group)   → 互动社区  
 * 机器人(Bot)   → 核心入口 + 服务中枢
 */

const ExternalConfig = require('./config');

const CONFIG = {
    // 从外部 config.js 读取配置（优先级高）
    CHANNEL_ID: ExternalConfig.CHANNEL_ID || '@teenpatti_official',
    CHANNEL_USERNAME: ExternalConfig.CHANNEL_USERNAME || '@telltest222',
    GROUP_ID: ExternalConfig.GROUP_ID || '@teenpatti_group',
    GROUP_USERNAME: ExternalConfig.GROUP_USERNAME || '@tkgfg',
    ADMIN_GROUP_ID: '@teenpatti_admin',      // 管理员群组（可选）
    
    // 频道消息类型
    CHANNEL_MESSAGES: {
        DRAW_RESULT: 'draw_result',           // 开奖公告
        POOL_UPDATE: 'pool_update',           // 奖池更新
        WINNER_STORY: 'winner_story',         // 中奖故事
        ANNOUNCEMENT: 'announcement',         // 重要公告
        TUTORIAL: 'tutorial',                 // 教程攻略
        EVENT: 'event'                        // 活动推广
    }
};

// ==================== 核心联动服务 ====================

class ChannelGroupBotIntegration {
    constructor(bot) {
        this.bot = bot;
        this.channelId = CONFIG.CHANNEL_ID;
        this.channelUsername = CONFIG.CHANNEL_USERNAME;
        this.groupId = CONFIG.GROUP_ID;
        this.groupUsername = CONFIG.GROUP_USERNAME;
        this.botUsername = null; // 延迟加载
    }
    
    /**
     * 获取机器人用户名（带缓存）
     */
    async getBotUsername() {
        if (!this.botUsername) {
            const me = await this.bot.getMe();
            this.botUsername = me.username;
        }
        return this.botUsername;
    }

    // =====================================================
    // 1. 机器人 → 引导用户关注频道 + 加入群组
    // =====================================================
    
    /**
     * 检查用户是否已关注频道
     */
    async isChannelMember(userId) {
        try {
            console.log(`[DEBUG] Checking channel member: User ${userId} in ${this.channelId}`);
            const member = await this.bot.getChatMember(this.channelId, userId);
            console.log(`[DEBUG] Channel member status: ${member.status}`);
            return ['member', 'administrator', 'creator'].includes(member.status);
        } catch (error) {
            console.error(`[CHECK_CHANNEL_ERROR] User: ${userId}, Channel: ${this.channelId}`);
            console.error(`[CHECK_CHANNEL_ERROR] Message: ${error.message}`);
            console.error(`[CHECK_CHANNEL_ERROR] Code: ${error.code}`);
            // 如果检查失败，返回 false 但不阻断流程
            return false;
        }
    }

    /**
     * 检查用户是否已加入群组
     */
    async isGroupMember(userId) {
        try {
            const member = await this.bot.getChatMember(this.groupId, userId);
            return ['member', 'administrator', 'creator'].includes(member.status);
        } catch (error) {
            console.error('[CHECK_GROUP] Error:', error);
            return false;
        }
    }

    // =====================================================
    // 2. 欢迎消息 - 引导关注所有平台（优化版）
    // =====================================================

    async sendWelcomeWithLinks(chatId, userId) {
        const isChannelMember = await this.isChannelMember(userId);
        const isGroupMember = await this.isGroupMember(userId);
        const botUsername = await this.getBotUsername();
        
        // 获取今日奖池金额
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const isWeekend = [0, 6].includes(new Date().getDay());
        const poolAmount = isWeekend ? '₹5,000' : '₹2,000';
        
        // 构建吸引人的欢迎消息
        let welcomeMsg = 
            '🎰 *Welcome to Teen Patti Lucky Draw!*\n\n' +
            '💰 *Daily Cash Giveaway!*\n' +
            `Today's Prize Pool: *${poolAmount}*\n` +
            '⏰ Draw Time: *21:00 IST*\n\n' +
            '✨ *What You Get:*\n' +
            '🎁 FREE lottery numbers when you join\n' +
            '💸 Real cash prizes via UPI daily\n' +
            '🏆 Higher chances with more numbers\n\n';
        
        // 添加参与步骤
        welcomeMsg += 
            '📋 *How to Win:*\n' +
            '1️⃣ Click "Join Now" below\n' +
            '2️⃣ Enter your Game ID\n' +
            '3️⃣ Send screenshot\n' +
            '4️⃣ Get lucky numbers!\n\n';
        
        // 社群状态
        if (!isChannelMember && !isGroupMember) {
            welcomeMsg += 
                '🔔 *Join Our Community:*\n' +
                'Stay updated with daily draws, winners, and exclusive bonuses!\n\n' +
                '👇 *Click the buttons below to start:*';
        } else if (isChannelMember && isGroupMember) {
            welcomeMsg += 
                '✅ *You are all set!*\n' +
                'Click "Join Now" to get your lucky numbers!';
        } else {
            welcomeMsg += 
                '📢 *Complete Your Setup:*\n' +
                'Join remaining channels for full access!';
        }

        // 构建按钮（使用 @用户名 格式，不是数字ID）
        const inline_keyboard = [];
        
        // 频道按钮
        if (!isChannelMember) {
            inline_keyboard.push([{ 
                text: '📢 Join Official Channel', 
                url: 'https://t.me/' + this.channelUsername.replace('@', '')
            }]);
        }
        
        // 群组按钮
        if (!isGroupMember) {
            inline_keyboard.push([{ 
                text: '💬 Join Player Group', 
                url: 'https://t.me/' + this.groupUsername.replace('@', '')
            }]);
        }
        
        // 始终显示 Join Now 按钮
        inline_keyboard.push([{ 
            text: '🎮 Join Now', 
            callback_data: 'join_now'
        }]);

        await this.bot.sendMessage(chatId, welcomeMsg, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard }
        });
    }

    // =====================================================
    // 3. 频道 → 自动广播消息
    // =====================================================

    /**
     * 推送开奖结果到频道
     */
    async announceDrawResult(date, winners, poolAmount) {
        const botUsername = await this.getBotUsername();
        
        let msg = `🎉 *Lucky Draw Results - ${date}*\n\n`;
        msg += `💰 *Total Pool: ₹${poolAmount.toLocaleString()}*\n`;
        msg += `🏆 *${winners.length} Lucky Winners*\n\n`;
        
        winners.forEach((winner, index) => {
            const emoji = index === 0 ? '🥇' : index <= 2 ? '🥈' : '🥉';
            const prize = winner.prize.toLocaleString();
            msg += `${emoji} *₹${prize}*\n`;
            msg += `   Game ID: \`${winner.gameId}\`\n\n`;
        });
        
        msg += `⏰ *Next Draw: Tonight 21:00 IST*\n\n`;
        msg += `🎮 *Get your numbers: @${botUsername}*\n\n`;
        msg += `#TeenPatti #LuckyDraw #WinCash`;

        // 发送到频道
        const channelMsg = await this.bot.sendMessage(this.channelId, msg, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });

        // 同时转发到群组（带频道来源）
        await this.bot.forwardMessage(this.groupId, this.channelId, channelMsg.message_id);

        return channelMsg;
    }

    /**
     * 实时奖池更新
     */
    async updatePool(poolAmount, participantCount) {
        const botUsername = await this.getBotUsername();
        
        const msg = 
            `💰 *Pool Update*\n\n` +
            `Current Pool: *₹${poolAmount.toLocaleString()}*\n` +
            `Participants: *${participantCount}*\n` +
            `Draw: *Tonight 21:00 IST*\n\n` +
            `🎮 Join now: @${botUsername}`;

        await this.bot.sendMessage(this.channelId, msg, {
            parse_mode: 'Markdown'
        });
    }

    /**
     * 中奖者故事/喜报
     */
    async shareWinnerStory(winner) {
        const botUsername = await this.getBotUsername();
        
        const stories = [
            `🎉 *Big Win!*\n\n"I won ₹${winner.prize.toLocaleString()} yesterday! It was my 3rd day playing. The money came to my UPI in 2 hours. Totally legit!"\n\n- Game ID: ${winner.gameId}`,
            
            `🏆 *Success Story*\n\n"Started with just FREE numbers, now I'm a VIP member. Won ₹${winner.prize.toLocaleString()} last week!"\n\nJoin us: @${botUsername}`,
            
            `💰 *Daily Winner*\n\nCongratulations to Game ID ${winner.gameId} for winning *₹${winner.prize.toLocaleString()}*!\n\nYou could be next! 🎰`
        ];

        // 随机选择一个故事
        const story = stories[Math.floor(Math.random() * stories.length)];
        
        await this.bot.sendMessage(this.channelId, story, {
            parse_mode: 'Markdown'
        });
    }

    /**
     * 推广活动公告
     */
    async announceEvent(eventTitle, eventDetails, duration) {
        const botUsername = await this.getBotUsername();
        
        const msg = 
            `🎁 *SPECIAL EVENT* 🎁\n\n` +
            `*${eventTitle}*\n\n` +
            `${eventDetails}\n\n` +
            `⏰ Duration: *${duration}*\n\n` +
            `🎮 Participate: @${botUsername}\n` +
            `💬 Discuss: ${this.groupUsername}`;

        // 频道发送并置顶
        const eventMsg = await this.bot.sendMessage(this.channelId, msg, {
            parse_mode: 'Markdown'
        });

        // 置顶消息
        await this.bot.pinChatMessage(this.channelId, eventMsg.message_id);

        // 群组也发送
        await this.bot.sendMessage(this.groupId, msg, {
            parse_mode: 'Markdown'
        });
    }

    // =====================================================
    // 4. 群组 → 互动功能
    // =====================================================

    /**
     * 群组欢迎消息（新成员加入）- 60秒后自动删除
     */
    async sendGroupWelcome(chatId, newMemberName) {
        try {
            // 获取机器人用户名
            const botUsername = await this.getBotUsername();
            
            const msg = 
                `👋 Welcome *${newMemberName}*!\n\n` +
                `🎰 Teen Patti Lucky Draw\n` +
                `💰 Win ₹2,000-5,000 daily\n` +
                `🎁 FREE numbers on join\n\n` +
                `📢 Channel: @${this.channelUsername.replace('@', '')}\n` +
                `🎮 Play: @${botUsername}\n\n` +
                `Good luck! 🍀`;

            const sentMsg = await this.bot.sendMessage(chatId, msg, {
                parse_mode: 'Markdown'
            });
            
            // 60秒后自动删除欢迎消息（避免刷屏）
            setTimeout(async () => {
                try {
                    await this.bot.deleteMessage(chatId, sentMsg.message_id);
                    console.log(`[AUTO_DELETE] Deleted welcome message for ${newMemberName}`);
                } catch (err) {
                    // 忽略删除失败（可能消息已被删除）
                }
            }, 60000); // 60秒 = 60000毫秒
            
        } catch (error) {
            console.error('[SEND_GROUP_WELCOME] Error:', error);
        }
    }

    /**
     * 群组定时互动（活跃气氛）
     */
    async sendGroupEngagement(chatId) {
        const botUsername = await this.getBotUsername();
        
        const messages = [
            `💬 *Community Chat*\n\nWhat's your lucky number today? Share with us!`,
            
            `🎲 *Quick Poll*\n\nWhat tier are you aiming for?\nReply with: S (Silver) / G (Gold) / D (Diamond) / C (Crown)`,
            
            `💡 *Tip of the Day*\n\nVIP members get 1.5x weight on ALL numbers! Upgrade by recharging ₹5,000 for 5 days.`,
            
            `🎉 *Winners Celebration*\n\nYesterday's winners are enjoying their cash prizes! Will you be next? Join now: @${botUsername}`
        ];

        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        await this.bot.sendMessage(chatId, msg, {
            parse_mode: 'Markdown'
        });
    }

    /**
     * 群组红包/活动（使用 Bot API）
     */
    async sendGroupReward(chatId, rewardType) {
        if (rewardType === 'checkin_bonus') {
            const msg = 
                `🎁 *Group Activity Bonus!*\n\n` +
                `First 10 people to click the button get FREE Silver numbers!\n\n` +
                `🏃 Hurry up!`;

            const keyboard = {
                inline_keyboard: [[
                    { text: '🎁 Claim FREE Numbers', callback_data: 'claim_group_bonus' }
                ]]
            };

            await this.bot.sendMessage(chatId, msg, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            });
        }
    }

    // =====================================================
    // 5. 机器人 ↔ 频道/群组 数据互通
    // =====================================================

    /**
     * 获取频道订阅人数
     */
    async getChannelStats() {
        try {
            const chat = await this.bot.getChat(this.channelId);
            return {
                title: chat.title,
                members: chat.username ? 'public' : 'private'
            };
        } catch (error) {
            console.error('[CHANNEL_STATS] Error:', error);
            return null;
        }
    }

    /**
     * 获取频道人数
     */
    async getChannelStats() {
        try {
            // Telegram Bot API 使用 getChatMemberCount (注意没有 's')
            const count = await this.bot.getChatMemberCount(this.channelId);
            return { memberCount: count };
        } catch (error) {
            console.error('[CHANNEL_STATS] Error:', error.message);
            return { memberCount: 0 };
        }
    }

    /**
     * 获取群组人数
     */
    async getGroupStats() {
        try {
            // Telegram Bot API 使用 getChatMemberCount (注意没有 's')
            const count = await this.bot.getChatMemberCount(this.groupId);
            return { memberCount: count };
        } catch (error) {
            console.error('[GROUP_STATS] Error:', error.message);
            return { memberCount: 0 };
        }
    }

    /**
     * 跨平台通知（重要事件）
     */
    async broadcastImportant(message) {
        // 发送到频道
        await this.bot.sendMessage(this.channelId, 
            `📢 *Important Announcement*\n\n${message}`, 
            { parse_mode: 'Markdown' }
        );

        // 发送到群组
        await this.bot.sendMessage(this.groupId, 
            `📢 *Important*\n\n${message}`, 
            { parse_mode: 'Markdown' }
        );
    }
}

module.exports = ChannelGroupBotIntegration;
