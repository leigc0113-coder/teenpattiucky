/**
 * 测试管理员审核流程
 */

const Database = require('./database');
const RechargeService = require('./rechargeService');
const LotteryService = require('./lotteryService');
const NumberTierService = require('./numberTierService');

async function testApprovalFlow() {
    console.log('🧪 测试管理员审核流程\n');
    
    await Database.init();
    
    const testUserId = 'test_user_approval';
    const testAmount = 500; // 测试 ₹500
    
    console.log(`[TEST] 测试金额: ₹${testAmount}`);
    
    // 1. 测试获取档位配置
    console.log('\n📋 1. 测试档位配置');
    const tierConfig = NumberTierService.getTierByAmount(testAmount);
    console.log('  Tier Config:', JSON.stringify(tierConfig, null, 2));
    
    if (!tierConfig || !tierConfig.count) {
        console.error('  ❌ 档位配置错误!');
        return;
    }
    console.log(`  ✅ 档位: ${tierConfig.tier}, 数量: ${tierConfig.count}, 权重: ${tierConfig.weight}`);
    
    // 2. 测试生成号码
    console.log('\n📋 2. 测试生成号码');
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const numbers = await LotteryService.generateNumbers(testUserId, testAmount, 'test', today);
        console.log('  Generated:', JSON.stringify({
            count: numbers?.count,
            tier: numbers?.tier,
            numbersLength: numbers?.numbers?.length,
            baseWeight: numbers?.baseWeight
        }, null, 2));
        
        if (!numbers || !numbers.numbers || numbers.numbers.length === 0) {
            console.error('  ❌ 号码生成失败!');
            return;
        }
        
        console.log(`  ✅ 生成了 ${numbers.count} 个号码`);
        console.log('  号码列表:', numbers.numbers.map(n => n.number).join(', '));
        
        // 验证数量和count是否一致
        if (numbers.count !== numbers.numbers.length) {
            console.error(`  ❌ 数量不匹配! count=${numbers.count}, actual=${numbers.numbers.length}`);
        } else {
            console.log('  ✅ 数量匹配');
        }
        
        // 验证金额对应的档位是否正确
        const expectedCount = tierConfig.count;
        if (numbers.count !== expectedCount) {
            console.error(`  ❌ 档位数量错误! 期望=${expectedCount}, 实际=${numbers.count}`);
        } else {
            console.log(`  ✅ 档位数量正确 (${expectedCount})`);
        }
        
    } catch (error) {
        console.error('  ❌ 生成号码出错:', error.message);
        console.error(error.stack);
    }
    
    // 3. 测试不同金额
    console.log('\n📋 3. 测试不同金额的档位');
    const testAmounts = [100, 500, 2000, 5000, 10000, 20000];
    
    for (const amount of testAmounts) {
        const config = NumberTierService.getTierByAmount(amount);
        console.log(`  ₹${amount.toString().padStart(5)} -> ${config.tier.padEnd(8)} | ${config.count}个号码 | ${config.weight}x权重`);
    }
    
    console.log('\n✅ 测试完成');
    process.exit(0);
}

testApprovalFlow().catch(e => {
    console.error('测试失败:', e);
    process.exit(1);
});
