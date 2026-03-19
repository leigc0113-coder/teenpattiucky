const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://leigc0113_db_user:WaVep5zm9XeJFGzc@cluster0.imfyovl.mongodb.net/teenpatti?retryWrites=true&w=majority&appName=Cluster0';

async function deleteDuplicateUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = mongoose.model('User', new mongoose.Schema({
            id: String,
            telegramId: Number,
            gameId: String,
            createdAt: String
        }, { collection: 'users' }));

        const TierIdentity = mongoose.model('TierIdentity', new mongoose.Schema({
            userId: mongoose.Schema.Types.Mixed,
            tierId: String
        }, { collection: 'tierIdentities' }));

        // 处理用户 7054117110
        console.log('========== 处理用户 7054117110 ==========');
        const users1 = await User.find({ telegramId: 7054117110 });
        console.log(`找到 ${users1.length} 个用户记录:`);
        users1.forEach((u, i) => {
            console.log(`  [${i + 1}] ID: ${u.id}, GameID: ${u.gameId}, Created: ${u.createdAt}`);
        });

        if (users1.length > 1) {
            const keepUser = users1.find(u => u.gameId === '2245425') || users1[0];
            console.log(`\n✅ 将保留: ${keepUser.id} (GameID: ${keepUser.gameId})`);

            for (const user of users1) {
                if (user.id !== keepUser.id) {
                    console.log(`  ❌ 删除: ${user.id} (GameID: ${user.gameId})`);
                    
                    // 删除等级身份
                    const tierResult = await TierIdentity.deleteMany({ userId: user.id });
                    console.log(`     - 删除等级身份: ${tierResult.deletedCount} 条`);
                    
                    // 删除用户
                    await User.deleteOne({ id: user.id });
                    console.log(`     ✅ 已删除用户`);
                }
            }
        } else {
            console.log('✅ 该用户只有一个账号，无需清理');
        }

        // 处理用户 5234313912
        console.log('\n========== 处理用户 5234313912 ==========');
        const users2 = await User.find({ telegramId: 5234313912 });
        console.log(`找到 ${users2.length} 个用户记录:`);
        users2.forEach((u, i) => {
            console.log(`  [${i + 1}] ID: ${u.id}, GameID: ${u.gameId}, Created: ${u.createdAt}`);
        });

        if (users2.length > 1) {
            // 保留最新创建的
            const keepUser = users2.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            console.log(`\n✅ 将保留: ${keepUser.id} (GameID: ${keepUser.gameId})`);

            for (const user of users2) {
                if (user.id !== keepUser.id) {
                    console.log(`  ❌ 删除: ${user.id} (GameID: ${user.gameId})`);
                    
                    // 删除等级身份
                    const tierResult = await TierIdentity.deleteMany({ userId: user.id });
                    console.log(`     - 删除等级身份: ${tierResult.deletedCount} 条`);
                    
                    // 删除用户
                    await User.deleteOne({ id: user.id });
                    console.log(`     ✅ 已删除用户`);
                }
            }
        } else {
            console.log('✅ 该用户只有一个账号，无需清理');
        }

        console.log('\n========== 清理完成 ==========');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteDuplicateUsers();
