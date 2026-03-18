/**
 * ============================================================
 * 管理员手动发号模块 (adminGiveNumbers.js)
 * ============================================================
 * 
 * ⚠️ 警告：此功能用于特殊场景，如补偿用户、活动奖励等
 * 滥用此功能操纵抽奖结果可能导致：
 * - 用户信任丧失
 * - 平台封禁
 * - 法律风险
 * 
 * 建议：仅用于正当用途（补偿、奖励、测试）
 */

const Database = require('./database');
const LotteryService = require('./lotteryService');
const NumberTierService = require('./numberTierService');

class AdminGiveNumbers {
    constructor(bot, config) {
        this.bot = bot;
        this.config = config;
        this.setupHandlers();
    }

    isAdmin(userId) {
        return this.config.ADMIN_IDS.includes(userId);
    }

    setupHandlers() {
        // /givenumbers [GameID] [数量] [等级] [原因] - 手动发号
        this.bot.onText(/\/givenumbers\s+(\d{7})\s+(\d+)\s+(\w+)\s*(.*)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const gameId = match[1];
            const count = parseInt(match[2]);
            const tierCode = match[3].toUpperCase();
            const reason = match[4] || 'Admin gift';

            await this.giveNumbers(chatId, adminId, gameId, count, tierCode, reason);
        });

        // /givetier [GameID] [金额] [原因] - 按金额档位发号
        this.bot.onText(/\/givetier\s+(\d{7})\s+(\d+)\s*(.*)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const gameId = match[1];
            const amount = parseInt(match[2]);
            const reason = match[3] || 'Admin gift';

            await this.giveTierNumbers(chatId, adminId, gameId, amount, reason);
        });

        // /addtowinners [GameID] [奖项] - 手动添加中奖者
        this.bot.onText(/\/addtowinners\s+(\d{7})\s+(\d)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const gameId = match[1];
            const prizeTier = parseInt(match[2]);

            await this.addToWinners(chatId, adminId, gameId, prizeTier);
        });

        // /removenumber [号码ID] - 移除指定号码
        this.bot.onText(/\/removenumber\s+(\S+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const numberId = match[1];
            await this.removeNumber(chatId, numberId);
        });

        // /listnumbers [GameID] - 查看用户所有号码
        this.bot.onText(/\/listnumbers\s+(\d{7})/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const gameId = match[1];
            await this.listUserNumbers(chatId, gameId);
        });

        // /adminhelp - 显示手动发号帮助
        this.bot.onText(/\/adminhelp/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            if (!this.isAdmin(userId)) {
                return;
            }

            await this.showHelp(chatId);
        });
        
        // /adjustpool [日期] [金额] - 调整指定日期的奖池金额
        this.bot.onText(/\/adjustpool\s+(\d{4}-\d{2}-\d{2})\s+(\d+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const adminId = msg.from.id;

            if (!this.isAdmin(adminId)) {
                return;
            }

            const poolDate = match[1];
            const newAmount = parseInt(match[2]);

            await this.adjustPoolAmount(chatId, poolDate, newAmount);
        });
    }

    // 手动发号
    async giveNumbers(chatId, adminId, gameId, count, tierCode, reason) {
        try {
            // 查找用户
            const user = await Database.findOne('users', { gameId });
            if (!user) {
                await this.bot.sendMessage(chatId, `❌ User with GameID ${gameId} not found`);
                return;
            }

            // 验证等级代码
            const validTiers = ['F', 'S', 'G', 'D', 'C', 'V'];
            if (!validTiers.includes(tierCode)) {
                await this.bot.sendMessage(chatId, 
                    `❌ Invalid tier code. Use: F, S, G, D, C, V\n` +
                    `F=Free, S=Silver, G=Gold, D=Diamond, C=Crown, V=VIP`
                );
                return;
            }

            // 限制数量
            if (count < 1 || count > 50) {
                await this.bot.sendMessage(chatId, '❌ Count must be 1-50');
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // 生成号码
            const numbers = await NumberTierService.generateTierNumbers(tierCode, count, today);

            // 保存号码
            for (const num of numbers) {
                await Database.insert('lotteryNumbers', {
                    ...num,
                    userId: user.id,
                    source: `admin_gift:${reason}`,
                    givenBy: String(adminId),
                    status: 'VALID',
                    createdAt: new Date().toISOString()
                });
            }

            // 通知用户
            const tierNames = { F: 'Free', S: 'Silver', G: 'Gold', D: 'Diamond', C: 'Crown', V: 'VIP' };
            await this.bot.sendMessage(
                user.telegramId,
                `🎁 *Surprise Gift!*\n\n` +
                `You've received ${count} ${tierNames[tierCode]} numbers!\n` +
                `Reason: ${reason}\n\n` +
                `Your new numbers:\n` +
                numbers.map(n => `${n.emoji} \`${n.number}\``).join('\n') +
                `\n\n🎰 Good luck in tonight's draw!`,
                { parse_mode: 'Markdown' }
            );

            // 通知管理员
            await this.bot.sendMessage(
                chatId,
                `✅ *Numbers Given*\n\n` +
                `👤 User: ${gameId}\n` +
                `🎁 Count: ${count}\n` +
                `🏆 Tier: ${tierNames[tierCode]}\n` +
                `📝 Reason: ${reason}\n\n` +
                `Numbers:\n` +
                numbers.map(n => n.number).join(', ')
            );

            console.log(`[ADMIN] ${adminId} gave ${count} ${tierCode} numbers to ${gameId}. Reason: ${reason}`);

        } catch (error) {
            console.error('[ADMIN] Give numbers error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to give numbers');
        }
    }

    // 按金额档位发号
    async giveTierNumbers(chatId, adminId, gameId, amount, reason) {
        try {
            const user = await Database.findOne('users', { gameId });
            if (!user) {
                await this.bot.sendMessage(chatId, `❌ User with GameID ${gameId} not found`);
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // 使用lotteryService生成号码
            const result = await LotteryService.generateNumbers(user.id, amount, `admin:${reason}`, today);

            // 标记为管理员赠送
            for (const num of result.numbers) {
                await Database.update('lotteryNumbers', num.id, {
                    source: `admin_gift:${reason}`,
                    givenBy: String(adminId)
                });
            }

            // 通知用户
            await this.bot.sendMessage(
                user.telegramId,
                `🎁 *Special Reward!*\n\n` +
                `You've received ${result.count} ${result.tier.emoji} ${result.tier.name} numbers!\n` +
                `Equivalent to ₹${amount} recharge\n` +
                `Reason: ${reason}\n\n` +
                `Your numbers:\n` +
                result.numbers.map(n => `\`${n.number}\``).join(' ') +
                `\n\n🎰 Good luck!`,
                { parse_mode: 'Markdown' }
            );

            // 通知管理员
            await this.bot.sendMessage(
                chatId,
                `✅ *Tier Numbers Given*\n\n` +
                `👤 User: ${gameId}\n` +
                `💰 Equivalent: ₹${amount}\n` +
                `🎁 Count: ${result.count}\n` +
                `🏆 Tier: ${result.tier.name}\n` +
                `📝 Reason: ${reason}`
            );

        } catch (error) {
            console.error('[ADMIN] Give tier numbers error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to give numbers');
        }
    }

    // 手动添加中奖者
    async addToWinners(chatId, adminId, gameId, prizeTier) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 查找用户
            const user = await Database.findOne('users', { gameId });
            if (!user) {
                await this.bot.sendMessage(chatId, `❌ User with GameID ${gameId} not found`);
                return;
            }

            // 获取用户今日号码
            const numbers = await Database.findAll('lotteryNumbers', {
                userId: user.id,
                date: today,
                status: 'VALID'
            });

            if (numbers.length === 0) {
                await this.bot.sendMessage(chatId, '❌ User has no valid numbers today');
                return;
            }

            // 使用第一个号码作为中奖号码
            const winningNumber = numbers[0];
            
            // 创建中奖记录
            const pool = await Database.findOne('pools', { date: today });
            const prizeAmount = prizeTier === 1 ? 1000 : prizeTier === 2 ? 500 : 200;

            const winnerRecord = {
                id: `win_${today}_${winningNumber.number}`,
                poolId: pool?.id || `pool_${today}`,
                numberId: winningNumber.id,
                number: winningNumber.number,
                tierCode: winningNumber.tierCode,
                userId: user.id,
                prizeTier,
                amount: prizeAmount,
                status: 'PENDING',
                addedBy: String(adminId),
                createdAt: new Date().toISOString()
            };

            await Database.insert('winners', winnerRecord);
            await Database.update('lotteryNumbers', winningNumber.id, { status: 'WON' });

            // 通知用户
            const prizeNames = { 1: '🥇 1st Prize', 2: '🥈 2nd Prize', 3: '🥉 3rd Prize' };
            await this.bot.sendMessage(
                user.telegramId,
                `🎉 *Congratulations! You WON!*\n\n` +
                `📅 Draw: ${today}\n` +
                `🎫 Winning Number: \`${winningNumber.number}\`\n` +
                `🏆 ${prizeNames[prizeTier] || 'Winner'}\n` +
                `💰 Prize: ₹${prizeAmount.toLocaleString()}\n\n` +
                `📌 *Claim your prize:*\n` +
                `Contact admin within 48 hours\n` +
                `Prize will be sent via UPI`,
                { parse_mode: 'Markdown' }
            );

            // 通知管理员
            await this.bot.sendMessage(
                chatId,
                `✅ *Winner Added*\n\n` +
                `👤 User: ${gameId}\n` +
                `🎫 Number: ${winningNumber.number}\n` +
                `🏆 Prize Tier: ${prizeTier}\n` +
                `💰 Amount: ₹${prizeAmount}`
            );

            console.log(`[ADMIN] ${adminId} added ${gameId} as tier ${prizeTier} winner`);

        } catch (error) {
            console.error('[ADMIN] Add winner error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to add winner');
        }
    }

    // 移除号码
    async removeNumber(chatId, numberId) {
        try {
            const number = await Database.findById('lotteryNumbers', numberId);
            if (!number) {
                await this.bot.sendMessage(chatId, '❌ Number not found');
                return;
            }

            await Database.update('lotteryNumbers', numberId, { status: 'REMOVED' });

            await this.bot.sendMessage(
                chatId,
                `✅ *Number Removed*\n\n` +
                `Number: ${number.number}\n` +
                `User: ${number.userId}\n` +
                `Status: REMOVED`
            );

        } catch (error) {
            console.error('[ADMIN] Remove number error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to remove number');
        }
    }

    // 查看用户号码
    async listUserNumbers(chatId, gameId) {
        try {
            const user = await Database.findOne('users', { gameId });
            if (!user) {
                await this.bot.sendMessage(chatId, `❌ User with GameID ${gameId} not found`);
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const numbers = await Database.findAll('lotteryNumbers', {
                userId: user.id,
                date: today
            });

            if (numbers.length === 0) {
                await this.bot.sendMessage(chatId, `📭 User ${gameId} has no numbers today`);
                return;
            }

            let text = `🎫 *Numbers for ${gameId}*\n\n`;
            
            const valid = numbers.filter(n => n.status === 'VALID');
            const won = numbers.filter(n => n.status === 'WON');
            const used = numbers.filter(n => n.status === 'USED');

            if (valid.length > 0) {
                text += `✅ *Valid (${valid.length}):*\n`;
                text += valid.map(n => `${n.emoji} \`${n.number}\` (${n.weight}x)`).join('\n');
                text += '\n\n';
            }

            if (won.length > 0) {
                text += `🎉 *Won (${won.length}):*\n`;
                text += won.map(n => `\`${n.number}\``).join(', ');
                text += '\n\n';
            }

            if (used.length > 0) {
                text += `📤 *Used (${used.length}):*\n`;
                text += used.map(n => n.number).join(', ');
            }

            await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error('[ADMIN] List numbers error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to list numbers');
        }
    }

    // 显示帮助
    async showHelp(chatId) {
        const helpText = 
            '🔧 *Admin Manual Number Management*\n' +
            '━━━━━━━━━━━━━━━━━━\n\n' +
            '⚠️ *Warning: Use responsibly*\n\n' +
            '*Give Numbers*\n' +
            '`/givenumbers [GameID] [count] [tier] [reason]`\n' +
            'Tiers: F, S, G, D, C, V\n' +
            'Example: `/givenumbers 1234567 5 G Activity reward`\n\n' +
            '*Give Tier Numbers*\n' +
            '`/givetier [GameID] [amount] [reason]`\n' +
            'Example: `/givetier 1234567 500 Welcome bonus`\n\n' +
            '*Add Winner*\n' +
            '`/addtowinners [GameID] [tier]`\n' +
            'Tiers: 1=1st, 2=2nd, 3=3rd\n' +
            'Example: `/addtowinners 1234567 1`\n\n' +
            '*Remove Number*\n' +
            '`/removenumber [numberId]`\n' +
            'Example: `/removenumber G-0001`\n\n' +
            '*List User Numbers*\n' +
            '`/listnumbers [GameID]`\n' +
            'Example: `/listnumbers 1234567`\n\n' +
            '*Adjust Pool Amount*\n' +
            '`/adjustpool [YYYY-MM-DD] [amount]`\n' +
            'Example: `/adjustpool 2026-03-18 5000`\n' +
            '*For festival pool adjustment*\n\n' +
            '━━━━━━━━━━━━━━━━━━\n' +
            '*All actions are logged*';

        await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
    }

    /**
     * 调整奖池金额（用于节日等特殊情况）n     * @param {number} chatId - 聊天ID
     * @param {string} poolDate - 日期 YYYY-MM-DD
     * @param {number} newAmount - 新奖池金额
     */
    async adjustPoolAmount(chatId, poolDate, newAmount) {
        try {
            // 验证日期格式
            if (!/^\d{4}-\d{2}-\d{2}$/.test(poolDate)) {
                await this.bot.sendMessage(chatId, '❌ Invalid date format. Use YYYY-MM-DD');
                return;
            }

            // 验证金额
            if (isNaN(newAmount) || newAmount < 1000 || newAmount > 50000) {
                await this.bot.sendMessage(chatId, '❌ Invalid amount. Must be between ₹1,000 and ₹50,000');
                return;
            }

            // 查找奖池
            let pool = await Database.findOne('pools', { date: poolDate });
            
            if (!pool) {
                // 如果奖池不存在，创建一个新的
                pool = {
                    id: `pool_${poolDate}`,
                    date: poolDate,
                    baseAmount: newAmount,
                    bronzeContribution: 0,
                    silverContribution: 0,
                    bronzeRecharge: 0,
                    silverRecharge: 0,
                    bonus: 0,
                    finalAmount: newAmount,
                    participantCount: 0,
                    locked: false,
                    isAdjusted: true,
                    adjustedBy: 'admin',
                    createdAt: new Date().toISOString()
                };
                await Database.insert('pools', pool);
            } else {
                // 如果已锁定，不能修改
                if (pool.locked) {
                    await this.bot.sendMessage(chatId, '❌ Cannot adjust: Pool is already locked for draw');
                    return;
                }

                // 保存原始金额用于记录
                const originalAmount = pool.finalAmount;
                
                // 更新奖池
                pool.baseAmount = newAmount;
                pool.finalAmount = newAmount;
                pool.isAdjusted = true;
                pool.adjustedBy = 'admin';
                pool.adjustedAt = new Date().toISOString();
                pool.originalAmount = originalAmount;
                
                await Database.update('pools', pool.id, pool);
            }

            // 发送确认消息
            const confirmMsg = 
                '✅ *Pool Amount Adjusted*\n\n' +
                `Date: ${poolDate}\n` +
                `New Amount: *₹${newAmount.toLocaleString()}*\n\n` +
                '🎉 Festival special activated!';

            await this.bot.sendMessage(chatId, confirmMsg, { parse_mode: 'Markdown' });
            
            console.log(`[ADMIN] Pool adjusted: ${poolDate} -> ₹${newAmount}`);

        } catch (error) {
            console.error('[ADJUST_POOL] Error:', error);
            await this.bot.sendMessage(chatId, '❌ Failed to adjust pool amount');
        }
    }
}

module.exports = AdminGiveNumbers;
