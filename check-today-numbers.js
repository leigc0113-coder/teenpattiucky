// 临时脚本：检查今日号码统计详情
const mongoose = require('mongoose');

async function checkTodayNumbers() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const collection = db.collection('lotterynumbers');
    
    const today = '2026-03-18';
    
    console.log('🔍 检查今日号码统计详情\n');
    console.log('日期:', today);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 获取所有号码
    const allNumbers = await collection.find({}).toArray();
    console.log('数据库中总号码数:', allNumbers.length);
    
    // 按日期分组
    const dateGroups = {};
    allNumbers.forEach(n => {
        const date = n.date || 'undefined';
        if (!dateGroups[date]) {
            dateGroups[date] = [];
        }
        dateGroups[date].push({
            number: n.number,
            userId: n.userId,
            status: n.status,
            date: n.date,
            createdAt: n.createdAt
        });
    });
    
    console.log('\n按日期分布:');
    for (const [date, numbers] of Object.entries(dateGroups)) {
        console.log(`\n📅 ${date}: ${numbers.length} 个号码`);
        
        if (date === today) {
            console.log('  详细列表:');
            numbers.forEach((n, i) => {
                console.log(`  ${i+1}. ${n.number} | userId: ${n.userId} | status: ${n.status}`);
            });
            
            // 统计唯一用户
            const userIds = [...new Set(numbers.map(n => n.userId))];
            console.log(`\n  ✅ 唯一用户数: ${userIds.length}`);
            console.log('  用户列表:', userIds);
        }
    }
    
    // 检查今天有多少个不同的GameID（通过users集合关联）
    const usersCollection = db.collection('users');
    const todayNumbers = dateGroups[today] || [];
    const todayUserIds = [...new Set(todayNumbers.map(n => n.userId))];
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('今日参与用户详情:\n');
    
    for (const userId of todayUserIds) {
        // 尝试通过gameId或telegramId查找用户
        const user = await usersCollection.findOne({
            $or: [
                { id: userId },
                { telegramId: parseInt(userId.replace('u_', '')) || 0 }
            ]
        });
        
        const userNumbers = todayNumbers.filter(n => n.userId === userId);
        
        console.log(`👤 ${userId}:`);
        console.log(`   GameID: ${user?.gameId || 'unknown'}`);
        console.log(`   号码数: ${userNumbers.length}`);
        console.log(`   号码: ${userNumbers.map(n => n.number).join(', ')}`);
    }
    
    await mongoose.disconnect();
}

checkTodayNumbers().catch(console.error);
