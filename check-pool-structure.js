// 检查奖池数据结构
const mongoose = require('mongoose');

async function checkPoolStructure() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const poolsCollection = db.collection('pools');
    
    console.log('🔍 检查奖池数据结构\n');
    
    // 获取所有奖池记录
    const pools = await poolsCollection.find({}).toArray();
    
    console.log(`找到 ${pools.length} 个奖池记录:\n`);
    
    for (const pool of pools) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`日期: ${pool.date}`);
        console.log(`ID: ${pool.id}`);
        console.log(`所有字段:`, Object.keys(pool).join(', '));
        console.log('\n详细数据:');
        console.log(`  baseAmount: ${pool.baseAmount}`);
        console.log(`  finalAmount: ${pool.finalAmount}`);
        console.log(`  amount: ${pool.amount}`);
        console.log(`  locked: ${pool.locked}`);
        console.log(`  participantCount: ${pool.participantCount}`);
        console.log(`  bronzeContribution: ${pool.bronzeContribution}`);
        console.log(`  silverContribution: ${pool.silverContribution}`);
        console.log('');
    }
    
    // 检查今天的奖池
    const today = '2026-03-18';
    const todayPool = await poolsCollection.findOne({ date: today });
    
    if (todayPool) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📅 今日奖池 (${today}):`);
        console.log(`  原始数据:`, JSON.stringify(todayPool, null, 2));
    } else {
        console.log(`❌ 未找到今日奖池 (${today})`);
    }
    
    await mongoose.disconnect();
}

checkPoolStructure().catch(console.error);
