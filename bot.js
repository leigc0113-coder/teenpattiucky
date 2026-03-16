/**
 * ============================================================
 * Game Number Lottery Bot - Main Entry (FLOW UPDATED)
 * 游戏号码抽奖机器人 - 主入口（流程更新版）
 * ============================================================
 *
 * NEW FLOW:
 * 1. /start → Show Welcome + [Join Now] button
 * 2. Click [Join Now] → Ask for screenshot
 * 3. Send screenshot → Ask for Game ID
 * 4. Enter Game ID → Submit for review
 * 5. Admin approves → Send lottery numbers
 */

const TelegramBot = require('node-telegram-bot-api');
const Database = require('./database');
const CONFIG = require('./config');

// 引入服务模块
const UserService = require('./userService');
const TierService = require('./tierService');
const VIPService = require('./vipService');
const LotteryService = require('./lotteryService');
const NumberTierService = require('./numberTierService');
const CheckinService = require('./checkinService');
const PoolService = require('./poolService');
const DrawService = require('./drawService');
const InviteService = require('./inviteService');
const RechargeService = require('./rechargeService');

// 引入私域联动系统
const ChannelGroupBotIntegration = require('./integration');

// 状态管理
const userState = new Map();
const pendingScreenshots = new Map();

const bot = new TelegramBot(CONFIG.BOT_TOKEN, { polling: true });

// 初始化私域联动系统
const integration = new ChannelGroupBotIntegration(bot);

// 初始化数据库
Database.init().then(() => {
    console.log('✅ Database initialized');
}).catch(err => {
    console.error('❌ Database init failed:', err);
});

console.log('🤖 Bot Starting...');

// ==================== Helper Functions ====================

function getTodayIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
}

function getNowIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

function formatTimeIST(date) {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    });
}

function getDrawCountdown() {
    const now = new Date();
    // Convert to IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);

    // Create 21:00 IST today
    let drawTime = new Date(istTime);
    drawTime.setHours(21, 0, 0, 0);

    // If already passed, set to tomorrow
    if (istTime > drawTime) {
        drawTime.setDate(drawTime.getDate() + 1);
    }

    // Calculate difference in milliseconds
    const diff = drawTime - istTime;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, text: `${hours}h ${minutes}m` };
}

function getPoolDisplay() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return isWeekend ? '₹5,000' : '₹2,000';
}

// ==================== Menu Buttons ====================

function getMainMenu() {
    return {
        reply_markup: {
            keyboard: [
                ['My Account', 'Recharge'],
                ['Daily Check-in', 'Invite Friends'],
                ['Current Pool', '❓ Help']
            ],
            resize_keyboard: true
        }
    };
}

function getHelpMenu() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚖️ What is Weight?', callback_data: 'explain_weight' }],
                [{ text: '🎫 How to Get Numbers?', callback_data: 'explain_numbers' }],
                [{ text: '🏆 Prize Tiers', callback_data: 'explain_tiers' }],
                [{ text: '🔥 VIP Benefits', callback_data: 'explain_vip' }],
                [{ text: '📋 Full Guide', callback_data: 'show_rules' }]
            ]
        }
    };
}

function getStartMenu(inviteCode = null) {
    const poolAmount = getPoolDisplay();
    const buttons = [
        [{ text: '🎮 Join Now', callback_data: 'join_now' }],
        [{ text: '📋 Rules', callback_data: 'show_rules' }],
        [{ text: '📞 Support', callback_data: 'support' }]
    ];

    return {
        reply_markup: {
            inline_keyboard: buttons
        }
    };
}

// ==================== /start ====================

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const inviteCode = match ? match[1] : null;

    console.log(`[START] User: ${userId}, InviteCode: ${inviteCode}`);

    try {
        const existingUser = await UserService.getUserByTelegramId(userId);

        if (existingUser) {
            const tier = await TierService.getTierIdentity(existingUser.id);
            const poolAmount = getPoolDisplay();

            await bot.sendMessage(chatId,
                `👋 *Welcome back!*\n\n` +
                `🏆 Tier: ${tier?.displayName || 'Waiting List'}\n` +
                `💰 Today's Pool: ${poolAmount}\n` +
                `⏰ Draw: 21:00 IST\n\n` +
                `Use buttons below:`,
                { parse_mode: 'Markdown', ...getMainMenu() }
            );
            return;
        }

        // New user - check channel subscription first
        if (inviteCode) {
            userState.set(userId, { inviteCode });
        }
        
        // Check if channel subscription is required
        if (CONFIG.REQUIRE_CHANNEL_SUBSCRIPTION) {
            const isMember = await integration.isChannelMember(userId);
            if (!isMember) {
                await bot.sendMessage(chatId,
                    '🎰 *Welcome to Teen Patti Lucky Draw!*\n\n' +
                    '💰 Win real cash daily with FREE lottery numbers!\n\n' +
                    '⚠️ *Please join our official channel first:*\n\n' +
                    '📢 Official Channel: ' + CONFIG.CHANNEL_ID + '\n' +
                    '💬 Player Group: ' + CONFIG.GROUP_ID + '\n\n' +
                    '👆 Click the links above to join, then click /start again',
                    { 
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ 
                                    text: '📢 Join Official Channel', 
                                    url: 'https://t.me/' + CONFIG.CHANNEL_ID.replace('@', '') 
                                }],
                                [{ 
                                    text: '💬 Join Player Group', 
                                    url: 'https://t.me/' + CONFIG.GROUP_ID.replace('@', '') 
                                }]
                            ]
                        }
                    }
                );
                return;
            }
        }
        
        // Send welcome message with channel/group info
        await integration.sendWelcomeWithLinks(chatId, userId);
    } catch (error) {
        console.error('[START] Error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    }
});

// ==================== Callback Handlers ====================

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const messageId = query.message.message_id;

    console.log(`[CALLBACK] User: ${userId}, Data: ${data}`);

    try {
        // ===== 立即参与 =====
        if (data === 'join_now') {
            userState.set(userId, {
                step: 'waiting_screenshot',
                timestamp: Date.now()
            });

            await bot.editMessageText(
                '📱 *How to Participate:*\n\n' +
                '1️⃣ Open Teen Patti Master game\n' +
                '2️⃣ Recharge any amount\n' +
                '3️⃣ *Screenshot the payment success page*\n' +
                '4️⃣ Send the screenshot here\n\n' +
                '⚠️ *Screenshot must show:*\n' +
                '• Payment amount\n' +
                '• Transaction time\n\n' +
                '📤 *Please send your screenshot now:*',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel_join' }]]
                    }
                }
            );

            await bot.answerCallbackQuery(query.id, { text: '📸 Please send screenshot' });
            return;
        }

        // ===== 取消参与 =====
        if (data === 'cancel_join') {
            userState.delete(userId);
            pendingScreenshots.delete(userId);

            await bot.editMessageText(
                '❌ Participation cancelled.\n\n' +
                'Click /start to try again.',
                {
                    chat_id: chatId,
                    message_id: messageId
                }
            );

            await bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
            return;
        }

        // ===== 规则说明 =====
        if (data === 'show_rules') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '📋 Rules:\n\n' +
                      '1. Recharge in Teen Patti Master\n' +
                      '2. Send screenshot for verification\n' +
                      '3. Enter your Game ID\n' +
                      '4. Get lottery numbers based on recharge amount\n' +
                      '5. Wait for 21:00 IST draw\n\n' +
                      '💰 Prizes sent via UPI within 48h'
            });
            return;
        }

        // ===== 解释权重 =====
        if (data === 'explain_weight') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '⚖️ What is Weight?\n\n' +
                      'Weight = Your winning chance multiplier\n\n' +
                      '🎁 Free: 1x\n' +
                      '⭐ Silver: 2-3x\n' +
                      '⭐⭐ Gold: 4-6x\n' +
                      '⭐⭐⭐ Diamond: 6-9x\n' +
                      '👑 Crown: 8-15x\n' +
                      '👑👑 VIP: 18x\n\n' +
                      '💡 Higher weight = Higher win probability!\n' +
                      '💡 VIP gets 1.5x on ALL numbers!'
            });
            return;
        }

        // ===== 解释如何获得号码 =====
        if (data === 'explain_numbers') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '🎫 How to Get Numbers?\n\n' +
                      '1️⃣ Recharge ₹100 → 2 Silver numbers\n' +
                      '2️⃣ Recharge ₹500 → 4 Gold numbers\n' +
                      '3️⃣ Recharge ₹2000 → 6 Diamond numbers\n' +
                      '4️⃣ Recharge ₹5000 → 8 Crown numbers\n' +
                      '5️⃣ Daily check-in → 1 Free number\n' +
                      '6️⃣ Invite friends → Get bonus numbers\n\n' +
                      '💰 More recharge = More numbers!'
            });
            return;
        }

        // ===== 解释奖项等级 =====
        if (data === 'explain_tiers') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '🏆 Prize Distribution:\n\n' +
                      '🥇 1st Prize: 40% of pool\n' +
                      '🥈 2nd Prize: 20% of pool (2 winners)\n' +
                      '🥉 3rd Prize: 20% of pool (remaining)\n\n' +
                      'Example (₹10,000 pool):\n' +
                      '🥇 ₹4,000\n' +
                      '🥈 ₹2,000 each\n' +
                      '🥉 Share ₹2,000'
            });
            return;
        }

        // ===== 解释VIP =====
        if (data === 'explain_vip') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '🔥 VIP Benefits:\n\n' +
                      '✅ 1.5x weight on ALL numbers\n' +
                      '✅ Permanent VIP status\n' +
                      '✅ Exclusive VIP numbers\n\n' +
                      'How to get VIP:\n' +
                      'Recharge ₹5,000 for 5 consecutive days\n\n' +
                      '💡 Example:\n' +
                      'Gold number: 4x → 6x (VIP)\n' +
                      'Your win rate increases by 50%!'
            });
            return;
        }

        // ===== 客服支持 =====
        if (data === 'support') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '📞 Support:\n\n' +
                      'For any issues, please contact admin.\n' +
                      'We\'re here to help!'
            });
            return;
        }

        // ===== 复制邀请链接 =====
        if (data === 'copy_invite_link') {
            await bot.answerCallbackQuery(query.id, {
                show_alert: true,
                text: '✅ Link ready to copy!\n\n' +
                      'Long press the link in the message above to copy.'
            });
            return;
        }

        // ===== 管理员审核 =====
        if (data.startsWith('approve_') || data.startsWith('reject_')) {
            await handleAdminApproval(query, data);
            return;
        }

    } catch (error) {
        console.error('[CALLBACK] Error:', error);
        await bot.answerCallbackQuery(query.id, { text: '❌ Error occurred' });
    }
});

// ==================== Photo Upload Handler ====================

bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const state = userState.get(userId);

        // 检查是否在新用户等待截图状态
        if (state && state.step === 'waiting_screenshot') {
            // 检查超时（30分钟）
            if (Date.now() - state.timestamp > 30 * 60 * 1000) {
                userState.delete(userId);
                await bot.sendMessage(chatId, '⏰ Session expired. Please click /start to restart.');
                return;
            }

            const photoFileId = msg.photo[msg.photo.length - 1].file_id;

            // 保存截图并更新状态
            pendingScreenshots.set(userId, {
                photoFileId,
                timestamp: Date.now()
            });

            userState.set(userId, {
                ...state,
                step: 'waiting_gameid',
                photoFileId
            });

            await bot.sendMessage(chatId,
                '✅ *Screenshot received!*\n\n' +
                '🎮 *Please enter your Teen Patti Game ID:*\n' +
                '(You can find it in your game profile)\n\n' +
                '💡 *Example:* `1234567`',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // 检查是否在重新充值等待截图状态
        if (state && state.step === 'waiting_recharge_screenshot') {
            // 检查超时（30分钟）
            if (Date.now() - state.timestamp > 30 * 60 * 1000) {
                userState.delete(userId);
                await bot.sendMessage(chatId, '⏰ Session expired. Please click Recharge again.');
                return;
            }

            const photoFileId = msg.photo[msg.photo.length - 1].file_id;
            const user = await UserService.getUserByTelegramId(userId);

            if (!user) {
                await bot.sendMessage(chatId, '❌ Error: User not found. Please /start again.');
                userState.delete(userId);
                return;
            }

            // 直接提交审核（不需要输入GameID）
            const processingMsg = await bot.sendMessage(chatId, '⏳ Submitting your recharge...');

            try {
                // 提交充值审核
                const recharge = await RechargeService.submitRechargeForReview(
                    user.id,
                    photoFileId,
                    user.gameId
                );

                // 清理状态
                userState.delete(userId);
                await bot.deleteMessage(chatId, processingMsg.message_id);

                // 发送确认消息给用户
                await bot.sendMessage(chatId,
                    '✅ *Recharge Submitted!*\n\n' +
                    '📋 *Details:*\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    `🎮 Game ID: ${user.gameId}\n` +
                    `📸 Screenshot: Uploaded\n` +
                    '━━━━━━━━━━━━━━━\n\n' +
                    '⏳ *Status:* Pending admin review\n' +
                    '⏱️ Usually takes 5-30 minutes\n\n' +
                    '📢 *After approval, you will receive:*\n' +
                    '• Lottery numbers based on your recharge amount',
                    { parse_mode: 'Markdown', ...getMainMenu() }
                );

                // 通知管理员
                await notifyAdmins(user, recharge, photoFileId, user.gameId);

            } catch (error) {
                console.error('[RECHARGE] Submit error:', error);
                await bot.deleteMessage(chatId, processingMsg.message_id);
                await bot.sendMessage(chatId, '❌ Submission failed. Please try again.');
                userState.delete(userId);
            }
            return;
        }

        // 不在任何等待截图状态
        await bot.sendMessage(chatId,
            '⚠️ Please click "🎮 Join Now" or "Recharge" first to start the process.',
            getMainMenu()
        );

    } catch (error) {
        console.error('[PHOTO] Error:', error);
        await bot.sendMessage(chatId, '❌ Error processing screenshot. Please try again.');
    }
});

// ==================== Game ID Input Handler ====================

// 处理错误的游戏ID输入（非7位数字）
bot.onText(/^(?!\d{7}$).+$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text.trim();

    // 忽略命令和其他按钮点击
    if (text.startsWith('/') ||
        ['My Account', 'Join Now', 'Daily Check-in', 'Invite Friends', 'Current Pool', 'Help', 'Recharge'].includes(text)) {
        return;
    }

    const state = userState.get(userId);

    // 只在等待游戏ID状态时响应
    if (state && state.step === 'waiting_gameid') {
        await bot.sendMessage(chatId,
            '⚠️ *Invalid Game ID format!*\n\n' +
            '🎮 Game ID must be *exactly 7 digits*\n' +
            '💡 Example: `1234567`\n\n' +
            'Please try again:',
            { parse_mode: 'Markdown' }
        );
    }
});

bot.onText(/^\d{7}$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const gameId = msg.text.trim();

    try {
        const state = userState.get(userId);
        const screenshotData = pendingScreenshots.get(userId);

        // 检查是否在等待游戏ID状态
        if (!state || state.step !== 'waiting_gameid') {
            return; // 忽略非预期的7位数字输入
        }

        if (!screenshotData) {
            await bot.sendMessage(chatId, '❌ Error: Screenshot not found. Please start over with /start');
            userState.delete(userId);
            return;
        }

        // 检查游戏ID是否已被使用
        const existingUser = await UserService.getUserByGameId(gameId);
        if (existingUser) {
            await bot.sendMessage(chatId,
                '⚠️ *This Game ID is already registered.*\n\n' +
                'Please check your Game ID and try again, or contact support if this is your account.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const processingMsg = await bot.sendMessage(chatId, '⏳ Submitting your application...');

        // 创建用户记录
        const user = await UserService.createUser(
            userId,
            gameId,
            msg.from.username || msg.from.first_name,
            'NEW'
        );

        // 分配等级身份
        const tierIdentity = await TierService.assignTierNumber(user.id);

        // 提交充值审核（金额为0，等待管理员确认）
        const recharge = await RechargeService.submitRechargeForReview(
            user.id,
            screenshotData.photoFileId,
            gameId
        );

        // 处理邀请奖励
        let inviteBonusText = '';
        if (state.inviteCode) {
            const inviteSuccess = await InviteService.processInviteRegister(user.id, state.inviteCode);
            if (inviteSuccess) {
                inviteBonusText = '\n\n🎁 *Invite bonus will be added after approval!*';
            }
        }

        // 清理状态
        userState.delete(userId);
        pendingScreenshots.delete(userId);

        // 删除处理中消息
        await bot.deleteMessage(chatId, processingMsg.message_id);

        // 发送确认消息给用户
        await bot.sendMessage(chatId,
            '✅ *Application Submitted!*\n\n' +
            '📋 *Application Details:*\n' +
            '━━━━━━━━━━━━━━━\n' +
            `🎮 Game ID: ${gameId}\n` +
            `📸 Screenshot: Uploaded\n` +
            '━━━━━━━━━━━━━━━\n\n' +
            '⏳ *Status:* Pending admin review\n' +
            '⏱️ Usually takes 5-30 minutes\n\n' +
            '📢 *After approval, you will receive:*\n' +
            '• Lottery numbers based on your recharge amount\n' +
            '• Entry into today\'s draw at 21:00 IST' +
            inviteBonusText,
            { parse_mode: 'Markdown', ...getMainMenu() }
        );

        // 通知管理员
        await notifyAdmins(user, recharge, screenshotData.photoFileId, gameId);

    } catch (error) {
        console.error('[GAMEID] Error:', error);
        await bot.sendMessage(chatId, '❌ Submission failed. Please try again with /start');
        userState.delete(userId);
        pendingScreenshots.delete(userId);
    }
});

// ==================== Admin Notification ====================

async function notifyAdmins(user, recharge, photoFileId, gameId) {
    const adminMsg =
        `🔔 *New Recharge Pending Review!*\n\n` +
        `👤 User: ${user.telegramId}\n` +
        `🎮 Game ID: ${gameId}\n` +
        `🆔 Ref: ${recharge.id.slice(-8)}\n\n` +
        `💰 *Select Amount to Approve:*`;

    const adminButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ ₹100', callback_data: `approve_${recharge.id}_100` },
                    { text: '✅ ₹300', callback_data: `approve_${recharge.id}_300` },
                    { text: '✅ ₹500', callback_data: `approve_${recharge.id}_500` }
                ],
                [
                    { text: '✅ ₹1K', callback_data: `approve_${recharge.id}_1000` },
                    { text: '✅ ₹2K', callback_data: `approve_${recharge.id}_2000` },
                    { text: '✅ ₹5K', callback_data: `approve_${recharge.id}_5000` }
                ],
                [
                    { text: '✅ ₹10K', callback_data: `approve_${recharge.id}_10000` },
                    { text: '✅ ₹20K', callback_data: `approve_${recharge.id}_20000` }
                ],
                [
                    { text: '❌ Reject', callback_data: `reject_${recharge.id}_Invalid` }
                ]
            ]
        }
    };

    if (CONFIG.ADMIN_IDS && CONFIG.ADMIN_IDS.length > 0) {
        for (const adminId of CONFIG.ADMIN_IDS) {
            try {
                await bot.sendPhoto(adminId, photoFileId, {
                    caption: adminMsg,
                    parse_mode: 'Markdown',
                    ...adminButtons
                });
            } catch (e) {
                console.error(`[ADMIN] Notify admin ${adminId} failed:`, e);
            }
        }
    }
}

// ==================== Admin Approval Handler ====================

async function handleAdminApproval(query, data) {
    const chatId = query.message.chat.id;
    const adminId = query.from.id;
    const messageId = query.message.message_id;

    if (!CONFIG.ADMIN_IDS.includes(adminId)) {
        await bot.answerCallbackQuery(query.id, { text: '❌ No permission' });
        return;
    }

    try {
        if (data.startsWith('approve_')) {
            // 解析格式: approve_rechargeId_amount
            // rechargeId 可能包含下划线，需要从后面解析
            const match = data.match(/^approve_(.+)_(\d+)$/);
            if (!match) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Invalid data format' });
                return;
            }
            const rechargeId = match[1];
            const amount = parseInt(match[2]);

            console.log(`[ADMIN] Parsed: rechargeId=${rechargeId}, amount=${amount}`);

            await processApproval(adminId, chatId, rechargeId, amount, messageId);
            await bot.answerCallbackQuery(query.id, { text: `✅ Approved ₹${amount}` });
            return;
        }

        if (data.startsWith('reject_')) {
            // 解析格式: reject_rechargeId_reason
            const match = data.match(/^reject_(.+)_(.+)$/);
            if (!match) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Invalid data format' });
                return;
            }
            const rechargeId = match[1];
            const reason = match[2] || 'Rejected';

            await processRejection(adminId, chatId, rechargeId, reason, messageId);
            await bot.answerCallbackQuery(query.id, { text: '❌ Rejected' });
            return;
        }

    } catch (error) {
        console.error('[ADMIN] Approval error:', error);
        await bot.answerCallbackQuery(query.id, { text: '❌ Failed' });
    }
}

async function processApproval(adminId, chatId, rechargeId, amount, messageId) {
    console.log(`[APPROVE] Starting: recharge=${rechargeId}, amount=${amount}`);

    let recharge = await Database.findById('recharges', rechargeId);
    if (!recharge) {
        const allRecharges = await Database.getAll('recharges');
        recharge = allRecharges.find(r => r.id.includes(rechargeId));
    }

    if (!recharge || recharge.status !== 'PENDING') {
        await bot.editMessageCaption('⚠️ Already processed', {
            chat_id: chatId,
            message_id: messageId
        });
        return;
    }

    try {
        // 更新充值记录
        console.log(`[APPROVE] Approving recharge ${recharge.id} with amount ${amount}`);
        const approveResult = await RechargeService.approveRecharge(recharge.id, amount, String(adminId));
        if (!approveResult) {
            throw new Error('Approve recharge failed');
        }
        console.log(`[APPROVE] Approved: tier=${approveResult.tierConfig?.tier}, count=${approveResult.tierConfig?.count}`);

        const today = getTodayIST();
        const user = await Database.findById('users', recharge.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 生成号码
        console.log(`[APPROVE] Generating numbers: user=${recharge.userId}, amount=${amount}`);
        const numbers = await LotteryService.generateNumbers(recharge.userId, amount, 'recharge', today);
        console.log(`[APPROVE] Numbers generated: count=${numbers?.count}, tier=${numbers?.tier?.name}`);

        if (!numbers || !numbers.numbers || numbers.numbers.length === 0) {
            throw new Error('Failed to generate numbers');
        }

        // 更新等级
        const tierResult = await TierService.addRecharge(recharge.userId, amount);

        // 检查VIP资格
        await VIPService.processVIPCheck(recharge.userId, today);

        // 处理邀请首充奖励
        if (amount >= 100) {
            const inviterId = await InviteService.getInviterId(recharge.userId);
            if (inviterId) {
                await InviteService.processInviteRecharge(recharge.userId, amount);
                const inviter = await Database.findById('users', inviterId);
                if (inviter) {
                    const inviteReward = await LotteryService.generateFreeNumbers(inviterId, 'invite_recharge', today, 2);
                    await bot.sendMessage(
                        inviter.telegramId,
                        `🎉 *Your friend recharged ₹${amount}!*\n\n` +
                        `You got 2 Gold bonus numbers:\n` +
                        inviteReward.map(n => `${n.emoji} *${n.number}*`).join('\n'),
                        { parse_mode: 'Markdown' }
                    );
                }
            }
        }

        // 获取用户统计
        const userStats = await LotteryService.getUserNumberStats(recharge.userId, today);

        // 构建用户通知消息
        let userMsg =
            `🎉 *Application Approved!*\n\n` +
            `💰 Amount: ₹${amount.toLocaleString()}\n` +
            `🏆 Tier: ${numbers.tier?.emoji || '⭐'} *${numbers.tier?.name || 'Standard'}*\n` +
            `🎁 You received ${numbers.count || 0} lottery numbers:\n`;

        // 号码展示框
        if (numbers.numbers && numbers.numbers.length > 0) {
            userMsg += `\`┌─────────────────────────┐\`\n`;

            // 显示号码，每行3个
            for (let i = 0; i < numbers.numbers.length; i += 3) {
                const row = numbers.numbers.slice(i, i + 3).map(n => n?.number || '').join(' ');
                userMsg += `\`│ ${row.padEnd(23)} │\`\n`;
            }

            userMsg += `\`└─────────────────────────┘\`\n\n`;
        }

        userMsg +=
            `⚖️ Weight: ${numbers.baseWeight || 1}x each\n` +
            `📊 Total numbers: ${userStats.totalCount || 0}\n` +
            `⚡ Total weight: ${userStats.totalWeight || 0}x\n\n` +
            `💰 Today's Pool: ${getPoolDisplay()}\n` +
            `⏰ Draw Time: Tonight 21:00 IST\n\n` +
            `📌 *Save your numbers!*`;

        if (tierResult?.upgraded) {
            userMsg += `\n\n🆙 *Upgraded to Level ${tierResult.newLevel}!* 🎊`;
        }

        // 发送给用户
        await bot.sendMessage(user.telegramId, userMsg, {
            parse_mode: 'Markdown',
            ...getMainMenu()
        });

        // 更新管理员消息
        await bot.editMessageCaption(
            `✅ *APPROVED*\n\n` +
            `👤 User: ${user.gameId || user.telegramId}\n` +
            `💰 Amount: ₹${amount.toLocaleString()}\n` +
            `🎁 Sent: ${numbers.count} numbers`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            }
        );

    } catch (error) {
        console.error('[APPROVE] Error:', error);
        await bot.sendMessage(chatId, '❌ Approval failed: ' + error.message);
    }
}

async function processRejection(adminId, chatId, rechargeId, reason, messageId) {
    let recharge = await Database.findById('recharges', rechargeId);
    if (!recharge) {
        const allRecharges = await Database.getAll('recharges');
        recharge = allRecharges.find(r => r.id.includes(rechargeId));
    }

    if (!recharge || recharge.status !== 'PENDING') {
        await bot.editMessageCaption('⚠️ Already processed', {
            chat_id: chatId,
            message_id: messageId
        });
        return;
    }

    try {
        await RechargeService.rejectRecharge(recharge.id, String(adminId), reason);

        const user = await Database.findById('users', recharge.userId);
        if (user) {
            await bot.sendMessage(user.telegramId,
                `❌ *Application Rejected*\n\n` +
                `Reason: ${reason}\n\n` +
                `Please ensure:\n` +
                `• Screenshot is clear\n` +
                `• Shows payment amount & time\n` +
                `• Game ID is correct\n\n` +
                `Submit a new application with /start`,
                { parse_mode: 'Markdown', ...getMainMenu() }
            );
        }

        await bot.editMessageCaption(
            `❌ *REJECTED*\n\n` +
            `👤 User: ${user?.gameId || 'Unknown'}\n` +
            `Reason: ${reason}`,
            {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            }
        );

    } catch (error) {
        console.error('[REJECT] Error:', error);
        await bot.sendMessage(chatId, '❌ Rejection failed');
    }
}

// ==================== Other Message Handlers ====================

// My Account
bot.onText(/\/myaccount|My Account/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const user = await UserService.getUserByTelegramId(userId);
        if (!user) {
            await bot.sendMessage(chatId,
                '⚠️ Please join first!\nClick "🎮 Join Now" to start.',
                getMainMenu()
            );
            return;
        }

        await UserService.updateLastActive(user.id);

        const today = getTodayIST();
        const tier = await TierService.getTierIdentity(user.id);
        const stats = await LotteryService.getUserNumberStats(user.id, today);
        const vipProgress = await VIPService.getVIPProgress(user.id);

        let pool = null;
        try {
            pool = await PoolService.getTodayPool();
            if (!pool || !pool.finalAmount) {
                pool = await PoolService.calculateDailyPool(today);
            }
        } catch (e) {
            console.error('[ACCOUNT] Get pool failed:', e);
        }

        let msg_text = '👤 *My Account*\n';
        msg_text += '━━━━━━━━━━━━━━━━\n\n';

        if (tier) {
            msg_text += `🏆 *Tier: ${tier.displayName}*\n`;
            msg_text += `💰 Total Recharge: ₹${(tier.totalRecharge || 0).toLocaleString()}\n`;

            if (tier.level < 10) {
                const nextThreshold = CONFIG.TIER_THRESHOLDS[tier.level + 1];
                const remaining = nextThreshold - (tier.totalRecharge || 0);
                msg_text += `📈 Next level: ₹${remaining.toLocaleString()}\n`;
            } else {
                msg_text += `🌟 Max Level!\n`;
            }

            if (tier.isVIP) {
                msg_text += `👑 VIP: Permanent\n`;
            } else if (vipProgress && !vipProgress.isVIP) {
                msg_text += `\n👑 VIP: ${vipProgress.consecutiveDays}/5 days\n`;
            }
        } else {
            msg_text += `⏳ Tier: Waiting List\n`;
        }

        msg_text += '\n';

        if (stats.totalCount > 0) {
            msg_text += '🎫 *My Numbers:*\n';
            msg_text += NumberTierService.formatNumbersDisplay(stats.numbers, true);
            msg_text += '\n\n';
        } else {
            msg_text += '🎫 *No numbers yet*\n';
            msg_text += 'Click "Join Now" to participate!\n\n';
        }

        msg_text += '📊 *Statistics:*\n';
        msg_text += `• Total: ${stats.totalCount || 0} numbers\n`;
        msg_text += `• Weight: ${stats.totalWeight || 0}x\n`;

        if (stats.probability?.probability) {
            msg_text += `• Win Rate: ${stats.probability.probability}%\n`;
        }

        let poolDisplay = getPoolDisplay();
        if (pool && pool.finalAmount > 0) {
            poolDisplay = `₹${pool.finalAmount.toLocaleString()}`;
        }

        msg_text += `\n💎 *Today\'s Pool:* ${poolDisplay}\n`;
        msg_text += `🎲 Draw: 21:00 IST`;

        await bot.sendMessage(chatId, msg_text, {
            parse_mode: 'Markdown',
            ...getMainMenu()
        });
    } catch (error) {
        console.error('[ACCOUNT] Error:', error);
        await bot.sendMessage(chatId, '❌ Error loading account info.');
    }
});

// Join Now - Alternative way
bot.onText(/Join Now/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const existingUser = await UserService.getUserByTelegramId(userId);
    if (existingUser) {
        await bot.sendMessage(chatId,
            '👋 You are already registered!\n\n' +
            'Use "My Account" to view your numbers.',
            getMainMenu()
        );
        return;
    }

    // 设置状态为等待截图
    userState.set(userId, {
        step: 'waiting_screenshot',
        timestamp: Date.now()
    });

    await bot.sendMessage(chatId,
        '📱 *How to Participate:*\n\n' +
        '1️⃣ Open Teen Patti Master game\n' +
        '2️⃣ Recharge any amount\n' +
        '3️⃣ *Screenshot the payment success page*\n' +
        '4️⃣ Send the screenshot here\n\n' +
        '⚠️ *Screenshot must show:*\n' +
        '• Payment amount\n' +
        '• Transaction time\n\n' +
        '📤 *Please send your screenshot now:*',
        { parse_mode: 'Markdown' }
    );
});

// Recharge - For existing users to recharge again
bot.onText(/Recharge/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const user = await UserService.getUserByTelegramId(userId);

        if (!user) {
            // 未注册用户，引导到 Join Now 流程
            await bot.sendMessage(chatId,
                '👋 *Welcome!*\n\n' +
                'You need to register first.\n' +
                'Click /start to begin.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // 已注册用户，设置状态为等待截图（重新充值）
        userState.set(userId, {
            step: 'waiting_recharge_screenshot',
            userId: user.id,
            timestamp: Date.now()
        });

        const tier = await TierService.getTierIdentity(user.id);

        await bot.sendMessage(chatId,
            '💰 *Recharge to Get More Numbers!*\n\n' +
            `🏆 Your Current Tier: ${tier?.displayName || 'Standard'}\n` +
            `💎 Total Recharged: ₹${(tier?.totalRecharge || 0).toLocaleString()}\n\n` +
            '📱 *Steps:*\n' +
            '1️⃣ Open Teen Patti Master game\n' +
            '2️⃣ Recharge any amount\n' +
            '3️⃣ *Screenshot the payment success page*\n' +
            '4️⃣ Send the screenshot here\n\n' +
            '⚠️ *Screenshot must show:*\n' +
            '• Payment amount\n' +
            '• Transaction time\n\n' +
            '📤 *Please send your screenshot now:*',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('[RECHARGE] Error:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again.');
    }
});

// Daily Check-in
bot.onText(/\/checkin|Daily Check-in/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const user = await UserService.getUserByTelegramId(userId);
        if (!user) {
            await bot.sendMessage(chatId, '⚠️ Please join first!', getMainMenu());
            return;
        }

        const result = await CheckinService.checkin(user.id);

        if (!result.success) {
            await bot.sendMessage(chatId, '⏰ Already checked in today!', getMainMenu());
            return;
        }

        const today = getTodayIST();
        const numbers = await LotteryService.generateFreeNumbers(user.id, 'checkin', today, result.rewardCount);

        let checkinMsg =
            `✅ *Check-in Successful!*\n\n` +
            `🔥 Streak: *${result.consecutiveDays}* days\n`;

        if (result.isWeeklyBonus) {
            checkinMsg += `🎉 7-day streak bonus!\n`;
        }

        checkinMsg += `\n🎁 *Got Numbers:*\n`;
        for (const num of numbers) {
            checkinMsg += `${num.emoji} *${num.number}*\n`;
        }

        checkinMsg += `\n📅 Draw: 21:00 IST`;

        await bot.sendMessage(chatId, checkinMsg, { parse_mode: 'Markdown', ...getMainMenu() });
    } catch (error) {
        console.error('[CHECKIN] Error:', error);
        await bot.sendMessage(chatId, '❌ Check-in failed.');
    }
});

// Invite Friends
bot.onText(/\/invite|Invite Friends/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const user = await UserService.getUserByTelegramId(userId);
        if (!user) {
            await bot.sendMessage(chatId, '⚠️ Please join first!', getMainMenu());
            return;
        }

        let inviteRecord = await InviteService.getUserInviteRecord(user.id);
        if (!inviteRecord) {
            inviteRecord = await InviteService.createInviteRecord(user.id);
        }

        const stats = await InviteService.getInviteStats(user.id);
        const botInfo = await bot.getMe();
        const inviteLink = `https://t.me/${botInfo.username}?start=${inviteRecord.inviteCode}`;

        // 分享链接
        const shareText = encodeURIComponent(
            `🎰 Join Teen Patti Master Lucky Draw!\n` +
            `💰 Win up to ₹5,000 daily!\n` +
            `🎁 Get FREE lottery numbers!\n` +
            `👇 Join now:`
        );

        const inviteMsg =
            '🎁 *Invite Friends & Win!*\n\n' +
            '💰 *Rewards:*\n' +
            '• Friend joins → You get 2 Silver numbers ⭐\n' +
            '• Friend recharges ≥₹100 → You get 2 Gold numbers ⭐⭐\n\n' +
            '📊 *Your Stats:*\n' +
            `• Invited: ${stats.registered}/${stats.total}\n` +
            `• Recharged: ${stats.recharged}\n\n` +
            `🔗 *Your Invite Link:*\n` +
            `\`${inviteLink}\``;

        // 分享按钮
        const shareButtons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📤 Share on Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${shareText}` }
                    ],
                    [
                        { text: '📘 Share on Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}` },
                        { text: '💬 Share on WhatsApp', url: `https://wa.me/?text=${shareText}%20${encodeURIComponent(inviteLink)}` }
                    ],
                    [
                        { text: '📋 Copy Link', callback_data: 'copy_invite_link' }
                    ]
                ]
            }
        };

        await bot.sendMessage(chatId, inviteMsg, {
            parse_mode: 'Markdown',
            ...shareButtons
        });
    } catch (error) {
        console.error('[INVITE] Error:', error);
        await bot.sendMessage(chatId, '❌ Error loading invite info.');
    }
});

// Current Pool
bot.onText(/\/pool|Current Pool/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        const user = await UserService.getUserByTelegramId(userId);
        const today = getTodayIST();

        let pool = null;
        try {
            pool = await PoolService.getTodayPool();
            if (!pool || !pool.finalAmount) {
                pool = await PoolService.calculateDailyPool(today);
            }
        } catch (e) {
            console.error('[POOL] Error:', e);
        }

        // 获取印度时间和倒计时
        const nowIST = getNowIST();
        const currentTime = formatTimeIST(nowIST);
        const countdown = getDrawCountdown();

        let poolMsg = '💎 *Current Pool Info*\n';
        poolMsg += '━━━━━━━━━━━━━━━━\n\n';

        // 时间信息
        poolMsg += `🕐 *India Time:* ${currentTime} IST\n`;
        poolMsg += `🎯 *Draw Time:* 21:00 IST\n`;
        poolMsg += `⏰ *Countdown:* ${countdown.text}\n\n`;

        const poolDisplay = (pool && pool.finalAmount > 0)
            ? `₹${pool.finalAmount.toLocaleString()}`
            : getPoolDisplay();

        poolMsg += `💰 *Pool Amount:* ${poolDisplay}\n\n`;

        if (pool && pool.participantCount) {
            poolMsg += `👥 *Participants:* ${pool.participantCount}\n`;
            poolMsg += `🏆 *Expected Winners:* ${Math.min(Math.floor((pool.participantCount || 0) * 0.05), 20)}\n\n`;
        }

        if (user) {
            const userStats = await LotteryService.getUserNumberStats(user.id, today);
            if (userStats.totalCount > 0) {
                poolMsg += `🎫 *My Entry:*\n`;
                poolMsg += `• Numbers: ${userStats.totalCount}\n`;
                poolMsg += `• Weight: ${userStats.totalWeight}x\n`;
                if (userStats.probability?.probability) {
                    poolMsg += `• Win Rate: ${userStats.probability.probability}%\n`;
                }
                poolMsg += '\n';
            } else {
                poolMsg += `⚠️ *You have no numbers yet!*\n`;
                poolMsg += `Click "Recharge" to join!\n\n`;
            }
        }

        poolMsg += '📅 *Next Draw:* Tonight at 21:00 IST';

        await bot.sendMessage(chatId, poolMsg, {
            parse_mode: 'Markdown',
            ...getMainMenu()
        });
    } catch (error) {
        console.error('[POOL] Error:', error);
        await bot.sendMessage(chatId, '❌ Error loading pool info.');
    }
});

// Help
bot.onText(/\/help|❓ Help/, async (msg) => {
    const chatId = msg.chat.id;

    const helpText =
        '📖 *Help Center*\n' +
        '━━━━━━━━━━━━━━━━\n\n' +
        'Select a topic below to learn more:';

    await bot.sendMessage(chatId, helpText, {
        parse_mode: 'Markdown',
        ...getHelpMenu()
    });
});

// ==================== Draw & Notifications ====================

async function performDraw() {
    const today = getTodayIST();
    console.log(`[DRAW] Starting draw for ${today}`);

    try {
        await PoolService.lockPool(today);
        const result = await DrawService.drawWinners(today);

        if (!result.success) {
            console.error('[DRAW] Failed:', result.message);
            return;
        }

        console.log(`[DRAW] Winners: ${result.winners.length}`);

        // 使用新的通知系统
        const DrawNotification = require('./drawNotification');
        const notifier = new DrawNotification(bot);
        await notifier.sendDrawResults(today, result.winners, result.poolAmount);
        
        // 同时推送到频道和群组
        await integration.announceDrawResult(today, result.winners, result.poolAmount);

    } catch (error) {
        console.error('[DRAW] Error:', error);
    }
}

module.exports = { bot, performDraw, processApproval, processRejection };

// ==================== 群组联动功能 ====================

// 新成员加入群组欢迎
bot.on('new_chat_members', async (msg) => {
    const chatId = msg.chat.id;
    
    // 检查是否是配置的群组
    if (chatId.toString() !== CONFIG.GROUP_ID.replace('@', '')) return;
    
    const newMembers = msg.new_chat_members;
    
    for (const member of newMembers) {
        // 跳过机器人自己
        if (member.is_bot) continue;
        
        await integration.sendGroupWelcome(chatId, member.first_name);
    }
});

// 频道关注奖励命令
bot.onText(/\/claim_channel_bonus/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!CONFIG.CHANNEL_REWARD.ENABLED) {
        await bot.sendMessage(chatId, '❌ Channel bonus is currently disabled.');
        return;
    }
    
    // 检查是否已关注频道
    const isMember = await integration.isChannelMember(userId);
    
    if (!isMember) {
        await bot.sendMessage(chatId,
            '⚠️ *You haven\'t joined our channel yet!*\n\n' +
            '📢 Join: ' + CONFIG.CHANNEL_ID + '\n\n' +
            'Then come back and click /claim_channel_bonus again',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    // 检查是否已经领取过奖励（24小时内）
    const lastClaim = await Database.findOne('channel_rewards', { userId });
    if (lastClaim) {
        const hoursSince = (Date.now() - new Date(lastClaim.claimedAt)) / (1000 * 60 * 60);
        if (hoursSince < CONFIG.CHANNEL_REWARD.COOLDOWN_HOURS) {
            const hoursLeft = Math.ceil(CONFIG.CHANNEL_REWARD.COOLDOWN_HOURS - hoursSince);
            await bot.sendMessage(chatId,
                `⏰ *Please wait ${hoursLeft} hours*\n\n` +
                'You can claim the channel bonus once every 24 hours.',
                { parse_mode: 'Markdown' }
            );
            return;
        }
    }
    
    // 发放奖励
    try {
        const today = getTodayIST();
        const numbers = await LotteryService.generateFreeNumbers(
            userId, 
            'channel_bonus', 
            today, 
            CONFIG.CHANNEL_REWARD.COUNT
        );
        
        // 记录领取
        await Database.insert('channel_rewards', {
            userId,
            claimedAt: new Date().toISOString(),
            numbers: numbers.map(n => n.number)
        });
        
        await bot.sendMessage(chatId,
            '✅ *Channel Bonus Claimed!*\n\n' +
            `🎁 You received ${numbers.length} FREE number(s):\n` +
            numbers.map(n => `${n.emoji} *${n.number}*`).join('\n') + '\n\n' +
            '📢 Thanks for subscribing to our channel!',
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        console.error('[CHANNEL_BONUS] Error:', error);
        await bot.sendMessage(chatId, '❌ Failed to claim bonus. Please try again later.');
    }
});

// ==================== 加载其他模块 ====================

// 加载管理员命令
const AdminCommands = require('./adminCommands');
new AdminCommands(bot, CONFIG);

// 加载手动发号功能
const AdminGiveNumbers = require('./adminGiveNumbers');
new AdminGiveNumbers(bot, CONFIG);

// 设置定时推送任务
const cron = require('node-cron');

// 每日 20:30 - 开奖前提醒
if (CONFIG.CHANNEL_ID) {
    cron.schedule('30 20 * * *', async () => {
        try {
            const pool = await PoolService.getTodayPool();
            await bot.sendMessage(CONFIG.CHANNEL_ID,
                `⏰ *Draw Countdown: 30 Minutes*\n\n` +
                `💰 Current Pool: ₹${(pool?.amount || 0).toLocaleString()}\n` +
                `👥 Participants: ${pool?.participants || 0}\n\n` +
                `🎰 Get your lucky numbers now!\n` +
                `👉 @${(await bot.getMe()).username}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('[SCHEDULED_POST] Error:', error);
        }
    }, { timezone: 'Asia/Kolkata' });
}

// 每日 09:00 - 早安推送
if (CONFIG.CHANNEL_ID) {
    cron.schedule('0 9 * * *', async () => {
        try {
            const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            const poolAmount = getPoolDisplay();
            
            await bot.sendMessage(CONFIG.CHANNEL_ID,
                `☀️ *Good Morning!*\n\n` +
                `📅 Today: ${today}\n` +
                `💰 Starting Pool: ₹${poolAmount}\n\n` +
                `🎰 New day, new chances to win!\n` +
                `✅ Don't forget to check in for FREE numbers\n\n` +
                `👉 @${(await bot.getMe()).username}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('[MORNING_POST] Error:', error);
        }
    }, { timezone: 'Asia/Kolkata' });
}

console.log('✅ Bot Ready! Flow: Screenshot → Game ID → Review → Numbers');
console.log('🔗 Channel Integration: ' + (CONFIG.CHANNEL_ID ? 'Enabled' : 'Disabled'));
console.log('💬 Group Integration: ' + (CONFIG.GROUP_ID ? 'Enabled' : 'Disabled'));
console.log('🔧 Admin commands loaded. Type /admin for panel');
console.log('⚠️  Manual number management loaded. Type /adminhelp for help');
