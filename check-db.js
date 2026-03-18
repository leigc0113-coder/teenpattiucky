/**
 * 检查 MongoDB 数据库内容
 */

const mongoose = require('mongoose');

async function checkDatabase() {
    try {
        console.log('🔍 正在连接 MongoDB...\n');
        
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ 错误: MONGODB_URI 环境变量未设置');
            process.exit(1);
        }
        
        await mongoose.connect(uri);
        console.log('✅ 已连接到 MongoDB\n');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('📁 数据库中的集合:\n');
        
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            const collection = db.collection(collectionName);
            const count = await collection.countDocuments();
            
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📂 集合: ${collectionName}`);
            console.log(`📊 文档数量: ${count}`);
            
            if (count > 0) {
                const sample = await collection.find().limit(3).toArray();
                console.log(`📄 样例数据:`);
                sample.forEach((doc, i) => {
                    // 简化输出，只显示关键字段
                    const simplified = {};
                    for (const [key, value] of Object.entries(doc)) {
                        if (key === '_id') continue;
                        if (typeof value === 'string' && value.length > 50) {
                            simplified[key] = value.substring(0, 50) + '...';
                        } else {
                            simplified[key] = value;
                        }
                    }
                    console.log(`   [${i + 1}] ${JSON.stringify(simplified, null, 2)}`);
                });
            }
            console.log('');
        }
        
        console.log('\n🗑️ 可以清理的数据建议:\n');
        
        // 检查具体集合
        const lotteryNumbers = db.collection('lotterynumbers');
        const numbersCount = await lotteryNumbers.countDocuments();
        console.log(`1. lotteryNumbers: ${numbersCount} 条记录`);
        if (numbersCount > 0) {
            const undefinedDate = await lotteryNumbers.countDocuments({ date: { $exists: false } });
            const undefinedUserId = await lotteryNumbers.countDocuments({ userId: { $exists: false } });
            console.log(`   - 缺少 date 字段: ${undefinedDate} 条`);
            console.log(`   - 缺少 userId 字段: ${undefinedUserId} 条`);
            if (undefinedDate > 0 || undefinedUserId > 0) {
                console.log(`   ⚠️ 建议: 删除这些无效记录`);
            }
        }
        
        const users = db.collection('users');
        const usersCount = await users.countDocuments();
        console.log(`\n2. users: ${usersCount} 条记录`);
        
        const recharges = db.collection('recharges');
        const rechargesCount = await recharges.countDocuments();
        console.log(`\n3. recharges: ${rechargesCount} 条记录`);
        
        const pools = db.collection('pools');
        const poolsCount = await pools.countDocuments();
        console.log(`\n4. pools: ${poolsCount} 条记录`);
        
        const winners = db.collection('winners');
        const winnersCount = await winners.countDocuments();
        console.log(`\n5. winners: ${winnersCount} 条记录`);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 清理建议:');
        console.log('   1. 测试数据可以全部删除');
        console.log('   2. 缺少关键字段的记录可以删除');
        console.log('   3. 旧的奖池记录可以归档或删除');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 已断开连接');
    }
}

checkDatabase();
