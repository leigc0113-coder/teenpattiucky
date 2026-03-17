const Database = require('./database');

class HistoryService {
    async getUserWinHistory(userId, limit = 10) {
        try {
            const winners = await Database.getAll('winners');
            const userWins = winners
                .filter(w => w.userId === userId)
                .sort((a, b) => new Date(b.wonAt) - new Date(a.wonAt))
                .slice(0, limit);
            return userWins.map(w => ({
                date: w.poolId?.replace('pool_', '') || 'Unknown',
                number: w.number,
                prizeTier: w.prizeTier,
                amount: w.amount,
                wonAt: w.wonAt
            }));
        } catch (error) {
            console.error('[HISTORY] Error:', error);
            return [];
        }
    }

    async getDrawHistory(limit = 7) {
        try {
            const pools = await Database.getAll('pools');
            const winners = await Database.getAll('winners');
            const drawMap = new Map();
            for (const pool of pools) {
                if (pool.locked) {
                    drawMap.set(pool.date, {
                        date: pool.date,
                        poolAmount: pool.finalAmount || 0,
                        participantCount: pool.participantCount || 0,
                        winners: []
                    });
                }
            }
            for (const winner of winners) {
                const date = winner.poolId?.replace('pool_', '');
                if (date && drawMap.has(date)) {
                    drawMap.get(date).winners.push({
                        userId: winner.userId,
                        number: winner.number,
                        prizeTier: winner.prizeTier,
                        amount: winner.amount
                    });
                }
            }
            return Array.from(drawMap.values())
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, limit);
        } catch (error) {
            console.error('[HISTORY] Error:', error);
            return [];
        }
    }

    async getUserStats(userId) {
        try {
            const winners = await Database.getAll('winners');
            const userWins = winners.filter(w => w.userId === userId);
            const totalWins = userWins.length;
            const totalPrize = userWins.reduce((sum, w) => sum + (w.amount || 0), 0);
            const numbers = await Database.getAll('lotteryNumbers');
            const userNumbers = numbers.filter(n => n.userId === userId);
            const uniqueDates = new Set(userNumbers.map(n => n.date)).size;
            return {
                totalWins,
                totalPrize,
                participationDays: uniqueDates,
                winRate: uniqueDates > 0 ? ((totalWins / uniqueDates) * 100).toFixed(1) : 0
            };
        } catch (error) {
            console.error('[HISTORY] Error:', error);
            return { totalWins: 0, totalPrize: 0, participationDays: 0, winRate: 0 };
        }
    }
}

module.exports = new HistoryService();