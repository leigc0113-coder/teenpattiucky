/**
 * ============================================================
 * 简单 AI 测试 - 立即执行
 * ============================================================
 * 
 * 使用方法：
 * 1. 在 Railway 执行: node test-ai-simple.js
 * 2. 观察日志输出
 * 3. 检查频道是否收到测试帖子
 */

const AIContentGenerator = require('./aiContentGenerator');
const CONFIG = require('./config');

async function testAI() {
    console.log('🧪 Testing Moonshot AI...\n');
    
    const generator = new AIContentGenerator({
        KIMI_API_KEY: process.env.KIMI_API_KEY,
        KIMI_API_URL: process.env.KIMI_API_URL,
        KIMI_MODEL: process.env.KIMI_MODEL || 'moonshot-v1-8k',
        GAME_LINK: CONFIG.GAME_LINK
    });
    
    console.log('AI Configured:', generator.isAvailable());
    console.log('Model:', process.env.KIMI_MODEL);
    console.log('');
    
    if (!generator.isAvailable()) {
        console.log('❌ AI not available! Check KIMI_API_KEY');
        process.exit(1);
    }
    
    try {
        console.log('⏳ Generating content...');
        const content = await generator.generate('morning', 'channel', {
            poolData: { amount: 5000, participants: 10 }
        });
        
        console.log('\n✅ SUCCESS! AI generated content:');
        console.log('─'.repeat(50));
        console.log(content);
        console.log('─'.repeat(50));
        
    } catch (err) {
        console.log('\n❌ FAILED:', err.message);
    }
}

testAI();
