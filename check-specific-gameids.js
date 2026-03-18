// 检查特定GameID的号码状态
const mongoose = require('mongoose');

async function checkSpecificGameIDs() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const numbersCollection = db.collection('lotterynumbers');
    
    // 用户提供的16个GameID
    const gameIds = [
        '2418690', '2523476', '2639184',
        '2146073', '2239581', '2367045',
        '2561847', '2675302', '2789461', '2891037', '2967548',
        '2073645', '2149582', '2236701', '2318459', '2457093'
    ];
    
    console.log('🔍 检查16个GameID的号码状态\n');
    console.log('日期: 2026-03-18');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let foundCount = 0;
    let missingCount = 0;
    
    for (const gameId of gameIds) {
        // 查找用户
        const user = await usersCollection.findOne({ gameId: gameId });
        
        if (!user) {
            console.log(`❌ GameID ${gameId}: 用户不存在`);
            missingCount++;
            continue;
        }
        
        // 查找该用户的今日号码
        const numbers = await numbersCollection.find({
            userId: user.id,
            date: '2026-03-18',
            status: 'VALID'
        }).toArray();
        
        if (numbers.length === 0) {
            console.log(`⚠️  GameID ${gameId} (userId: ${user.id}): 无今日号码`);
            missingCount++;
        } else {
            console.log(`✅ GameID ${gameId} (userId: ${user.id}): ${numbers.length} 个号码 - ${numbers.map(n => n.number).join(', ')}`);
            foundCount++;
        }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`找到: ${foundCount} 个用户`);
    console.log(`缺失: ${missingCount} 个用户`);
    console.log(`总计: ${gameIds.length} 个GameID`);
    
    // 显示今日所有用户ID列表（用于对比）
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('今日奖池统计到的所有用户ID:\n');
    
    const todayNumbers = await numbersCollection.find({
        date: '2026-03-18',
        status: 'VALID'
    }).toArray();
    
    const uniqueUserIds = [...new Set(todayNumbers.map(n => n.userId))];
    console.log(`唯一用户ID数: ${uniqueUserIds.length}`);
    uniqueUserIds.forEach((id, i) => {
        const count = todayNumbers.filter(n => n.userId === id).length;
        console.log(`${i+1}. ${id} - ${count} 个号码`);
    });
    
    await mongoose.disconnect();
}

checkSpecificGameIDs().catch(console.error);
