/**
 * ============================================================
 * 开奖服务 (drawService.js) - 优化版
 * ============================================================
 * 
 * 支持权重开奖
 */

const Database = require('./database');
const crypto = require('crypto');

class DrawService {
    
    /**
     * 执行开奖
     */
    async drawWinners(drawDate) {
        const pool = await Database.findOne('pools', { date: drawDate, locked: true });
        if (!pool) {
            return { success: false, message: 'POOL_NOT_LOCKED' };
        }

        const numbers = await Database.findAll('lotteryNumbers', {
            date: drawDate,
            status: 'VALID'
        });

        if (numbers.length < 10) {
            return { success: false, message: 'NOT_ENOUGH_PARTICIPANTS' };
        }

        const winnerCount = Math.min(Math.floor(numbers.length * 0.05), 20);
        const seed = Date.now().toString();
        const winners = this.weightedRandomSelect(numbers, winnerCount, seed);

        // 奖项分配
        const totalPool = pool.finalAmount;
        const firstPrize = totalPool * 0.4;
        const secondPrize = totalPool * 0.4 / 2;
        const thirdPrize = totalPool * 0.2 / (winnerCount - 3);

        const winnerRecords = [];
        const now = new Date().toISOString();

        for (let i = 0; i < winners.length; i++) {
            const num = winners[i];
            let prizeTier, amount;

            if (i === 0) {
                prizeTier = 1;
                amount = firstPrize;
            } else if (i <= 2) {
                prizeTier = 2;
                amount = secondPrize;
            } else {
                prizeTier = 3;
                amount = thirdPrize;
            }

            const winner = {
                id: `win_${drawDate}_${i}`,
                poolId: pool.id,
                numberId: num.id,
                number: num.number,
                tierCode: num.tierCode,
                userId: num.userId,
                prizeTier,
                amount: Math.floor(amount),
                status: 'PENDING',
                createdAt: now
            };

            await Database.insert('winners', winner);
            winnerRecords.push(winner);
            await Database.update('lotteryNumbers', num.id, { status: 'WON' });
        }

        // 回收其他号码
        const remaining = await Database.findAll('lotteryNumbers', {
            date: drawDate,
            status: 'VALID'
        });

        for (const num of remaining) {
            await Database.update('lotteryNumbers', num.id, { status: 'USED' });
        }

        return {
            success: true,
            winners: winnerRecords,
            seed,
            poolAmount: totalPool
        };
    }
    
    /**
     * 加权随机选择
     */
    weightedRandomSelect(candidates, count, seed) {
        const result = [];
        const temp = [...candidates];
        let random = this.seededRandom(seed);

        for (let i = 0; i < Math.min(count, temp.length); i++) {
            const totalWeight = temp.reduce((sum, item) => sum + (item.finalWeight || item.weight || 1), 0);
            let r = random() * totalWeight;
            
            let cumulative = 0;
            for (let j = 0; j < temp.length; j++) {
                cumulative += (temp[j].finalWeight || temp[j].weight || 1);
                if (r <= cumulative) {
                    result.push(temp[j]);
                    temp.splice(j, 1);
                    break;
                }
            }
        }

        return result;
    }
    
    /**
     * 基于seed的随机数
     */
    seededRandom(seed) {
        let hash = crypto.createHash('sha256').update(seed).digest('hex');
        let index = 0;
        
        return function() {
            if (index >= hash.length - 8) {
                hash = crypto.createHash('sha256').update(hash).digest('hex');
                index = 0;
            }
            const hex = hash.substr(index, 8);
            index += 8;
            return parseInt(hex, 16) / 0xffffffff;
        };
    }
    
    /**
     * 获取中奖详情
     */
    async getWinnersWithDetails(drawDate) {
        const winners = await Database.findAll('winners', { 
            poolId: `pool_${drawDate}` 
        });
        
        const results = [];

        for (const winner of winners) {
            const user = await Database.findById('users', winner.userId);
            const tier = await Database.findOne('tierIdentities', { userId: winner.userId });
            
            results.push({
                ...winner,
                telegramId: user?.telegramId,
                gameId: user?.gameId
            });
        }

        return results;
    }
}

module.exports = new DrawService();
