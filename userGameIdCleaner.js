/**
 * ============================================================
 * 用户 GameId 检查和清理工具
 * ============================================================
 * 
 * 功能：
 * - 检查指定用户的 gameId 数量
 * - 查找重复的 gameId
 * - 删除多余的用户记录（保留最新或指定的）
 */

const Database = require('./database');

class UserGameIdCleaner {
    
    async init() {
        await Database.init();
        console.log('[CLEANER] Database initialized');
    }

    /**
     * 检查指定 Telegram ID 的用户有多少个 gameId
     */
    async checkUserGameIds(telegramId) {
        console.log(`\n=== Checking user ${telegramId} ===`);
        
        // 查找用户
        const users = await Database.findAll('users', { telegramId });
        console.log(`Found ${users.length} user record(s):`);
        
        users.forEach((user, index) => {
            console.log(`  [${index + 1}] ID: ${user.id}`);
            console.log(`       GameID: ${user.gameId}`);
            console.log(`       Created: ${user.createdAt}`);
            console.log(`       Last Active: ${user.lastActive || 'N/A'}`);
        });

        // 检查充值记录中的 gameId
        const userIdPattern = `u_${telegramId}`;
        const allRecharges = await Database.getAll('recharges');
        const userRecharges = allRecharges.filter(r => 
            r.userId === userIdPattern || 
            r.userId === telegramId.toString() ||
            String(r.userId).includes(telegramId.toString())
        );

        const uniqueGameIds = new Set(userRecharges.map(r => r.gameId).filter(Boolean));
        console.log(`\nGameIds in recharge records: ${uniqueGameIds.size}`);
        uniqueGameIds.forEach(gid => console.log(`  - ${gid}`));

        return {
            userCount: users.length,
            users: users,
            rechargeGameIds: Array.from(uniqueGameIds)
        };
    }

    /**
     * 删除指定用户（保留一个）
     */
    async cleanupDuplicateUsers(telegramId, keepGameId = null) {
        console.log(`\n=== Cleaning up user ${telegramId} ===`);
        
        const users = await Database.findAll('users', { telegramId });
        
        if (users.length <= 1) {
            console.log('Only 1 user record found, no cleanup needed.');
            return;
        }

        console.log(`Found ${users.length} user records, keeping gameId: ${keepGameId || 'latest'}`);

        // 决定要保留的记录
        let keepUser;
        if (keepGameId) {
            keepUser = users.find(u => u.gameId === keepGameId);
        }
        if (!keepUser) {
            // 默认保留最新创建的
            keepUser = users.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
        }

        console.log(`Keeping: ${keepUser.id} (GameID: ${keepUser.gameId})`);

        // 删除其他记录
        for (const user of users) {
            if (user.id !== keepUser.id) {
                console.log(`Deleting: ${user.id} (GameID: ${user.gameId})`);
                await Database.deleteOne('users', { id: user.id });
            }
        }

        console.log('Cleanup completed!');
    }

    /**
     * 查找所有有多个 gameId 的用户
     */
    async findUsersWithMultipleGameIds() {
        console.log('\n=== Scanning all users ===');
        
        const allUsers = await Database.getAll('users');
        const telegramIdMap = new Map();

        // 按 telegramId 分组
        for (const user of allUsers) {
            const tid = user.telegramId;
            if (!telegramIdMap.has(tid)) {
                telegramIdMap.set(tid, []);
            }
            telegramIdMap.get(tid).push(user);
        }

        // 找出有多个记录的用户
        const duplicates = [];
        for (const [tid, users] of telegramIdMap) {
            if (users.length > 1) {
                duplicates.push({ telegramId: tid, users });
            }
        }

        console.log(`Found ${duplicates.length} user(s) with multiple records:`);
        duplicates.forEach(d => {
            console.log(`\nTelegram ID: ${d.telegramId}`);
            d.users.forEach((u, i) => {
                console.log(`  [${i + 1}] ${u.id} => GameID: ${u.gameId}`);
            });
        });

        return duplicates;
    }
}

// 如果直接运行
async function main() {
    const cleaner = new UserGameIdCleaner();
    await cleaner.init();

    // 检查指定用户
    console.log('🔍 Checking users...\n');
    
    await cleaner.checkUserGameIds(7054117110);
    await cleaner.checkUserGameIds(5234313912);
    
    // 查找所有重复用户
    await cleaner.findUsersWithMultipleGameIds();

    console.log('\n✅ Check completed!');
    process.exit(0);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = UserGameIdCleaner;
