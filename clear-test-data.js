/**
 * 清除测试数据脚本
 * 用于重置数据库，重新开始测试
 */

const mongoose = require('mongoose');

async function clearTestData() {
    try {
        console.log('🧹 开始清除测试数据...\n');
        
        // 连接 MongoDB
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('❌ 错误: MONGODB_URI 环境变量未设置');
            process.exit(1);
        }
        
        await mongoose.connect(uri);
        console.log('✅ 已连接到 MongoDB\n');
        
        // 获取所有集合
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        console.log('📁 数据库中的集合:', collectionNames.join(', '), '\n');
        
        // 定义要清除的集合
        const collectionsToClear = [
            'users',           // 用户数据
            'lotterynumbers',  // 幸运号码
            'tieridentities',  // 等级身份
            'recharges',       // 充值记录
            'pools',           // 奖池记录
            'winners',         // 中奖记录
            'inviterecords',   // 邀请记录
            'checkins'         // 签到记录
        ];
        
        // 清除每个集合
        for (const collectionName of collectionsToClear) {
            if (collectionNames.includes(collectionName)) {
                const collection = mongoose.connection.db.collection(collectionName);
                const count = await collection.countDocuments();
                await collection.deleteMany({});
                console.log(`✅ 已清除 ${collectionName}: ${count} 条记录`);
            } else {
                console.log(`⚠️  集合 ${collectionName} 不存在，跳过`);
            }
        }
        
        console.log('\n🎉 数据清除完成！');
        console.log('\n📋 你可以开始新的测试流程：');
        console.log('   1. 新用户点击 /start');
        console.log('   2. 点击 Join Now → FREE Entry');
        console.log('   3. 输入游戏ID（7位数字）');
        console.log('   4. 等待管理员审批');
        console.log('   5. 查看"我的账户"确认号码');
        
    } catch (error) {
        console.error('\n❌ 清除数据时出错:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 已断开 MongoDB 连接');
    }
}

// 执行清除
clearTestData();
