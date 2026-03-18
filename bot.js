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

// 引入历史记录服务
const HistoryService = require('./historyService');

// 引入菜单路由系统
const MenuRouter = require('./menuRouter.i18n');

// 引入私域联动系统
const ChannelGroupBotIntegration = require('./integration');

// ============================================================
// 启动时清除测试数据（仅用于测试阶段）
// ============================================================
async function clearTestData() {
    try {
        console.log('🧹 [STARTUP] 开始清除测试数据...\n');
        
        // 等待数据库连接
        await Database.init();
        
        const collectionsToClear = [
            'users',
            'lotteryNumbers', 
            'tierIdentities',
            'recharges',
            'pools',
            'winners',
            'inviteRecords',
            'checkins'
        ];
        
        for (const collection of collectionsToClear) {
            try {
                const allDocs = await Database.getAll(collection);
                console.log(`[CLEAR] ${collection}: ${allDocs.length} 条记录将被清除`);
                
                // 逐个删除
                for (const doc of allDocs) {
                    await Database.deleteOne(collection, { id: doc.id || doc._id });
                }
            } catch (err) {
                console.log(`[CLEAR] ${collection}: 集合不存在或为空`);
            }
        }
        
        console.log('\n🎉 [STARTUP] 测试数据清除完成！\n');
        
    } catch (error) {
        console.error('❌ [STARTUP] 清除数据失败:', error.message);
    }
}

// 检查是否需要清除数据（通过环境变量控制）
if (process.env.CLEAR_TEST_DATA === 'true') {
    console.log('⚠️  [STARTUP] CLEAR_TEST_DATA=true，将在启动时清除所有测试数据');
    clearTestData().then(() => {
        console.log('✅ [STARTUP] 数据清除完成，继续启动应用...\n');
        startBot();
    }).catch(err => {
        console.error('❌ [STARTUP] 启动失败:', err);
        process.exit(1);
    });
} else {
    // 正常启动
    startBot();
}

// 状态管理
const userState = new Map();
const pendingScreenshots = new Map();

// ==================== 启动函数 ====================
function startBot() {
    const bot = new TelegramBot(CONFIG.BOT_TOKEN, { polling: true });

    // 调试：打印配置值
    console.log('🔧 CONFIG DEBUG:');
    console.log('  CHANNEL_ID:', CONFIG.CHANNEL_ID);
    console.log('  GROUP_ID:', CONFIG.GROUP_ID);
    console.log('  REQUIRE_CHANNEL_SUBSCRIPTION:', CONFIG.REQUIRE_CHANNEL_SUBSCRIPTION);

    // 初始化私域联动系统
    const integration = new ChannelGroupBotIntegration(bot);

    // 初始化数据库
    let menuRouter;
    Database.init().then(async () => {
        console.log('✅ Database initialized');
        
        // 初始化菜单路由系统
        menuRouter = new MenuRouter(bot, UserService, TierService, VIPService);
        console.log('✅ Menu router initialized');
        
    }).catch(err => {
        console.error('❌ Database init failed:', err);
    });

    console.log('🤖 Bot Starting...');

// ==================== Helper Functions ====================

function getTodayIST() {
    // 使用与 PoolService 相同的 IST 日期计算方法
    const istString = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    // 格式转换: "03/17/2026" -> "2026-03-17"
    const [month, day, year] = istString.split('/');
    return `${year}-${month}-${day}`;
}

function getNowIST() {
    // 获取印度时区时间的各个部分
    const istString = new Date().toLocaleString('en-US', { 
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return istString;
}

function formatTimeIST(dateStr) {
    // 从 IST 时间字符串提取 HH:MM
    // dateStr 格式: "03/17/2026, 05:56:30"
    const match = dateStr.match(/(\d{1,2}):(\d{2}):\d{2}/);
    if (match) {
        const hour = match[1].padStart(2, '0');
        const minute = match[2];
        return `${hour}:${minute}`;
    }
    return dateStr;
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
                ['Current Pool', '❓ Help'],
                ['📜 My History']
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
            try {
                const isMember = await integration.isChannelMember(userId);
                if (!isMember) {
                    await bot.sendMessage(chatId,
                        '🎰 *Teen Patti Lucky Draw* 🎰\n\n' +
                        '╔═══════════════════════╗\n' +
                        '║   💰 *DAILY JACKPOT* 💰   ║\n' +
                        '║                       ║\n' +
                        '║    *₹2,000-5,000*     ║\n' +
                        '║      *CASH PRIZE*     ║\n' +
                        '╚═══════════════════════╝\n\n' +
                        '⚠️ *Join our channel to participate:*\n\n' +
                        '📢 Official Channel: ' + CONFIG.CHANNEL_ID + '\n' +
                        '💬 Player Group: ' + CONFIG.GROUP_ID + '\n\n' +
                        '👆 Tap the links above, then click /start',
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
            } catch (error) {
                console.error('[CHECK_CHANNEL] Error:', error.message);
                // 如果检查失败，继续执行（不阻断用户）
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

// 新多语言菜单系统回调处理器（优先级最高）
bot.on('callback_query', async (query) => {
    const data = query.data;
    
    // 如果是新菜单系统的回调，使用 MenuRouter 处理
    if (data.startsWith('menu_') || data.startsWith('action_')) {
        if (menuRouter) {
            await menuRouter.handleCallback(query);
            return;
        }
    }
});

// 原有回调处理器
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const messageId = query.message.message_id;

    console.log(`[CALLBACK] User: ${userId}, Data: ${data}`);

    try {
        // ===== 立即参与 =====
        if (data === 'join_now') {
            // 检查用户是否已存在
            const existingUser = await UserService.getUserByTelegramId(userId);
            if (existingUser) {
                // 老用户 - 直接跳转到充值流程
                await bot.editMessageText(
                    '💰 *Recharge to Get More Numbers*\n\n' +
                    'You already have an account!\n' +
                    'Recharge to get more lucky numbers.\n\n' +
                    '💰 *₹100* → 2 Silver numbers\n' +
                    '💰 *₹300* → 3 Silver numbers\n' +
                    '💰 *₹500* → 4 Gold numbers\n' +
                    '💰 *₹1,000* → 5 Gold numbers\n' +
                    '💰 *₹2,000* → 6 Diamond numbers\n' +
                    '💰 *₹3,000* → 7 Diamond numbers\n' +
                    '💰 *₹5,000* → 8 Crown numbers\n' +
                    '💰 *₹10,000* → 10 Crown numbers\n' +
                    '💰 *₹20,000* → 12 VIP numbers\n\n' +
                    '👇 *Select your recharge amount:*',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '₹100', callback_data: 'tier_existing_100' },
                                    { text: '₹300', callback_data: 'tier_existing_300' },
                                    { text: '₹500', callback_data: 'tier_existing_500' }
                                ],
                                [
                                    { text: '₹1K', callback_data: 'tier_existing_1000' },
                                    { text: '₹2K', callback_data: 'tier_existing_2000' },
                                    { text: '₹3K', callback_data: 'tier_existing_3000' }
                                ],
                                [
                                    { text: '₹5K', callback_data: 'tier_existing_5000' },
                                    { text: '₹10K', callback_data: 'tier_existing_10000' },
                                    { text: '₹20K', callback_data: 'tier_existing_20000' }
                                ],
                                [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                            ]
                        }
                    }
                );

                await bot.answerCallbackQuery(query.id, { text: 'Select recharge amount' });
                return;
            }

            // 新用户 - 显示参与方式选择
            await bot.editMessageText(
                '🎯 *Choose Participation Method*\n\n' +
                '🎁 *FREE Entry*\n' +
                '└ Get 1 FREE lottery number\n' +
                '└ Send Game ID only\n\n' +
                '💰 *Recharge Entry*\n' +
                '└ Get 2-12 numbers based on amount\n' +
                '└ Send recharge screenshot\n\n' +
                '⚠️ *Limit: One entry per user*',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🎁 FREE Entry (1 number)', callback_data: 'join_free' }],
                            [{ text: '💰 Recharge Entry (2-12 numbers)', callback_data: 'join_recharge' }],
                            [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                        ]
                    }
                }
            );

            await bot.answerCallbackQuery(query.id, { text: 'Select entry method' });
            return;
        }

        // ===== 免费参与 =====
        if (data === 'join_free') {
            // 检查用户是否已存在（禁止重复申请免费）
            const existingUser = await UserService.getUserByTelegramId(userId);
            if (existingUser) {
                await bot.answerCallbackQuery(query.id, { 
                    text: '❌ You already have an account! Use "My Account" or contact admin for free numbers.',
                    show_alert: true
                });
                return;
            }

            userState.set(userId, {
                step: 'waiting_free_gameid',
                entryType: 'free',
                timestamp: Date.now()
            });

            await bot.editMessageText(
                '🎁 *FREE Entry Application*\n\n' +
                'You will get: *1 FREE lottery number*\n\n' +
                '📋 *Steps:*\n' +
                '1️⃣ Send your Teen Patti Game ID\n' +
                '2️⃣ Wait for admin review\n' +
                '3️⃣ Get your number after approval\n\n' +
                '⏰ *Review time:* Within 24 hours\n\n' +
                '⚠️ *Important:*\n' +
                '• One entry per user only\n' +
                '• Make sure Game ID is correct\n' +
                '• False info will be rejected\n\n' +
                '👇 *Please send your Game ID (7 digits):*',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'cancel_join' }]]
                    }
                }
            );

            await bot.answerCallbackQuery(query.id, { text: 'Please send Game ID' });
            return;
        }

        // ===== 充值参与 =====
        if (data === 'join_recharge') {
            // 检查用户是否已存在
            const existingUser = await UserService.getUserByTelegramId(userId);
            
            if (existingUser) {
                // 老用户 - 直接显示充值档位（使用 tier_existing_）
                userState.set(userId, {
                    step: 'waiting_recharge_tier_existing',
                    userId: existingUser.id,
                    timestamp: Date.now()
                });

                await bot.editMessageText(
                    '💰 *Recharge Entry - Select Tier*\n\n' +
                    '💰 *₹100* → 2 Silver numbers\n' +
                    '💰 *₹300* → 3 Silver numbers\n' +
                    '💰 *₹500* → 4 Gold numbers\n' +
                    '💰 *₹1,000* → 5 Gold numbers\n' +
                    '💰 *₹2,000* → 6 Diamond numbers\n' +
                    '💰 *₹3,000* → 7 Diamond numbers\n' +
                    '💰 *₹5,000* → 8 Crown numbers\n' +
                    '💰 *₹10,000* → 10 Crown numbers\n' +
                    '💰 *₹20,000* → 12 VIP numbers\n\n' +
                    '👇 *Select your recharge amount:*',
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '₹100', callback_data: 'tier_existing_100' },
                                    { text: '₹300', callback_data: 'tier_existing_300' },
                                    { text: '₹500', callback_data: 'tier_existing_500' }
                                ],
                                [
                                    { text: '₹1K', callback_data: 'tier_existing_1000' },
                                    { text: '₹2K', callback_data: 'tier_existing_2000' },
                                    { text: '₹3K', callback_data: 'tier_existing_3000' }
                                ],
                                [
                                    { text: '₹5K', callback_data: 'tier_existing_5000' },
                                    { text: '₹10K', callback_data: 'tier_existing_10000' },
                                    { text: '₹20K', callback_data: 'tier_existing_20000' }
                                ],
                                [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                            ]
                        }
                    }
                );

                await bot.answerCallbackQuery(query.id, { text: 'Select recharge amount' });
                return;
            }

            // 新用户 - 显示充值档位（使用 tier_）
            userState.set(userId, {
                step: 'waiting_recharge_tier',
                entryType: 'recharge',
                timestamp: Date.now()
            });

            await bot.editMessageText(
                '💰 *Recharge Entry - Select Tier*\n\n' +
                '💰 *₹100* → 2 Silver numbers\n' +
                '💰 *₹300* → 3 Silver numbers\n' +
                '💰 *₹500* → 4 Gold numbers\n' +
                '💰 *₹1,000* → 5 Gold numbers\n' +
                '💰 *₹2,000* → 6 Diamond numbers\n' +
                '💰 *₹3,000* → 7 Diamond numbers\n' +
                '💰 *₹5,000* → 8 Crown numbers\n' +
                '💰 *₹10,000* → 10 Crown numbers\n' +
                '💰 *₹20,000* → 12 VIP numbers\n\n' +
                '👇 *Select your recharge amount:*',
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '₹100', callback_data: 'tier_100' },
                                { text: '₹300', callback_data: 'tier_300' },
                                { text: '₹500', callback_data: 'tier_500' }
                            ],
                            [
                                { text: '₹1K', callback_data: 'tier_1000' },
                                { text: '₹2K', callback_data: 'tier_2000' },
                                { text: '₹3K', callback_data: 'tier_3000' }
                            ],
                            [
                                { text: '₹5K', callback_data: 'tier_5000' },
                                { text: '₹10K', callback_data: 'tier_10000' },
                                { text: '₹20K', callback_data: 'tier_20000' }
                            ],
                            [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                        ]
                    }
                }
            );

            await bot.answerCallbackQuery(query.id, { text: 'Select recharge amount' });
            return;
        }

        // ===== 充值档位选择 =====
        if (data.startsWith('tier_') && !data.startsWith('tier_existing_')) {
            const tierAmount = parseInt(data.replace('tier_', ''));
            const state = userState.get(userId);

            console.log(`[TIER] User ${userId} selected ₹${tierAmount}, current state:`, state);

            if (!state) {
                await bot.answerCallbackQuery(query.id, { text: '❌ Please start over with /start' });
                return;
            }

            // 兼容不同状态
            if (state.step !== 'waiting_recharge_tier') {
                console.log(`[TIER] State mismatch for user ${userId}: expected waiting_recharge_tier, got ${state.step}`);
            }

            userState.set(userId, {
                ...state,
                step: 'waiting_recharge_screenshot',
                tierAmount: tierAmount,
                timestamp: Date.now()
            });

            console.log(`[TIER] Updated state for user ${userId}: waiting_recharge_screenshot, amount: ₹${tierAmount}`);

            try {
                await bot.editMessageText(
                    `💰 *Recharge Entry - ₹${tierAmount.toLocaleString()}*\n\n` +
                    '📱 *Steps:*\n' +
                    '1️⃣ Open Teen Patti Master game\n' +
                    `2️⃣ Recharge *₹${tierAmount.toLocaleString()}*\n` +
                    '3️⃣ Screenshot the payment success page\n' +
                    '4️⃣ Send screenshot here\n\n' +
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

                await bot.answerCallbackQuery(query.id, { text: `Please send ₹${tierAmount} screenshot` });
            } catch (error) {
                console.error('[TIER] Error editing message:', error);
                await bot.answerCallbackQuery(query.id, { text: '❌ Error, please try again' });
            }
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

        // ===== 充值档位选择（老用户重新充值） =====
        if (data.startsWith('tier_existing_')) {
            const tierAmount = parseInt(data.replace('tier_existing_', ''));
            const state = userState.get(userId);

            console.log(`[TIER_EXISTING] User ${userId} selected ₹${tierAmount}, current state:`, state);

            // 如果没有状态，尝试重新设置（兼容旧消息）
            if (!state) {
                const user = await UserService.getUserByTelegramId(userId);
                if (user) {
                    console.log(`[TIER_EXISTING] Restoring state for user ${userId}`);
                    userState.set(userId, {
                        step: 'waiting_recharge_tier_existing',
                        userId: user.id,
                        timestamp: Date.now()
                    });
                } else {
                    await bot.answerCallbackQuery(query.id, { text: '❌ Please click Recharge button first' });
                    return;
                }
            } else if (state.step !== 'waiting_recharge_tier_existing') {
                console.log(`[TIER_EXISTING] State mismatch for user ${userId}: expected waiting_recharge_tier_existing, got ${state.step}`);
                // 强制更新状态
                userState.set(userId, {
                    ...state,
                    step: 'waiting_recharge_tier_existing',
                    timestamp: Date.now()
                });
            }

            // 重新获取状态
            const currentState = userState.get(userId);

            userState.set(userId, {
                ...currentState,
                step: 'waiting_recharge_screenshot_existing',
                tierAmount: tierAmount,
                timestamp: Date.now()
            });

            console.log(`[TIER_EXISTING] Updated state for user ${userId}: waiting_recharge_screenshot_existing, amount: ₹${tierAmount}`);

            try {
                await bot.editMessageText(
                    `💰 *Recharge - ₹${tierAmount.toLocaleString()}*\n\n` +
                    '📱 *Steps:*\n' +
                    '1️⃣ Open Teen Patti Master game\n' +
                    `2️⃣ Recharge *₹${tierAmount.toLocaleString()}*\n` +
                    '3️⃣ Screenshot the payment success page\n' +
                    '4️⃣ Send screenshot here\n\n' +
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

                await bot.answerCallbackQuery(query.id, { text: `Please send ₹${tierAmount} screenshot` });
            } catch (error) {
                console.error('[TIER_EXISTING] Error editing message:', error);
                await bot.answerCallbackQuery(query.id, { text: '❌ Error, please try again' });
            }
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

        // 检查是否在充值参与等待截图状态
        if (state && state.step === 'waiting_recharge_screenshot') {
            // 检查超时（30分钟）
            if (Date.now() - state.timestamp > 30 * 60 * 1000) {
                userState.delete(userId);
                await bot.sendMessage(chatId, '⏰ Session expired. Please click /start to restart.');
                return;
            }

            const photoFileId = msg.photo[msg.photo.length - 1].file_id;
            const tierAmount = state.tierAmount || 0;

            const processingMsg = await bot.sendMessage(chatId, '⏳ Submitting your application...');

            try {
                // 新用户 - 需要创建用户记录
                const existingUser = await UserService.getUserByTelegramId(userId);
                let user;
                
                if (!existingUser) {
                    // 保存截图，等待Game ID
                    pendingScreenshots.set(userId, {
                        photoFileId,
                        tierAmount,
                        timestamp: Date.now()
                    });

                    userState.set(userId, {
                        ...state,
                        step: 'waiting_recharge_gameid',
                        photoFileId,
                        tierAmount
                    });

                    await bot.deleteMessage(chatId, processingMsg.message_id);
                    await bot.sendMessage(chatId,
                        '✅ *Screenshot received!*\n\n' +
                        '🎮 *Please enter your Teen Patti Game ID:*\n' +
                        '(You can find it in your game profile)\n\n' +
                        '💡 *Example:* `1234567`',
                        { parse_mode: 'Markdown' }
                    );
                    return;
                } else {
                    // 老用户重新充值
                    user = existingUser;

                    // 提交充值审核
                    const recharge = await RechargeService.submitRechargeForReview(
                        user.id,
                        photoFileId,
                        user.gameId
                    );

                    // 保存金额信息供管理员参考
                    recharge.requestedAmount = tierAmount;

                    // 清理状态
                    userState.delete(userId);

                    await bot.deleteMessage(chatId, processingMsg.message_id);

                    // 发送确认消息给用户
                    await bot.sendMessage(chatId,
                        '✅ *Recharge Submitted!*\n\n' +
                        '📋 *Details:*\n' +
                        '━━━━━━━━━━━━━━━\n' +
                        `🎮 Game ID: ${user.gameId}\n` +
                        `💰 Amount: ₹${tierAmount.toLocaleString()}\n` +
                        `📸 Screenshot: Uploaded\n` +
                        '━━━━━━━━━━━━━━━\n\n' +
                        '⏳ *Status:* Pending admin review\n' +
                        '⏱️ Usually takes 5-30 minutes\n\n' +
                        '📢 *After approval, you will receive:*\n' +
                        '• Lottery numbers based on your recharge amount',
                        { parse_mode: 'Markdown', ...getMainMenu() }
                    );

                    // 通知管理员
                    await notifyAdmins(user, recharge, photoFileId, user.gameId, tierAmount);
                }

            } catch (error) {
                console.error('[RECHARGE] Submit error:', error);
                await bot.deleteMessage(chatId, processingMsg.message_id);
                await bot.sendMessage(chatId, '❌ Submission failed. Please try again.');
                userState.delete(userId);
            }
            return;
        }

        // 检查是否在重新充值等待截图状态（老用户）
        if (state && state.step === 'waiting_recharge_screenshot_existing') {
            // 检查超时（30分钟）
            if (Date.now() - state.timestamp > 30 * 60 * 1000) {
                userState.delete(userId);
                await bot.sendMessage(chatId, '⏰ Session expired. Please click Recharge again.');
                return;
            }

            const photoFileId = msg.photo[msg.photo.length - 1].file_id;
            const tierAmount = state.tierAmount || 0;
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

                // 保存期望金额供管理员参考
                recharge.requestedAmount = tierAmount;

                // 清理状态
                userState.delete(userId);
                await bot.deleteMessage(chatId, processingMsg.message_id);

                // 发送确认消息给用户
                await bot.sendMessage(chatId,
                    '✅ *Recharge Submitted!*\n\n' +
                    '📋 *Details:*\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    `🎮 Game ID: ${user.gameId}\n` +
                    `💰 Expected Amount: ₹${tierAmount.toLocaleString()}\n` +
                    `📸 Screenshot: Uploaded\n` +
                    '━━━━━━━━━━━━━━━\n\n' +
                    '⏳ *Status:* Pending admin review\n' +
                    '⏱️ Usually takes 5-30 minutes\n\n' +
                    '📢 *After approval, you will receive:*\n' +
                    '• Lottery numbers based on verified amount',
                    { parse_mode: 'Markdown', ...getMainMenu() }
                );

                // 通知管理员（带期望金额）
                await notifyAdmins(user, recharge, photoFileId, user.gameId, tierAmount);

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
    if (state && (state.step === 'waiting_free_gameid' || state.step === 'waiting_recharge_gameid')) {
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

        // ========== 免费参与流程 ==========
        if (state && state.step === 'waiting_free_gameid') {
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

            const processingMsg = await bot.sendMessage(chatId, '⏳ Submitting your FREE entry...');

            try {
                // 创建用户记录
                const user = await UserService.createUser(
                    userId,
                    gameId,
                    msg.from.username || msg.from.first_name,
                    'NEW'
                );

                // 创建等级身份（新系统：人人有等级）
                const tierIdentity = await TierService.createTierIdentity(user.id);
                console.log(`[FREE_ENTRY] Tier identity created for user ${user.id}: ${tierIdentity.displayName}`);

                // 提交免费申请（金额为0）
                const recharge = await RechargeService.submitRechargeForReview(
                    user.id,
                    null,  // 无截图
                    gameId
                );
                recharge.entryType = 'free';  // 标记为免费申请

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

                // 删除处理中消息
                await bot.deleteMessage(chatId, processingMsg.message_id);

                // 发送确认消息给用户
                await bot.sendMessage(chatId,
                    '✅ *FREE Entry Submitted!*\n\n' +
                    '📋 *Application Details:*\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    `🎮 Game ID: ${gameId}\n` +
                    `🎁 Entry Type: FREE (1 number)\n` +
                    '━━━━━━━━━━━━━━━\n\n' +
                    '⏳ *Status:* Pending admin review\n' +
                    '⏱️ Usually takes 5-30 minutes\n\n' +
                    '📢 *After approval, you will receive:*\n' +
                    '• 1 FREE lottery number\n' +
                    '• Entry into today\'s draw at 21:00 IST' +
                    inviteBonusText,
                    { parse_mode: 'Markdown', ...getMainMenu() }
                );

                // 通知管理员（免费申请）
                await notifyAdminsFree(user, recharge, gameId);

            } catch (error) {
                console.error('[FREE_ENTRY] Error:', error);
                await bot.deleteMessage(chatId, processingMsg.message_id);
                await bot.sendMessage(chatId, '❌ Submission failed. Please try again with /start');
                userState.delete(userId);
            }
            return;
        }

        // ========== 充值参与流程（新用户，已发截图） ==========
        if (state && state.step === 'waiting_recharge_gameid') {
            const screenshotData = pendingScreenshots.get(userId);

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

            const processingMsg = await bot.sendMessage(chatId, '⏳ Submitting your recharge entry...');

            try {
                // 创建用户记录
                const user = await UserService.createUser(
                    userId,
                    gameId,
                    msg.from.username || msg.from.first_name,
                    'NEW'
                );

                // 创建等级身份（新系统：人人有等级）
                const tierIdentity = await TierService.createTierIdentity(user.id);
                console.log(`[RECHARGE_ENTRY] Tier identity created for user ${user.id}: ${tierIdentity.displayName}`);

                // 提交充值审核
                const recharge = await RechargeService.submitRechargeForReview(
                    user.id,
                    screenshotData.photoFileId,
                    gameId
                );
                recharge.requestedAmount = screenshotData.tierAmount;  // 保存期望金额
                recharge.entryType = 'recharge';

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
                    '✅ *Recharge Entry Submitted!*\n\n' +
                    '📋 *Application Details:*\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    `🎮 Game ID: ${gameId}\n` +
                    `💰 Expected Amount: ₹${screenshotData.tierAmount?.toLocaleString() || 'N/A'}\n` +
                    `📸 Screenshot: Uploaded\n` +
                    '━━━━━━━━━━━━━━━\n\n' +
                    '⏳ *Status:* Pending admin review\n' +
                    '⏱️ Usually takes 5-30 minutes\n\n' +
                    '📢 *After approval, you will receive:*\n' +
                    '• Lottery numbers based on verified amount\n' +
                    '• Entry into today\'s draw at 21:00 IST' +
                    inviteBonusText,
                    { parse_mode: 'Markdown', ...getMainMenu() }
                );

                // 通知管理员（充值申请）
                await notifyAdmins(user, recharge, screenshotData.photoFileId, gameId, screenshotData.tierAmount);

            } catch (error) {
                console.error('[RECHARGE_ENTRY] Error:', error);
                await bot.deleteMessage(chatId, processingMsg.message_id);
                await bot.sendMessage(chatId, '❌ Submission failed. Please try again with /start');
                userState.delete(userId);
                pendingScreenshots.delete(userId);
            }
            return;
        }

    } catch (error) {
        console.error('[GAMEID] Error:', error);
        await bot.sendMessage(chatId, '❌ Submission failed. Please try again with /start');
        userState.delete(userId);
        pendingScreenshots.delete(userId);
    }
});

// ==================== Admin Notification ====================

// 用于防止重复通知的缓存
const notifiedAdmins = new Map();

async function notifyAdminsFree(user, recharge, gameId) {
    // 去重检查 - 防止同一申请多次通知
    const notifyKey = `${recharge.id}_free`;
    if (notifiedAdmins.has(notifyKey)) {
        console.log(`[NOTIFY] Skip duplicate notification for ${notifyKey}`);
        return;
    }
    notifiedAdmins.set(notifyKey, Date.now());
    
    // 清理过期缓存（1小时后删除）
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, timestamp] of notifiedAdmins) {
        if (timestamp < oneHourAgo) {
            notifiedAdmins.delete(key);
        }
    }

    const adminMsg =
        `🎁 *New FREE Entry Pending Review!*\n\n` +
        `👤 User: ${user.telegramId}\n` +
        `🎮 Game ID: ${gameId}\n` +
        `🆔 Ref: ${recharge.id.slice(-8)}\n` +
        `📝 Type: FREE (1 number)\n\n` +
        `⚡ *Quick Actions:*`;

    const adminButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ Approve FREE', callback_data: `approve_${recharge.id}_0` }
                ],
                [
                    { text: '❌ Reject', callback_data: `reject_${recharge.id}_Invalid` }
                ]
            ]
        }
    };

    // 去重管理员ID
    const uniqueAdminIds = [...new Set(CONFIG.ADMIN_IDS)];
    console.log(`[NOTIFY] Sending FREE notification to ${uniqueAdminIds.length} admins for user ${user.telegramId}`);

    if (uniqueAdminIds && uniqueAdminIds.length > 0) {
        for (const adminId of uniqueAdminIds) {
            try {
                await bot.sendMessage(adminId, adminMsg, {
                    parse_mode: 'Markdown',
                    ...adminButtons
                });
                console.log(`[NOTIFY] Sent to admin ${adminId}`);
            } catch (e) {
                console.error(`[ADMIN] Notify admin ${adminId} failed:`, e);
            }
        }
    }
}

async function notifyAdmins(user, recharge, photoFileId, gameId, expectedAmount = null) {
    // 去重检查 - 防止同一申请多次通知
    const notifyKey = `${recharge.id}_recharge`;
    if (notifiedAdmins.has(notifyKey)) {
        console.log(`[NOTIFY] Skip duplicate notification for ${notifyKey}`);
        return;
    }
    notifiedAdmins.set(notifyKey, Date.now());
    
    // 清理过期缓存（1小时后删除）
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, timestamp] of notifiedAdmins) {
        if (timestamp < oneHourAgo) {
            notifiedAdmins.delete(key);
        }
    }

    let expectedText = '';
    if (expectedAmount) {
        expectedText = `💡 Expected: ₹${expectedAmount.toLocaleString()}\n`;
    }

    const adminMsg =
        `🔔 *New Recharge Pending Review!*\n\n` +
        `👤 User: ${user.telegramId}\n` +
        `🎮 Game ID: ${gameId}\n` +
        `🆔 Ref: ${recharge.id.slice(-8)}\n` +
        expectedText +
        `\n` +
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

    // 去重管理员ID
    const uniqueAdminIds = [...new Set(CONFIG.ADMIN_IDS)];
    console.log(`[NOTIFY] Sending RECHARGE notification to ${uniqueAdminIds.length} admins for user ${user.telegramId}`);

    if (uniqueAdminIds && uniqueAdminIds.length > 0) {
        for (const adminId of uniqueAdminIds) {
            try {
                await bot.sendPhoto(adminId, photoFileId, {
                    caption: adminMsg,
                    parse_mode: 'Markdown',
                    ...adminButtons
                });
                console.log(`[NOTIFY] Sent to admin ${adminId}`);
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
        // 尝试编辑 caption（图片消息）
        try {
            await bot.editMessageCaption('⚠️ Already processed', {
                chat_id: chatId,
                message_id: messageId
            });
        } catch (e) {
            // 如果是纯文字消息，使用 editMessageText
            await bot.editMessageText('⚠️ Already processed', {
                chat_id: chatId,
                message_id: messageId
            });
        }
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
        
        // 调试：打印 recharge.userId
        console.log(`[APPROVE] Debug: recharge.userId = ${recharge.userId}, type = ${typeof recharge.userId}`);
        
        // 尝试通过 id 查找用户
        let user = await Database.findById('users', recharge.userId);
        
        // 如果找不到，尝试通过 telegramId 查找（兼容旧数据）
        if (!user && recharge.userId) {
            console.log(`[APPROVE] User not found by id, trying telegramId...`);
            // 如果 userId 是 "u_12345" 格式，提取数字部分
            const telegramIdMatch = String(recharge.userId).match(/u_(\d+)/);
            if (telegramIdMatch) {
                const telegramId = parseInt(telegramIdMatch[1]);
                user = await Database.findOne('users', { telegramId });
                console.log(`[APPROVE] Lookup by telegramId ${telegramId}: ${user ? 'Found' : 'Not found'}`);
            } else {
                // 直接尝试作为 telegramId 查找
                const telegramId = parseInt(recharge.userId);
                if (!isNaN(telegramId)) {
                    user = await Database.findOne('users', { telegramId });
                    console.log(`[APPROVE] Lookup by telegramId ${telegramId}: ${user ? 'Found' : 'Not found'}`);
                }
            }
        }
        
        if (!user) {
            throw new Error(`User not found for userId: ${recharge.userId}`);
        }
        
        console.log(`[APPROVE] Found user: id=${user.id}, telegramId=${user.telegramId}, gameId=${user.gameId}`);

        // 生成号码 - 使用 user.id 而不是 recharge.userId，确保格式一致
        console.log(`[APPROVE] Generating numbers: user=${user.id}, amount=${amount}`);
        const numbers = await LotteryService.generateNumbers(user.id, amount, 'recharge', today);
        console.log(`[APPROVE] Numbers generated: count=${numbers?.count}, tier=${numbers?.tier?.name}`);

        if (!numbers || !numbers.numbers || numbers.numbers.length === 0) {
            throw new Error('Failed to generate numbers');
        }

        // 更新等级 - 使用 user.id 确保格式一致
        const tierResult = await TierService.addRecharge(user.id, amount);

        // 检查VIP资格 - 使用 user.id
        await VIPService.processVIPCheck(user.id, today);

        // 处理邀请奖励（注册奖励 + 首充奖励）
        // 1. 注册奖励：被邀请人注册成功，邀请人获得 2 Silver
        const inviterId = await InviteService.getInviterId(user.id);
        console.log(`[INVITE] Processing invite rewards for user ${user.id}, inviterId=${inviterId}`);
        
        if (inviterId) {
            const inviter = await Database.findById('users', inviterId);
            console.log(`[INVITE] Found inviter:`, inviter ? `Yes (telegramId=${inviter.telegramId})` : 'No');
            
            // 检查是否已发放注册奖励
            const inviteRecord = await Database.findOne('inviteRecords', { inviteeId: recharge.userId });
            console.log(`[INVITE] Invite record found:`, inviteRecord ? `Yes (id=${inviteRecord.id})` : 'No');
            
            if (inviter && inviteRecord && !inviteRecord.registerRewardGiven) {
                console.log(`[INVITE] Giving register reward to inviter ${inviterId}`);
                const registerReward = await LotteryService.generateFreeNumbers(inviterId, 'invite_register', today, 2);
                await Database.update('inviteRecords', inviteRecord.id, { registerRewardGiven: true });
                await bot.sendMessage(
                    inviter.telegramId,
                    `🎉 *Your friend joined!*\n\n` +
                    `You got 2 Silver bonus numbers:\n` +
                    registerReward.map(n => `${n.emoji} *${n.number}*`).join('\n'),
                    { parse_mode: 'Markdown' }
                );
            } else {
                console.log(`[INVITE] Register reward already given or conditions not met`);
            }
            
            // 2. 首充奖励：被邀请人首充≥₹100，邀请人获得 2 Gold
            if (amount >= 100) {
                console.log(`[INVITE] Processing recharge reward (amount >= 100)`);
                await InviteService.processInviteRecharge(recharge.userId, amount);
                if (inviter) {
                    console.log(`[INVITE] Giving recharge reward to inviter ${inviterId}`);
                    const rechargeReward = await LotteryService.generateFreeNumbers(inviterId, 'invite_recharge', today, 2);
                    await bot.sendMessage(
                        inviter.telegramId,
                        `🎉 *Your friend recharged ₹${amount}!*\n\n` +
                        `You got 2 Gold bonus numbers:\n` +
                        rechargeReward.map(n => `${n.emoji} *${n.number}*`).join('\n'),
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
        const adminMsg =
            `✅ *APPROVED*\n\n` +
            `👤 User: ${user.gameId || user.telegramId}\n` +
            `💰 Amount: ₹${amount.toLocaleString()}\n` +
            `🎁 Sent: ${numbers.count} numbers`;

        // 尝试编辑 caption（图片消息），失败则用 text
        try {
            await bot.editMessageCaption(adminMsg, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            });
        } catch (e) {
            await bot.editMessageText(adminMsg, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            });
        }

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
        // 尝试编辑 caption（图片消息）
        try {
            await bot.editMessageCaption('⚠️ Already processed', {
                chat_id: chatId,
                message_id: messageId
            });
        } catch (e) {
            // 如果是纯文字消息，使用 editMessageText
            await bot.editMessageText('⚠️ Already processed', {
                chat_id: chatId,
                message_id: messageId
            });
        }
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

        // 更新管理员消息
        const adminMsg =
            `❌ *REJECTED*\n\n` +
            `👤 User: ${user?.gameId || 'Unknown'}\n` +
            `Reason: ${reason}`;

        // 尝试编辑 caption（图片消息），失败则用 text
        try {
            await bot.editMessageCaption(adminMsg, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            });
        } catch (e) {
            await bot.editMessageText(adminMsg, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown'
            });
        }

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

        // 确保 user.id 存在
        if (!user.id) {
            user.id = `u_${user.telegramId}`;
            console.log(`[ACCOUNT] Fixed missing user.id: ${user.id}`);
        }

        await UserService.updateLastActive(user.id);

        const today = getTodayIST();
        
        // 调试：打印用户信息
        console.log(`[ACCOUNT] Debug: user object:`, JSON.stringify(user));
        console.log(`[ACCOUNT] Debug: user.id = ${user?.id}, type = ${typeof user?.id}`);
        console.log(`[ACCOUNT] Debug: user.telegramId = ${user?.telegramId}`);
        
        const tier = await TierService.getTierIdentity(user.id);
        console.log(`[ACCOUNT] Debug: tier = ${tier ? 'found' : 'not found'}`);
        
        const stats = await LotteryService.getUserNumberStats(user.id, today);
        console.log(`[ACCOUNT] Debug: stats.totalCount = ${stats?.totalCount}`);
        
        const vipProgress = await VIPService.getVIPProgress(user.id);

        let pool = null;
        try {
            // 每次查看都重新计算奖池（获取最新数据）
            pool = await PoolService.calculateDailyPool(today);
        } catch (e) {
            console.error('[ACCOUNT] Calculate pool failed:', e);
            // 如果计算失败，尝试获取已存在的
            try {
                pool = await PoolService.getTodayPool();
            } catch (e2) {
                console.error('[ACCOUNT] Get pool failed:', e2);
            }
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

// /history 或 📜 My History 按钮 - 个人中奖历史
bot.onText(/\/history|📜 My History/, async (msg) => {
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

        const historyService = require('./historyService');
        const winHistory = await historyService.getUserWinHistory(user.id, 10);
        const stats = await historyService.getUserStats(user.id);

        let message = '📜 *My Win History*\n';
        message += '━━━━━━━━━━━━━━━━\n\n';

        // 统计信息
        message += `🏆 Total Wins: ${stats.totalWins}\n`;
        message += `💰 Total Prize: ₹${stats.totalPrize.toLocaleString()}\n`;
        message += `📅 Participation: ${stats.participationDays} days\n`;
        if (stats.winRate > 0) {
            message += `📊 Win Rate: ${stats.winRate}%\n`;
        }
        message += '\n';

        // 最近中奖记录
        if (winHistory.length > 0) {
            message += '*Recent Wins:*\n';
            for (const win of winHistory.slice(0, 5)) {
                const tierEmoji = win.prizeTier === 1 ? '🥇' : win.prizeTier === 2 ? '🥈' : '🥉';
                message += `${tierEmoji} ${win.date} - ₹${win.amount.toLocaleString()} (${win.number})\n`;
            }
        } else {
            message += '😔 No wins yet.\n';
            message += '💡 Keep trying! More numbers = higher chance!\n';
        }

        message += '\n━━━━━━━━━━━━━━━━';
        message += '\n💡 Use /start to get more numbers!';

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            ...getMainMenu()
        });

    } catch (error) {
        console.error('[HISTORY] Error:', error);
        await bot.sendMessage(chatId, '❌ Failed to load history');
    }
});

// Join Now - Alternative way
bot.onText(/Join Now/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const existingUser = await UserService.getUserByTelegramId(userId);
    if (existingUser) {
        // 老用户 - 直接显示充值选项
        await bot.sendMessage(chatId,
            '💰 *Recharge to Get More Numbers*\n\n' +
            'You already have an account!\n' +
            'Recharge to get more lucky numbers.\n\n' +
            '💰 *₹100* → 2 Silver numbers\n' +
            '💰 *₹300* → 3 Silver numbers\n' +
            '💰 *₹500* → 4 Gold numbers\n' +
            '💰 *₹1,000* → 5 Gold numbers\n' +
            '💰 *₹2,000* → 6 Diamond numbers\n' +
            '💰 *₹3,000* → 7 Diamond numbers\n' +
            '💰 *₹5,000* → 8 Crown numbers\n' +
            '💰 *₹10,000* → 10 Crown numbers\n' +
            '💰 *₹20,000* → 12 VIP numbers\n\n' +
            '👇 *Select your recharge amount:*',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '₹100', callback_data: 'tier_existing_100' },
                            { text: '₹300', callback_data: 'tier_existing_300' },
                            { text: '₹500', callback_data: 'tier_existing_500' }
                        ],
                        [
                            { text: '₹1K', callback_data: 'tier_existing_1000' },
                            { text: '₹2K', callback_data: 'tier_existing_2000' },
                            { text: '₹3K', callback_data: 'tier_existing_3000' }
                        ],
                        [
                            { text: '₹5K', callback_data: 'tier_existing_5000' },
                            { text: '₹10K', callback_data: 'tier_existing_10000' },
                            { text: '₹20K', callback_data: 'tier_existing_20000' }
                        ],
                        [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                    ]
                }
            }
        );
        return;
    }

    // 新用户 - 显示参与方式选择（与 /start 中的 join_now 回调一致）
    await bot.sendMessage(chatId,
        '🎯 *Choose Participation Method*\n\n' +
        '🎁 *FREE Entry*\n' +
        '└ Get 1 FREE lottery number\n' +
        '└ Send Game ID only\n\n' +
        '💰 *Recharge Entry*\n' +
        '└ Get 2-12 numbers based on amount\n' +
        '└ Send recharge screenshot\n\n' +
        '⚠️ *Limit: One entry per user*',
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎁 FREE Entry (1 number)', callback_data: 'join_free' }],
                    [{ text: '💰 Recharge Entry (2-12 numbers)', callback_data: 'join_recharge' }],
                    [{ text: '❌ Cancel', callback_data: 'cancel_join' }]
                ]
            }
        }
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

        // 清理用户之前的状态（防止状态冲突）
        const existingState = userState.get(userId);
        if (existingState) {
            console.log(`[RECHARGE] Clearing existing state for user ${userId}:`, existingState.step);
            userState.delete(userId);
            pendingScreenshots.delete(userId);
        }

        // 已注册用户，显示档位选择
        userState.set(userId, {
            step: 'waiting_recharge_tier_existing',
            userId: user.id,
            timestamp: Date.now()
        });

        let tierDisplay = 'Standard';
        try {
            const tier = await TierService.getTierIdentity(user.id);
            tierDisplay = tier?.displayName || 'Standard';
        } catch (e) {
            console.log('[RECHARGE] Tier display error:', e.message);
        }

        await bot.sendMessage(chatId,
            '💰 *Recharge to Get More Numbers!*\n\n' +
            'Recharge ₹100-₹20,000 to get 2-12 lottery numbers.\n' +
            '✅ You can recharge multiple times per day!\n' +
            '✅ Numbers are valid for today\'s draw only.\n\n' +
            'Select your recharge amount:',
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '₹100', callback_data: 'tier_existing_100' },
                            { text: '₹300', callback_data: 'tier_existing_300' },
                            { text: '₹500', callback_data: 'tier_existing_500' }
                        ],
                        [
                            { text: '₹1K', callback_data: 'tier_existing_1000' },
                            { text: '₹2K', callback_data: 'tier_existing_2000' },
                            { text: '₹3K', callback_data: 'tier_existing_3000' }
                        ],
                        [
                            { text: '₹5K', callback_data: 'tier_existing_5000' },
                            { text: '₹10K', callback_data: 'tier_existing_10000' },
                            { text: '₹20K', callback_data: 'tier_existing_20000' }
                        ]
                    ]
                }
            }
        );

    } catch (error) {
        console.error('[RECHARGE] Error:', error);
        await bot.sendMessage(chatId, '❌ Error. Please try again with /start');
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
            // 每次点击都重新计算奖池（获取最新充值数据）
            pool = await PoolService.calculateDailyPool(today);
            console.log(`[POOL] Calculated pool for ${today}: ₹${pool?.finalAmount || 0}`);
        } catch (e) {
            console.error('[POOL] Error:', e);
            // 如果计算失败，尝试获取已存在的奖池
            try {
                pool = await PoolService.getTodayPool();
            } catch (e2) {
                console.error('[POOL] Get existing pool failed:', e2);
            }
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
            // 确保 user.id 存在
            const actualUserId = user.id || `u_${user.telegramId}`;
            const userStats = await LotteryService.getUserNumberStats(actualUserId, today);
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

// Help - 显示英文帮助菜单
bot.onText(/\/help|❓ Help/, async (msg) => {
    const chatId = msg.chat.id;
    
    // 使用英文菜单系统
    if (menuRouter) {
        await menuRouter.showMainMenu(chatId, null, 'en');
    } else {
        // 备用方案
        const helpText =
            '📖 *Help Center*\n' +
            '━━━━━━━━━━━━━━━━\n\n' +
            'Select a topic:';

        await bot.sendMessage(chatId, helpText, {
            parse_mode: 'Markdown',
            ...getHelpMenu()
        });
    }
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

// 每日 21:00 - 自动开奖
cron.schedule('0 21 * * *', async () => {
    console.log('[CRON] Auto draw starting at 21:00 IST...');
    try {
        // 检查今天是否已经开过奖
        const today = getTodayIST();
        const existingPool = await PoolService.getTodayPool();
        
        if (existingPool?.locked) {
            console.log('[CRON] Pool already locked today, skipping draw');
            return;
        }
        
        // 执行开奖
        await performDraw();
        console.log('[CRON] Auto draw completed successfully');
        
    } catch (error) {
        console.error('[CRON] Auto draw failed:', error);
        // 通知管理员开奖失败
        for (const adminId of CONFIG.ADMIN_IDS) {
            try {
                await bot.sendMessage(adminId, 
                    `❌ *Auto Draw Failed*\n\n` +
                    `Error: ${error.message}\n\n` +
                    `Please check logs and run manual draw if needed.`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                console.error('[CRON] Failed to notify admin:', e);
            }
        }
    }
}, { timezone: 'Asia/Kolkata' });

console.log('✅ Scheduled tasks:');
console.log('   - 09:00 Morning post');
console.log('   - 20:30 Draw countdown');
console.log('   - 21:00 Auto draw ⭐');
console.log('🔗 Channel Integration: ' + (CONFIG.CHANNEL_ID ? 'Enabled' : 'Disabled'));
console.log('💬 Group Integration: ' + (CONFIG.GROUP_ID ? 'Enabled' : 'Disabled'));
console.log('🔧 Admin commands loaded. Type /admin for panel');
console.log('⚠️  Manual number management loaded. Type /adminhelp for help');

// ==================== AI 内容优化大师系统 ====================
const { initContentMasterDB } = require('./initContentDB');
const ContentMaster = require('./contentMaster');

// 初始化AI内容数据库
initContentMasterDB().then(() => {
    console.log('🧠 AI Content Master: Database Ready');
}).catch(err => {
    console.error('❌ AI Content Master DB Error:', err);
});

// 创建全局内容大师实例
const contentMaster = new ContentMaster(bot);

// ==================== AI 自动发帖系统 ====================
const AutoPoster = require('./autoPost');
const autoPoster = new AutoPoster(bot);

// 启动自动发帖（如果配置了频道或群组）
if (CONFIG.CHANNEL_ID || CONFIG.GROUP_ID) {
    autoPoster.startScheduledPosts();
    console.log('🤖 AI Auto-Posting: ENABLED');
    console.log('   Channel: @telltest222 (Ad style)');
    console.log('   Group: @tkgfg (Community style)');
    console.log('   Posts per day: 22 total');
    console.log('   Features: Data-driven, Festival-aware, Segmented');
} else {
    console.log('🤖 AI Auto-Posting: DISABLED (no CHANNEL_ID or GROUP_ID)');
}

// 导出供其他地方使用
module.exports.autoPoster = autoPoster;
module.exports.contentMaster = contentMaster;

} // end of startBot()
