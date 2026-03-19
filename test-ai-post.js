/**
 * ============================================================
 * AI 发帖测试 - 5分钟后执行
 * ============================================================
 * 
 * 用途：测试 Moonshot AI 是否正常工作
 * 执行后会自动删除此文件
 */

const AIContentGenerator = require('./aiContentGenerator');
const CONFIG = require('./config');
const TelegramBot = require('node-telegram-bot-api');

async function testAIPost() {
    console.log('[TEST] Starting AI post test...');
    console.log('[TEST] Current time:', new Date().toISOString());
    
    // 检查 AI 是否可用
    const aiGenerator = new AIContentGenerator({
        BOT_NAME: CONFIG.BOT_NAME || 'TeenPatti Lucky Bot',
        APP_NAME: CONFIG.APP_NAME || 'TeenPatti Master',
        GAME_LINK: CONFIG.GAME_LINK || 'https://t.me/yourbot',
        KIMI_API_KEY: process.env.KIMI_API_KEY,
        KIMI_API_URL: process.env.KIMI_API_URL,
        KIMI_MODEL: process.env.KIMI_MODEL || 'moonshot-v1-8k'
    });
    
    console.log('[TEST] AI Available:', aiGenerator.isAvailable());
    
    if (!aiGenerator.isAvailable()) {
        console.error('[TEST] ❌ AI not available! Check KIMI_API_KEY');
        process.exit(1);
    }
    
    // 生成测试内容
    console.log('[TEST] Generating AI content...');
    try {
        const content = await aiGenerator.generate('morning', 'channel', {
            poolData: { amount: 5000, participants: 25 },
            gameType: 'aviator'
        });
        
        console.log('[TEST] ✅ AI Content generated successfully!');
        console.log('[TEST] Content preview:');
        console.log('---');
        console.log(content.substring(0, 200) + '...');
        console.log('---');
        
        // 发送到频道
        if (CONFIG.CHANNEL_ID) {
            const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
            await bot.sendMessage(CONFIG.CHANNEL_ID, content, { parse_mode: 'Markdown' });
            console.log('[TEST] ✅ Test post sent to channel!');
        } else {
            console.log('[TEST] ⚠️ CHANNEL_ID not set, skipping send');
        }
        
        console.log('[TEST] ✅ Test completed successfully!');
        console.log('[TEST] Moonshot AI is working correctly!');
        
    } catch (error) {
        console.error('[TEST] ❌ AI generation failed:', error.message);
        process.exit(1);
    }
    
    process.exit(0);
}

// 立即执行测试
console.log('[TEST] AI Post Test - 5 minute delay executed');
testAIPost();
