/**
 * ============================================================
 * 删除用户重复游戏账号工具
 * ============================================================
 * 
 * 使用方式：
 * node deleteDuplicateUsers.js [telegramId] [keepGameId]
 * 
 * 示例：
 * node deleteDuplicateUsers.js 7054117110 2245425
 * node deleteDuplicateUsers.js 5234313912
 */

const Database = require('./database');

async function deleteDuplicateUsers(telegramId, keepGameId = null) {
    console.log(`\n========== 处理用户 ${telegramId} ==========`);
    
    await Database.init();
    
    // 查找所有该 Telegram ID 的用户记录
    const users = await Database.findAll('users', { telegramId: parseInt(telegramId) });
    
    console.log(`找到 ${users.length} 个用户记录:`);
    users.forEach((u, i) => {
        console.log(`  [${i + 1}] ID: ${u.id}, GameID: ${u.gameId}, Created: ${u.createdAt}`);
    });
    
    if (users.length <= 1) {
        console.log('✅ 该用户只有一个账号，无需清理');
        await Database.disconnect?.();
        return;
    }
    
    // 决定要保留的记录
    let keepUser;
    if (keepGameId) {
        keepUser = users.find(u => u.gameId === keepGameId);
        if (!keepUser) {
            console.log(`⚠️ 未找到 gameId=${keepGameId} 的记录，将保留最新创建的账号`);
        }
    }
    
    if (!keepUser) {
        // 默认保留最新创建的（或者充值金额最多的）
        keepUser = users.sort((a, b) => {
            // 优先保留有充值记录的
            return new Date(b.createdAt) - new Date(a.createdAt);
        })[0];
    }
    
    console.log(`\n✅ 将保留: ${keepUser.id} (GameID: ${keepUser.gameId})`);
    console.log('以下账号将被删除:\n');
    
    // 删除其他记录
    for (const user of users) {
        if (user.id !== keepUser.id) {
            console.log(`  ❌ 删除: ${user.id} (GameID: ${user.gameId})`);
            
            try {
                // 删除用户记录
                await Database.deleteOne('users', { id: user.id });
                
                // 删除相关的等级身份
                await Database.deleteOne('tierIdentities', { userId: user.id });
                
                // 删除相关的充值记录（可选，保留历史记录）
                // await Database.deleteMany('recharges', { userId: user.id });
                
                console.log(`     ✅ 已删除`);
            } catch (error) {
                console.error(`     ❌ 删除失败: ${error.message}`);
            }
        }
    }
    
    console.log('\n========== 清理完成 ==========');
    console.log(`用户 ${telegramId} 现在只有一个账号: ${keepUser.gameId}`);
    
    await Database.disconnect?.();
}

// 如果直接运行
async function main() {
    const telegramId = process.argv[2];
    const keepGameId = process.argv[3];
    
    if (!telegramId) {
        console.log('使用方法:');
        console.log('  node deleteDuplicateUsers.js [telegramId] [keepGameId]');
        console.log('');
        console.log('示例:');
        console.log('  node deleteDuplicateUsers.js 7054117110');
        console.log('  node deleteDuplicateUsers.js 7054117110 2245425');
        console.log('  node deleteDuplicateUsers.js 5234313912');
        process.exit(1);
    }
    
    await deleteDuplicateUsers(telegramId, keepGameId);
    process.exit(0);
}

if (require.main === module) {
    main().catch(err => {
        console.error('错误:', err);
        process.exit(1);
    });
}

module.exports = { deleteDuplicateUsers };
