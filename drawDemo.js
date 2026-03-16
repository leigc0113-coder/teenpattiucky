/**
 * ============================================================
 * 开奖演示脚本 (drawDemo.js)
 * ============================================================
 * 
 * 演示开奖逻辑和概率计算
 */

const Database = require('./database');
const DrawService = require('./drawService');
const LotteryService = require('./lotteryService');

async function runDemo() {
    console.log('🎰 开奖逻辑演示\n');
    console.log('=' .repeat(50));
    
    await Database.init();
    
    const today = new Date().toISOString().split('T')[0];
    
    // 创建演示用户
    const demoUsers = [
        { id: 'user_1', name: 'User A (新手)', type: 'free' },
        { id: 'user_2', name: 'User B (小R)', type: 'silver' },
        { id: 'user_3', name: 'User C (中R)', type: 'gold' },
        { id: 'user_4', name: 'User D (大R)', type: 'crown' },
        { id: 'user_5', name: 'User E (VIP)', type: 'vip' }
    ];
    
    console.log('\n👥 演示用户:');
    for (const user of demoUsers) {
        console.log(`  • ${user.name}`);
    }
    
    // 为每个用户生成号码
    console.log('\n🎫 生成号码:');
    
    const userNumbers = [];
    
    // User A: 1个Free号码
    const freeNumbers = await LotteryService.generateFreeNumbers('user_1', 'demo', today, 1);
    userNumbers.push({ user: 'User A', numbers: freeNumbers, totalWeight: 1 });
    console.log(`  User A: 1个Free号码 (权重: 1x)`);
    
    // User B: 2个Silver号码
    const silverNumbers = await LotteryService.generateNumbers('user_2', 100, 'demo', today);
    userNumbers.push({ user: 'User B', numbers: silverNumbers.numbers, totalWeight: silverNumbers.totalWeight });
    console.log(`  User B: ${silverNumbers.count}个Silver号码 (权重: ${silverNumbers.baseWeight}x each, 总权重: ${silverNumbers.totalWeight})`);
    
    // User C: 4个Gold号码
    const goldNumbers = await LotteryService.generateNumbers('user_3', 500, 'demo', today);
    userNumbers.push({ user: 'User C', numbers: goldNumbers.numbers, totalWeight: goldNumbers.totalWeight });
    console.log(`  User C: ${goldNumbers.count}个Gold号码 (权重: ${goldNumbers.baseWeight}x each, 总权重: ${goldNumbers.totalWeight})`);
    
    // User D: 8个Crown号码
    const crownNumbers = await LotteryService.generateNumbers('user_4', 5000, 'demo', today);
    userNumbers.push({ user: 'User D', numbers: crownNumbers.numbers, totalWeight: crownNumbers.totalWeight });
    console.log(`  User D: ${crownNumbers.count}个Crown号码 (权重: ${crownNumbers.baseWeight}x each, 总权重: ${crownNumbers.totalWeight})`);
    
    // User E: VIP用户，4个Gold号码(1.5倍权重)
    // 先创建VIP身份
    const VIPService = require('./vipService');
    await Database.insert('tierIdentities', {
        id: 'tier_user_5',
        userId: 'user_5',
        level: 5,
        tierName: 'Gold',
        number: '01',
        displayName: 'VIP·Gold·01',
        isVIP: true,
        totalRecharge: 20000
    });
    
    const vipNumbers = await LotteryService.generateNumbers('user_5', 500, 'demo', today);
    userNumbers.push({ user: 'User E (VIP)', numbers: vipNumbers.numbers, totalWeight: vipNumbers.totalWeight, isVIP: true });
    console.log(`  User E: ${vipNumbers.count}个Gold号码 (VIP 1.5x加成, 权重: ${vipNumbers.baseWeight}x → ${vipNumbers.finalWeight}x, 总权重: ${vipNumbers.totalWeight})`);
    
    // 计算总权重
    const totalWeight = userNumbers.reduce((sum, u) => sum + u.totalWeight, 0);
    const totalNumbers = userNumbers.reduce((sum, u) => sum + u.numbers.length, 0);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 统计:');
    console.log(`  总号码数: ${totalNumbers}`);
    console.log(`  总权重: ${totalWeight}`);
    console.log(`  中奖人数: ${Math.floor(totalNumbers * 0.05)} (5%)`);
    
    // 计算每个用户的中奖概率
    console.log('\n📈 中奖概率分析:');
    console.log('-'.repeat(50));
    
    for (const user of userNumbers) {
        const probability = (user.totalWeight / totalWeight * 100).toFixed(2);
        const bar = '█'.repeat(Math.round(probability / 2)) + '░'.repeat(50 - Math.round(probability / 2));
        console.log(`  ${user.user.padEnd(15)} ${bar} ${probability}%`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏆 奖项分配 (假设奖池 ₹10,000):');
    console.log('-'.repeat(50));
    
    const poolAmount = 10000;
    const winnerCount = Math.floor(totalNumbers * 0.05);
    
    console.log(`  🥇 一等奖 (1人):   ₹${(poolAmount * 0.4).toLocaleString()}`);
    console.log(`  🥈 二等奖 (2人):   ₹${(poolAmount * 0.2).toLocaleString()} /人`);
    if (winnerCount > 3) {
        console.log(`  🥉 三等奖 (${winnerCount-3}人): ₹${Math.floor(poolAmount * 0.2 / (winnerCount-3)).toLocaleString()} /人`);
    }
    
    console.log('\n💡 关键结论:');
    console.log('  1. 权重越高，中奖概率越大');
    console.log('  2. 号码越多，抽奖机会越多');
    console.log('  3. VIP加成显著提升概率');
    console.log('  4. 但低权重仍有中奖可能（运气成分）');
    
    console.log('\n' + '='.repeat(50));
    console.log('演示完成!');
    
    process.exit(0);
}

runDemo().catch(e => {
    console.error('演示失败:', e);
    process.exit(1);
});
