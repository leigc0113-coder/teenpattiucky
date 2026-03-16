/**
 * 调试频道和群组连接
 * 运行: node debug_channel.js
 */

const CONFIG = require('./config');

async function debugConnection() {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(CONFIG.BOT_TOKEN, { polling: false });
    
    console.log('=== Telegram Connection Debug ===\n');
    console.log('Bot Token:', CONFIG.BOT_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('Channel ID:', CONFIG.CHANNEL_ID);
    console.log('Group ID:', CONFIG.GROUP_ID);
    console.log('');
    
    // 测试1: 获取机器人信息
    try {
        const me = await bot.getMe();
        console.log('✅ Bot Info:');
        console.log('  Username:', me.username);
        console.log('  ID:', me.id);
        console.log('');
    } catch (error) {
        console.log('❌ Bot Token Invalid:', error.message);
        return;
    }
    
    // 测试2: 检查频道
    console.log('=== Testing Channel ===');
    try {
        const chat = await bot.getChat(CONFIG.CHANNEL_ID);
        console.log('✅ Channel Found:');
        console.log('  Title:', chat.title);
        console.log('  Type:', chat.type);
        console.log('  Username:', chat.username);
        console.log('  ID:', chat.id);
        
        // 尝试获取管理员列表
        try {
            const admins = await bot.getChatAdministrators(CONFIG.CHANNEL_ID);
            console.log('✅ Admins:', admins.length);
            const botAdmin = admins.find(a => a.user.username === me.username);
            console.log(botAdmin ? '✅ Bot is Admin' : '❌ Bot is NOT Admin');
        } catch (e) {
            console.log('❌ Cannot get admins:', e.message);
        }
        
        // 测试发送消息
        try {
            const testMsg = await bot.sendMessage(CONFIG.CHANNEL_ID, 
                '🔧 Debug: Channel connection test successful!');
            console.log('✅ Can post messages');
            // 删除测试消息
            await bot.deleteMessage(CONFIG.CHANNEL_ID, testMsg.message_id);
        } catch (e) {
            console.log('❌ Cannot post:', e.message);
        }
        
    } catch (error) {
        console.log('❌ Channel Error:', error.message);
        console.log('   Make sure:');
        console.log('   1. Channel exists');
        console.log('   2. Bot is added as admin');
        console.log('   3. Channel is public');
    }
    
    console.log('\n=== Testing Group ===');
    try {
        const chat = await bot.getChat(CONFIG.GROUP_ID);
        console.log('✅ Group Found:');
        console.log('  Title:', chat.title);
        console.log('  Type:', chat.type);
        console.log('  Username:', chat.username);
        console.log('  ID:', chat.id);
        
        // 获取管理员
        try {
            const admins = await bot.getChatAdministrators(CONFIG.GROUP_ID);
            console.log('✅ Admins:', admins.length);
        } catch (e) {
            console.log('❌ Cannot get admins:', e.message);
        }
        
    } catch (error) {
        console.log('❌ Group Error:', error.message);
    }
    
    console.log('\n=== Recommendations ===');
    console.log('If channel checks fail in production, use numeric ID:');
    console.log('1. Forward any message from channel to @userinfobot');
    console.log('2. It will show: "Forwarded from chat (ID: -100xxxxxxxxxx)"');
    console.log('3. Use -100xxxxxxxxxx as CHANNEL_ID');
}

debugConnection().catch(console.error);
