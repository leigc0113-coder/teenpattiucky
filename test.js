/**
 * ============================================================
 * 测试脚本 (test.js)
 * ============================================================
 * 
 * 测试各项功能是否正常工作
 */

const Database = require('./database');
const UserService = require('./userService');
const TierService = require('./tierService');
const VIPService = require('./vipService');
const LotteryService = require('./lotteryService');
const NumberTierService = require('./numberTierService');
const CheckinService = require('./checkinService');
const PoolService = require('./poolService');
const InviteService = require('./inviteService');
const RechargeService = require('./rechargeService');

// 测试配置
const TEST_USER_ID = 'test_user_001';
const TEST_TELEGRAM_ID = 123456789;
const TEST_GAME_ID = '7654321';

async function runTests() {
    console.log('🧪 开始测试...\n');
    
    // 初始化数据库
    await Database.init();
    console.log('✅ 数据库初始化完成\n');
    
    let passed = 0;
    let failed = 0;
    
    // 测试1: 用户创建
    try {
        console.log('📋 测试1: 用户创建');
        const user = await UserService.createUser(
            TEST_TELEGRAM_ID, 
            TEST_GAME_ID, 
            'TestUser', 
            'NEW'
        );
        if (user && user.id) {
            console.log('  ✅ 用户创建成功:', user.id);
            passed++;
        } else {
            throw new Error('用户创建失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试2: 等级身份分配
    try {
        console.log('\n📋 测试2: 等级身份分配');
        const tier = await TierService.assignTierNumber(TEST_USER_ID);
        if (tier && tier.displayName) {
            console.log('  ✅ 等级分配成功:', tier.displayName);
            passed++;
        } else {
            throw new Error('等级分配失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试3: 生成免费号码
    try {
        console.log('\n📋 测试3: 生成免费号码');
        const today = new Date().toISOString().split('T')[0];
        const numbers = await LotteryService.generateFreeNumbers(TEST_USER_ID, 'test', today, 2);
        if (numbers && numbers.length === 2) {
            console.log('  ✅ 免费号码生成成功:', numbers.map(n => n.number).join(', '));
            passed++;
        } else {
            throw new Error('免费号码生成失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试4: 生成充值号码
    try {
        console.log('\n📋 测试4: 生成充值号码 (₹500)');
        const today = new Date().toISOString().split('T')[0];
        const result = await LotteryService.generateNumbers(TEST_USER_ID, 500, 'test', today);
        if (result && result.numbers.length > 0) {
            console.log('  ✅ 充值号码生成成功:', result.numbers.length, '个号码');
            console.log('     等级:', result.tier.name, '权重:', result.baseWeight);
            passed++;
        } else {
            throw new Error('充值号码生成失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试5: 号码统计
    try {
        console.log('\n📋 测试5: 号码统计');
        const today = new Date().toISOString().split('T')[0];
        const stats = await LotteryService.getUserNumberStats(TEST_USER_ID, today);
        if (stats && stats.totalCount > 0) {
            console.log('  ✅ 统计成功:', stats.totalCount, '个号码, 权重:', stats.totalWeight);
            passed++;
        } else {
            throw new Error('统计失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试6: 签到
    try {
        console.log('\n📋 测试6: 签到');
        const result = await CheckinService.checkin(TEST_USER_ID);
        if (result && result.success) {
            console.log('  ✅ 签到成功, 连续:', result.consecutiveDays, '天, 奖励:', result.rewardCount, '个号码');
            passed++;
        } else {
            throw new Error('签到失败: ' + (result.message || '未知错误'));
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试7: 邀请码生成
    try {
        console.log('\n📋 测试7: 邀请码生成');
        const record = await InviteService.createInviteRecord(TEST_USER_ID);
        if (record && record.inviteCode) {
            console.log('  ✅ 邀请码生成成功:', record.inviteCode);
            passed++;
        } else {
            throw new Error('邀请码生成失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试8: 充值提交和审核
    try {
        console.log('\n📋 测试8: 充值流程');
        const recharge = await RechargeService.submitRecharge(
            TEST_USER_ID, 
            'test_screenshot_id', 
            1000, 
            'GOLD'
        );
        if (recharge && recharge.id) {
            console.log('  ✅ 充值提交成功:', recharge.id.slice(-12));
            
            // 审核
            const approved = await RechargeService.approveRecharge(recharge.id, 1000, 'admin_001');
            if (approved) {
                console.log('  ✅ 充值审核成功');
                passed++;
            } else {
                throw new Error('审核失败');
            }
        } else {
            throw new Error('充值提交失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试9: VIP进度检查
    try {
        console.log('\n📋 测试9: VIP进度检查');
        const progress = await VIPService.getVIPProgress(TEST_USER_ID);
        if (progress) {
            console.log('  ✅ VIP进度:', progress.isVIP ? '已是VIP' : `连续${progress.consecutiveDays}/5天`);
            passed++;
        } else {
            throw new Error('VIP进度检查失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试10: 奖池计算
    try {
        console.log('\n📋 测试10: 奖池计算');
        const today = new Date().toISOString().split('T')[0];
        const pool = await PoolService.calculateDailyPool(today);
        if (pool && pool.finalAmount >= 0) {
            console.log('  ✅ 奖池计算成功: ₹', pool.finalAmount);
            passed++;
        } else {
            throw new Error('奖池计算失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试11: 等级升级
    try {
        console.log('\n📋 测试11: 等级升级');
        const result = await TierService.addRecharge(TEST_USER_ID, 10000);
        if (result) {
            console.log('  ✅ 等级升级检查完成:', result.upgraded ? `升级到Lv.${result.newLevel}` : '未升级');
            passed++;
        } else {
            throw new Error('等级升级检查失败');
        }
    } catch (e) {
        console.log('  ❌ 失败:', e.message);
        failed++;
    }
    
    // 测试结果汇总
    console.log('\n========================================');
    console.log('📊 测试结果汇总');
    console.log('========================================');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 成功率: ${Math.round(passed / (passed + failed) * 100)}%`);
    console.log('========================================');
    
    if (failed === 0) {
        console.log('\n🎉 所有测试通过！');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查代码');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

// 清理测试数据（可选）
async function cleanup() {
    console.log('🧹 清理测试数据...');
    // 这里可以添加清理逻辑
}

// 运行测试
runTests().catch(e => {
    console.error('测试执行错误:', e);
    process.exit(1);
});
