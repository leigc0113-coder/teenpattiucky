/**
 * ============================================================
 * 号码等级服务 (numberTierService.js)
 * ============================================================
 * 
 * 处理号码等级系统：
 * - 生成带等级标记的号码
 * - 计算权重
 * - 号码等级分布统计
 */

const Database = require('./database');
const CONFIG = require('./config');

class NumberTierService {
    
    /**
     * 获取充值对应的号码等级
     * @param {number} amount - 充值金额
     * @returns {Object} 号码等级配置
     */
    getTierByAmount(amount) {
        const tiers = Object.keys(CONFIG.RECHARGE_TIERS)
            .map(Number)
            .sort((a, b) => a - b);
        
        let selectedTier = CONFIG.RECHARGE_TIERS[0];
        
        for (const threshold of tiers) {
            if (amount >= threshold) {
                selectedTier = CONFIG.RECHARGE_TIERS[threshold];
            }
        }
        
        // 合并配置，确保 count 字段正确
        const tierInfo = CONFIG.NUMBER_TIERS[selectedTier.tier];
        
        return {
            ...selectedTier,  // 包含 count, weight
            ...tierInfo,      // 包含 code, emoji, name, baseWeight
            // 明确指定 count 和 weight，避免被覆盖
            count: selectedTier.count,
            weight: selectedTier.weight || tierInfo.baseWeight,
            baseWeight: tierInfo.baseWeight
        };
    }
    
    /**
     * 生成带等级标记的号码
     * @param {string} tierCode - 等级代码 (F/S/G/D/C/V)
     * @param {number} count - 数量
     * @param {string} date - 日期
     * @returns {Array} 号码列表
     */
    async generateTierNumbers(tierCode, count, date) {
        console.log(`[生成号码] 等级: ${tierCode}, 数量: ${count}, 日期: ${date}`);
        console.log(`[生成号码] 接收到的 date 参数: ${date}, 类型: ${typeof date}`);
        
        if (!date) {
            console.error(`[生成号码] ERROR: date 参数为空！`);
            date = new Date().toISOString().split('T')[0];
            console.log(`[生成号码] 使用备用日期: ${date}`);
        }
        
        const tier = Object.values(CONFIG.NUMBER_TIERS).find(t => t.code === tierCode);
        if (!tier) {
            console.error(`[生成号码] 找不到等级: ${tierCode}`);
            return [];
        }
        
        // 确保 count 是数字
        const numCount = parseInt(count) || 1;
        
        // 获取当日该等级最大序号
        const existing = await Database.findAll('lotteryNumbers', { date });
        const tierNumbers = existing.filter(n => n.tierCode === tierCode);
        let maxSeq = 0;
        
        for (const num of tierNumbers) {
            const seq = parseInt(num.number.split('-')[1] || 0);
            if (seq > maxSeq) maxSeq = seq;
        }
        
        const numbers = [];
        const now = new Date().toISOString();
        
        for (let i = 1; i <= numCount; i++) {
            const seq = maxSeq + i;
            
            // 确保 date 存在
            if (!date) {
                console.error(`[生成号码] ERROR: date 为空，无法创建号码`);
                date = new Date().toISOString().split('T')[0];
            }
            
            const numObj = {
                id: `${tierCode}-${date}-${seq}`,
                number: `${tierCode}-${seq.toString().padStart(4, '0')}`,
                tierCode,
                tierName: tier.name,
                emoji: tier.emoji,
                weight: tier.baseWeight,
                date: date,  // 明确设置 date
                createdAt: now
            };
            console.log(`[生成号码] 创建号码对象: ${numObj.number}, date=${numObj.date}`);
            numbers.push(numObj);
        }
        
        console.log(`[生成号码] 成功生成 ${numbers.length} 个号码，样例:`, numbers[0]);
        return numbers;
    }
    
    /**
     * 获取用户的号码分布统计
     * @param {string} userId - 用户ID
     * @param {string} date - 日期
     * @returns {Object} 分布统计
     */
    async getNumberDistribution(userId, date) {
        // 获取所有号码，然后手动过滤，避免类型不匹配问题
        const allNumbers = await Database.getAll('lotteryNumbers');
        const numbers = allNumbers.filter(n => {
            const nUserId = String(n.userId || '');
            const queryUserId = String(userId || '');
            return nUserId === queryUserId 
                && n.date === date 
                && n.status === 'VALID';
        });
        
        const distribution = {};
        let totalWeight = 0;
        
        for (const num of numbers) {
            if (!distribution[num.tierCode]) {
                distribution[num.tierCode] = {
                    emoji: num.emoji,
                    name: num.tierName,
                    count: 0,
                    numbers: [],
                    weight: num.weight
                };
            }
            distribution[num.tierCode].count++;
            distribution[num.tierCode].numbers.push(num.number);
            totalWeight += num.weight;
        }
        
        return { distribution, totalWeight, totalCount: numbers.length };
    }
    
    /**
     * 计算用户中奖概率
     * @param {string} userId - 用户ID
     * @param {string} date - 日期
     * @returns {Object} 概率信息
     */
    async getWinProbability(userId, date) {
        const userDist = await this.getNumberDistribution(userId, date);
        
        // 获取当日所有号码
        const allNumbers = await Database.findAll('lotteryNumbers', {
            date,
            status: 'VALID'
        });
        
        let totalPoolWeight = 0;
        for (const num of allNumbers) {
            totalPoolWeight += num.weight;
        }
        
        const probability = totalPoolWeight > 0 
            ? (userDist.totalWeight / totalPoolWeight * 100).toFixed(1)
            : 0;
        
        return {
            userWeight: userDist.totalWeight,
            poolWeight: totalPoolWeight,
            probability: parseFloat(probability),
            comparison: this.getProbabilityComparison(parseFloat(probability))
        };
    }
    
    /**
     * 概率对比描述
     * @param {number} probability - 概率百分比
     * @returns {string} 描述
     */
    getProbabilityComparison(probability) {
        if (probability >= 50) return '极高 🚀';
        if (probability >= 30) return '很高 🔥';
        if (probability >= 15) return '较高 ⭐';
        if (probability >= 5) return '中等 📊';
        if (probability >= 1) return '较低 📉';
        return '极低 🌱';
    }
    
    /**
     * 格式化号码展示
     * @param {Array} numbers - 号码列表
     * @param {boolean} compact - 是否紧凑模式
     * @returns {string} 格式化文本
     */
    formatNumbersDisplay(numbers, compact = false) {
        if (numbers.length === 0) return '暂无号码';
        
        // 按等级分组
        const byTier = {};
        for (const num of numbers) {
            if (!byTier[num.tierCode]) {
                byTier[num.tierCode] = {
                    emoji: num.emoji,
                    name: num.tierName,
                    weight: num.weight,
                    items: []
                };
            }
            byTier[num.tierCode].items.push(num.number);
        }
        
        let result = '';
        
        for (const [code, group] of Object.entries(byTier)) {
            if (compact) {
                // 紧凑模式: ⭐ 银级号 ×3 [#S-1001~S-1003]
                const range = group.items.length > 3 
                    ? `${group.items[0]}~${group.items[group.items.length-1].split('-')[1]}`
                    : group.items.join(', ');
                result += `${group.emoji} ${group.name} ×${group.items.length} [${range}]\n`;
            } else {
                // 详细模式
                result += `${group.emoji} ${group.name} ×${group.items.length} (权重${group.weight}x)\n`;
                result += `   ${group.items.join(', ')}\n`;
            }
        }
        
        return result.trim();
    }
    
    /**
     * 获取充值档位展示文本
     * @returns {string} 档位说明
     */
    getTierDisplayText() {
        let text = '💰 *选择充值档位*\n\n';
        text += '充值越多，号码等级越高，中奖概率越大！\n\n';
        
        const tiers = [
            { amount: 0, label: '🎁 免费参与', desc: '1个免费号 (1x)' },
            { amount: 100, label: '⭐ 银级号码', desc: '2个号码 (2-3x)' },
            { amount: 500, label: '⭐⭐ 金级号码', desc: '4-5个号码 (4-6x)' },
            { amount: 2000, label: '⭐⭐⭐ 钻石号码', desc: '6-7个号码 (6-9x)' },
            { amount: 4999, label: '👑 皇冠号码', desc: '8-10个号码 (8-15x)' },
            { amount: 20000, label: '👑👑 至尊号码', desc: '12个号码 (18x)' }
        ];
        
        for (const t of tiers) {
            if (t.amount === 0) {
                text += `${t.label}\n└─ ${t.desc}\n\n`;
            } else {
                text += `${t.label}\n└─ ₹${t.amount.toLocaleString()} 起\n   ${t.desc}\n\n`;
            }
        }
        
        text += '💡 *VIP用户所有号码权重×1.5倍！*';
        
        return text;
    }
}

module.exports = new NumberTierService();
