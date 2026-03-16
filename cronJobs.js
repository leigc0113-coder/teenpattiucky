/**
 * ============================================================
 * 定时任务执行脚本 (cronJobs.js)
 * ============================================================
 * 
 * 定时任务：
 * 1. 00:00 - VIP资格检查 + 冷静期释放
 * 2. 20:30 - 奖池计算并锁定
 * 3. 21:00 - 开奖
 * 4. 23:59 - VIP连续天数过期检查
 * 
 * 使用方式：
 * node cronJobs.js [task]
 * 
 * 任务：
 * - vip: VIP检查
 * - pool: 奖池计算
 * - draw: 开奖
 * - cooling: 冷静期检查
 * - reset-vip: VIP过期检查
 * - all: 执行所有
 */

const Database = require('./database');
const VIPService = require('./vipService');
const PoolService = require('./poolService');
const DrawService = require('./drawService');
const TierService = require('./tierService');
const { performDraw } = require('./bot');

// 获取今日日期（IST时区）
function getTodayIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
}

// 获取昨日日期
function getYesterdayIST() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset - 24 * 60 * 60 * 1000);
    return istTime.toISOString().split('T')[0];
}

// 任务：VIP检查
async function vipCheck() {
    console.log('[CRON] Starting VIP check...');
    const yesterday = getYesterdayIST();
    const results = await VIPService.batchVIPCheck(yesterday);
    console.log(`[CRON] VIP check completed. ${results.filter(r => r.isVIP).length} new VIPs`);
    return results;
}

// 任务：冷静期释放
async function coolingCheck() {
    console.log('[CRON] Starting cooling period check...');
    await TierService.checkCoolingPeriod();
    console.log('[CRON] Cooling period check completed');
}

// 任务：奖池计算
async function poolCalculation() {
    console.log('[CRON] Starting pool calculation...');
    const today = getTodayIST();
    const pool = await PoolService.calculateDailyPool(today);
    console.log(`[CRON] Pool calculated: ₹${pool.finalAmount}`);
    
    // 锁定奖池
    await PoolService.lockPool(today);
    console.log('[CRON] Pool locked');
    return pool;
}

// 任务：开奖
async function draw() {
    console.log('[CRON] Starting draw...');
    await performDraw();
    console.log('[CRON] Draw completed');
}

// 任务：VIP过期检查
async function vipExpirationCheck() {
    console.log('[CRON] Starting VIP expiration check...');
    const today = getTodayIST();
    await VIPService.batchResetExpiredStreaks(today);
    console.log('[CRON] VIP expiration check completed');
}

// 执行所有任务
async function runAll() {
    console.log('[CRON] Running all tasks...\n');
    await vipCheck();
    await coolingCheck();
    await poolCalculation();
    await draw();
    await vipExpirationCheck();
    console.log('\n[CRON] All tasks completed');
}

// 主函数
async function main() {
    const task = process.argv[2] || 'all';
    
    console.log(`[CRON] Task: ${task}`);
    console.log(`[CRON] Date: ${getTodayIST()}`);
    console.log('---\n');
    
    // 初始化数据库
    await Database.init();
    
    try {
        switch (task) {
            case 'vip':
                await vipCheck();
                break;
            case 'cooling':
                await coolingCheck();
                break;
            case 'pool':
                await poolCalculation();
                break;
            case 'draw':
                await draw();
                break;
            case 'reset-vip':
                await vipExpirationCheck();
                break;
            case 'all':
                await runAll();
                break;
            default:
                console.log('Usage: node cronJobs.js [vip|cooling|pool|draw|reset-vip|all]');
                process.exit(1);
        }
    } catch (error) {
        console.error('[CRON] Error:', error);
        process.exit(1);
    }
    
    console.log('\n---');
    console.log('[CRON] Done');
    process.exit(0);
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = {
    vipCheck,
    coolingCheck,
    poolCalculation,
    draw,
    vipExpirationCheck
};
