/**
 * ============================================================
 * 5分钟后 AI 发帖测试
 * ============================================================
 * 
 * 使用方法：
 * node test-ai-delayed.js
 * 
 * 5分钟后自动发送测试帖子到频道
 */

const cron = require('node-cron');
const AIContentGenerator = require('./aiContentGenerator');
const ContentGeneratorDual = require('./contentGeneratorDual');
const CONFIG = require('./config');

// 延迟 5 分钟（300 秒）
const DELAY_SECONDS = 300;

console.log(`[TEST] AI Post Test scheduled in ${DELAY_SECONDS} seconds...`);
console.log(`[TEST] Current time: ${new Date().toLocaleString()}`);
console.log(`[TEST] Will execute at: ${new Date(Date.now() + DELAY_SECONDS * 1000).toLocaleString()}`);

setTimeout(async () => {
    console.log('[TEST] ⏰ Executing delayed test...');
    
    const bot = require('./bot'); // 复用现有的 bot 实例
    
    // 初始化 AI 生成器
    const aiGenerator = new AIContentGenerator({
        BOT_NAME: CONFIG.BOT_NAME,
        APP_NAME: CONFIG.APP_NAME,
        GAME_LINK: CONFIG.GAME_LINK,
        KIMI_API_KEY: process.env.KIMI_API_KEY,
        KIMI_API_URL: process.env.KIMI_API_URL,
        KIMI_MODEL: process.env.KIMI_MODEL
    });
    
    console.log('[TEST] AI Available:', aiGenerator.isAvailable());
    
    try {
        // 生成测试内容
        console.log('[TEST] Generating AI content...');
        const content = await aiGenerator.generate('game', 'channel', {
            poolData: { amount: 3500, participants: 8 },
            gameType: 'aviator'
        });
        
        console.log('[TEST] ✅ Content generated!');
        console.log('[TEST] Content preview:', content.substring(0, 100) + '...');
        
        // 发送到频道
        if (CONFIG.CHANNEL_ID) {
            await bot.sendMessage(CONFIG.CHANNEL_ID, 
                `🧪 *AI Test Post*\n\n${content}\n\n✅ Moonshot AI is working!`,
                { parse_mode: 'Markdown' }
            );
            console.log('[TEST] ✅ Test post sent to channel!');
            console.log('[TEST] 🎉 Moonshot AI test PASSED!');
        } else {
            console.log('[TEST] CHANNEL_ID not configured');
        }
        
    } catch (error) {
        console.error('[TEST] ❌ Test failed:', error.message);
        
        // 降级到模板
        console.log('[TEST] Falling back to template...');
        const fallback = new ContentGeneratorDual(CONFIG);
        const content = fallback.generate('game', 'channel', { gameType: 'aviator' });
        
        if (CONFIG.CHANNEL_ID) {
            await bot.sendMessage(CONFIG.CHANNEL_ID,
                `🧪 *AI Test Failed - Template Fallback*\n\n${content}`,
                { parse_mode: 'Markdown' }
            );
        }
    }
    
    console.log('[TEST] Test completed. You can now delete this file.');
    process.exit(0);
    
}, DELAY_SECONDS * 1000);

console.log('[TEST] Timer started. Waiting...');
