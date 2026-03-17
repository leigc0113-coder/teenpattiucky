/**
 * ============================================================
 * 开奖结果通知服务 (drawNotification.js)
 * ============================================================
 * 
 * 开奖后向所有参与者发送结果通知
 */

const Database = require('./database');

class DrawNotification {
    constructor(bot) {
        this.bot = bot;
    }

    /**
     * 发送开奖结果给所有参与者
     */
    async sendDrawResults(drawDate, winners, poolAmount) {
        console.log(`[NOTIFY] Sending draw results for ${drawDate}`);

        // 获取所有参与者（首先查询指定日期）
        let allNumbers = await Database.findAll('lotteryNumbers', {
            date: drawDate,
            status: { $in: ['VALID', 'WON', 'USED'] }
        });

        // 如果没有找到，尝试查询前一天
        if (!allNumbers || allNumbers.length === 0) {
            const yesterday = new Date(drawDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            console.log(`[NOTIFY] No numbers for ${drawDate}, trying ${yesterdayStr}`);
            
            allNumbers = await Database.findAll('lotteryNumbers', {
                date: yesterdayStr,
                status: { $in: ['VALID', 'WON', 'USED'] }
            });
        }

        console.log(`[NOTIFY] Found ${allNumbers?.length || 0} total numbers for date ${drawDate}`);
        
        if (!allNumbers || allNumbers.length === 0) {
            console.log(`[NOTIFY] WARNING: No numbers found for date ${drawDate} or previous day`);
        }

        // 按用户分组
        const userMap = new Map();
        for (const num of allNumbers || []) {
            if (!userMap.has(num.userId)) {
                userMap.set(num.userId, []);
            }
            userMap.get(num.userId).push(num);
        }

        console.log(`[NOTIFY] Found ${userMap.size} unique users`);

        // 获取中奖用户ID集合
        const winnerUserIds = new Set(winners.map(w => w.userId));

        console.log(`[NOTIFY] Found ${winnerUserIds.size} winners`);

        // 准备统计数据
        const stats = {
            totalParticipants: userMap.size,
            totalNumbers: allNumbers?.length || 0,
            totalWinners: winners.length,
            poolAmount: poolAmount || 0
        };
        
        console.log(`[NOTIFY] Stats:`, stats);

        // 通知中奖者
        let winnerNotified = 0;
        for (const winner of winners) {
            await this.notifyWinner(winner, winners, stats, drawDate);
            winnerNotified++;
        }
        console.log(`[NOTIFY] Notified ${winnerNotified} winners`);

        // 通知未中奖者
        let nonWinnerNotified = 0;
        let nonWinnerSkipped = 0;
        let nonWinnerTotal = 0;
        
        for (const [userId, numbers] of userMap) {
            if (!winnerUserIds.has(userId)) {
                nonWinnerTotal++;
                console.log(`[NOTIFY] Processing non-winner ${userId} with ${numbers.length} numbers`);
                
                const user = await Database.findById('users', userId);
                if (!user) {
                    console.log(`[NOTIFY] Skip non-winner ${userId}: user not found`);
                    nonWinnerSkipped++;
                    continue;
                }
                
                if (!user.telegramId || user.telegramId === 0) {
                    console.log(`[NOTIFY] Skip non-winner ${userId}: no telegramId`);
                    nonWinnerSkipped++;
                    continue;
                }
                
                try {
                    await this.notifyNonWinner(userId, numbers, winners, stats, drawDate);
                    nonWinnerNotified++;
                    console.log(`[NOTIFY] Successfully notified non-winner ${userId}`);
                } catch (e) {
                    console.error(`[NOTIFY] Failed to notify non-winner ${userId}:`, e.message);
                }
            }
        }
        console.log(`[NOTIFY] Total non-winners: ${nonWinnerTotal}, Notified: ${nonWinnerNotified}, Skipped: ${nonWinnerSkipped}`);

        // 发送汇总到管理员
        await this.sendAdminSummary(drawDate, winners, stats);

        console.log(`[NOTIFY] Completed. Notified ${userMap.size} users`);
    }

    /**
     * 通知中奖用户
     */
    async notifyWinner(winner, allWinners, stats, drawDate) {
        try {
            const user = await Database.findById('users', winner.userId);
            if (!user) return;

            // 跳过没有 Telegram ID 的用户（手动添加的用户）
            if (!user.telegramId || user.telegramId === 0) {
                console.log(`[NOTIFY] Skip notify manual user ${winner.userId} (no telegramId)`);
                return;
            }

            const prizeNames = { 1: '🥇 First Prize', 2: '🥈 Second Prize', 3: '🥉 Third Prize' };
            const prizeName = prizeNames[winner.prizeTier] || 'Winner';

            // 计算该用户中了几奖
            const userWins = allWinners.filter(w => w.userId === winner.userId);
            const winCount = userWins.length;

            // 使用正确的日期格式
            const dateStr = drawDate || new Date().toISOString().split('T')[0];
            const [year, month, day] = dateStr.split('-');
            const formattedDate = `${year}-${month}-${day}`;

            let message = 
                `🎉 *🎊 CONGRATULATIONS! 🎊*\n\n` +
                `📅 *Draw Date:* ${formattedDate}\n` +
                `💎 *Total Pool:* ₹${(stats.poolAmount || 0).toLocaleString()}\n\n`;

            if (winCount === 1) {
                message += 
                    `🎊 *You WON!*\n\n` +
                    `${prizeName}\n` +
                    `🎫 *Winning Number:* \`${winner.number}\`\n` +
                    `💰 *Your Prize:* ₹${(winner.amount || 0).toLocaleString()}\n\n`;
            } else {
                // 中多个奖
                const totalPrize = userWins.reduce((sum, w) => sum + (w.amount || 0), 0);
                message += 
                    `🎊 *INCREDIBLE! You won ${winCount} prizes!*\n\n` +
                    `*Your Winning Numbers:*\n`;
                
                for (const win of userWins) {
                    const pname = prizeNames[win.prizeTier] || 'Winner';
                    message += `${win.number} - ${pname} (₹${(win.amount || 0).toLocaleString()})\n`;
                }
                
                message += `\n💰 *Total Prize:* ₹${totalPrize.toLocaleString()}\n\n`;
            }

            message +=
                `📊 *Today's Statistics:*\n` +
                `• Total Participants: ${stats.totalParticipants}\n` +
                `• Total Numbers: ${stats.totalNumbers}\n` +
                `• Total Winners: ${stats.totalWinners}\n` +
                `• Your Win Rate: ${((winCount / stats.totalWinners) * 100).toFixed(1)}%\n\n` +
                `📌 *Claim Instructions:*\n` +
                `1. Screenshot this message\n` +
                `2. Contact admin within 48 hours\n` +
                `3. Provide your Game ID: ${user.gameId}\n` +
                `4. Prize will be sent via UPI\n\n` +
                `⏰ *Claim Deadline:* ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
                `🎰 *Play again tomorrow for more chances!*`;

            await this.bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error(`[NOTIFY] Failed to notify winner ${winner.userId}:`, error);
        }
    }

    /**
     * 通知未中奖用户
     */
    async notifyNonWinner(userId, numbers, winners, stats, drawDate) {
        try {
            const user = await Database.findById('users', userId);
            if (!user) return;

            // 跳过没有 Telegram ID 的用户（手动添加的用户）
            if (!user.telegramId || user.telegramId === 0) {
                console.log(`[NOTIFY] Skip notify manual user ${userId} (no telegramId)`);
                return;
            }

            // 使用正确的日期格式
            const dateStr = drawDate || new Date().toISOString().split('T')[0];
            const [year, month, day] = dateStr.split('-');
            const formattedDate = `${year}-${month}-${day}`;

            // 获取中奖者信息（显示前几名）
            let winnersInfo = '';
            const topWinners = winners.slice(0, 3);
            for (const w of topWinners) {
                const wuser = await Database.findById('users', w.userId);
                const prizeName = w.prizeTier === 1 ? '🥇' : w.prizeTier === 2 ? '🥈' : '🥉';
                winnersInfo += `${prizeName} ${w.number} - ${wuser?.gameId || 'Unknown'}\n`;
            }

            // 安全获取统计数据
            const poolAmount = stats.poolAmount || 0;
            const totalParticipants = stats.totalParticipants || 0;
            const totalNumbers = stats.totalNumbers || 0;
            const totalWinners = stats.totalWinners || 0;
            const winRate = totalNumbers > 0 ? ((totalWinners / totalNumbers) * 100).toFixed(1) : '0.0';

            const message = 
                `📢 *Draw Result - ${formattedDate}*\n\n` +
                `😔 *Unfortunately, you didn't win this time.*\n\n` +
                `💎 *Pool Amount:* ₹${poolAmount.toLocaleString()}\n` +
                `🎫 *Your Numbers:* ${numbers.length}\n` +
                `🎰 *Your Numbers Were:*\n${numbers.map(n => n.number).join(', ')}\n\n` +
                `🏆 *Top Winners:*\n${winnersInfo}\n` +
                `📊 *Today's Statistics:*\n` +
                `• Total Participants: ${totalParticipants}\n` +
                `• Total Numbers: ${totalNumbers}\n` +
                `• Total Winners: ${totalWinners}\n` +
                `• Win Rate: ${winRate}%\n\n` +
                `💪 *Don't give up!*\n` +
                `• Recharge more to get higher weight numbers\n` +
                `• Invite friends for bonus numbers\n` +
                `• Check in daily for free numbers\n\n` +
                `🎰 *Tomorrow is another chance!*`;

            await this.bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
            console.log(`[NOTIFY] Successfully notified non-winner ${userId}`);

        } catch (error) {
            console.error(`[NOTIFY] Failed to notify user ${userId}:`, error.message);
        }
    }

    /**
     * 发送管理员汇总
     */
    async sendAdminSummary(drawDate, winners, stats) {
        try {
            const { ADMIN_IDS } = require('./config');
            if (!ADMIN_IDS || ADMIN_IDS.length === 0) return;

            // 获取详细中奖信息
            let winnerDetails = '';
            for (let i = 0; i < winners.length; i++) {
                const w = winners[i];
                const user = await Database.findById('users', w.userId);
                const prizeName = i === 0 ? '🥇 1st' : i <= 2 ? '🥈 2nd' : '🥉 3rd';
                winnerDetails += 
                    `${prizeName} | ${w.number} | ${user?.gameId || 'Unknown'} | ₹${w.amount.toLocaleString()}\n`;
            }

            const summary = 
                `🎲 *DRAW COMPLETED - ${drawDate}*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💰 *Pool Amount:* ₹${stats.poolAmount.toLocaleString()}\n` +
                `👥 *Total Participants:* ${stats.totalParticipants}\n` +
                `🎫 *Total Numbers:* ${stats.totalNumbers}\n` +
                `🏆 *Total Winners:* ${stats.totalWinners}\n\n` +
                `📋 *Winner List:*\n` +
                `Rank | Number | GameID | Prize\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                winnerDetails + '\n' +
                `⏰ Draw Time: 21:00 IST\n` +
                `✅ All notifications sent`;

            for (const adminId of ADMIN_IDS) {
                try {
                    await this.bot.sendMessage(adminId, summary, { parse_mode: 'Markdown' });
                } catch (e) {
                    console.error(`[NOTIFY] Failed to notify admin ${adminId}`);
                }
            }

        } catch (error) {
            console.error('[NOTIFY] Admin summary error:', error);
        }
    }
}

module.exports = DrawNotification;
