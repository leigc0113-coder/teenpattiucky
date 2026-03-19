/**
 * ============================================================
 * 游戏推荐自动发帖脚本 v1.0 - 专用版
 * ============================================================
 * 
 * 功能：
 * - 只发送游戏推荐帖子
 * - 支持多游戏类型轮播
 * - 支持 AI 生成 + 模板降级
 * 
 * 目标：
 * 频道 @telltest222：游戏推荐（广告风格）
 * 群组 @tkgfg：游戏推荐（社群风格）
 */

const AIContentGenerator = require('./aiContentGenerator');
const ContentGeneratorDual = require('./contentGeneratorDual');
const CONFIG = require('./config');
const cron = require('node-cron');

class GameOnlyPoster {
    constructor(bot) {
        this.bot = bot;
        this.channelId = CONFIG.CHANNEL_ID;
        this.groupId = CONFIG.GROUP_ID;
        
        this.config = {
            BOT_NAME: CONFIG.BOT_NAME || 'TeenPatti Lucky Bot',
            APP_NAME: CONFIG.APP_NAME || 'TeenPatti Master',
            CHANNEL_ID: this.channelId,
            GROUP_ID: this.groupId,
            GAME_LINK: CONFIG.GAME_LINK || 'https://t.me/yourbot',
            KIMI_API_KEY: CONFIG.KIMI_API_KEY,
            KIMI_API_URL: CONFIG.KIMI_API_URL,
            KIMI_MODEL: CONFIG.KIMI_MODEL
        };
        
        // AI 内容生成器（优先使用）
        this.aiGenerator = new AIContentGenerator(this.config);
        // 备用模板生成器
        this.fallbackGenerator = new ContentGeneratorDual(this.config);
        
        this.postLog = new Map();
        
        // 游戏类型列表（可扩展）
        this.gameTypes = [
            'aviator',
            'dragon', 
            'slots',
            'chicken',
            'teenpatti',
            'roulette',
            'blackjack',
            'baccarat'
        ];
        
        // 当前游戏索引（用于轮播）
        this.currentGameIndex = 0;
        
        if (this.aiGenerator.isAvailable()) {
            console.log('[GAME_POSTER] 🤖 AI Game Content: ENABLED (Kimi API)');
        } else {
            console.log('[GAME_POSTER] ⚠️  AI Game Content: DISABLED - using templates');
        }
    }

    // 获取下一个游戏类型（轮播）
    getNextGameType() {
        const gameType = this.gameTypes[this.currentGameIndex];
        this.currentGameIndex = (this.currentGameIndex + 1) % this.gameTypes.length;
        return gameType;
    }

    // 智能生成内容（优先 AI，失败用模板）
    async generateContent(type, target, data = {}) {
        try {
            if (this.aiGenerator.isAvailable()) {
                console.log(`[GAME_POSTER] Generating AI content for ${type}/${target}...`);
                const content = await this.aiGenerator.generate(type, target, data);
                if (content) return content;
            }
        } catch (error) {
            console.error('[GAME_POSTER] AI generation failed:', error.message);
        }
        
        console.log(`[GAME_POSTER] Using template for ${type}/${target}`);
        return this.fallbackGenerator.generate(type, target, data);
    }

    async sendToChannel(content) {
        if (!this.channelId) {
            console.error('[GAME_POSTER] CHANNEL_ID not configured');
            return;
        }
        try {
            await this.bot.sendMessage(this.channelId, content, { parse_mode: 'Markdown' });
            console.log('[GAME_POSTER] Channel game post sent');
        } catch (error) {
            console.error('[GAME_POSTER] Channel send failed:', error.message);
        }
    }

    async sendToGroup(content) {
        if (!this.groupId) {
            console.error('[GAME_POSTER] GROUP_ID not configured');
            return;
        }
        try {
            await this.bot.sendMessage(this.groupId, content, { parse_mode: 'Markdown' });
            console.log('[GAME_POSTER] Group game post sent');
        } catch (error) {
            console.error('[GAME_POSTER] Group send failed:', error.message);
        }
    }

    hasPostedToday(type) {
        const key = `${new Date().toDateString()}_${type}`;
        return this.postLog.has(key);
    }

    markPosted(type) {
        const key = `${new Date().toDateString()}_${type}`;
        this.postLog.set(key, new Date());
    }

    // 频道游戏推荐
    async postChannelGame() {
        const gameType = this.getNextGameType();
        const type = `ch_game_${gameType}`;
        
        if (this.hasPostedToday(type)) {
            console.log(`[GAME_POSTER] Already posted ${gameType} to channel today, skipping`);
            return;
        }
        
        console.log(`[GAME_POSTER] Posting ${gameType} to channel...`);
        const content = await this.generateContent('game', 'channel', { gameType });
        await this.sendToChannel(content);
        this.markPosted(type);
    }

    // 群组游戏推荐
    async postGroupGame() {
        const gameType = this.getNextGameType();
        const type = `gr_game_${gameType}`;
        
        if (this.hasPostedToday(type)) {
            console.log(`[GAME_POSTER] Already posted ${gameType} to group today, skipping`);
            return;
        }
        
        console.log(`[GAME_POSTER] Posting ${gameType} to group...`);
        const content = await this.generateContent('game', 'group', { gameType });
        await this.sendToGroup(content);
        this.markPosted(type);
    }

    // ============ 定时任务 ============

    startScheduledPosts() {
        console.log('[GAME_POSTER] Starting game-only posting...');
        console.log('[GAME_POSTER] Channel:', this.channelId);
        console.log('[GAME_POSTER] Group:', this.groupId);
        console.log('[GAME_POSTER] Mode:', this.aiGenerator.isAvailable() ? 'AI + Template' : 'Template Only');
        console.log('[GAME_POSTER] Game types:', this.gameTypes.join(', '));

        // === 频道游戏推荐（每天 4 次）===
        
        // 09:00 - 游戏推荐
        cron.schedule('0 9 * * *', () => {
            this.postChannelGame();
        }, { timezone: 'Asia/Kolkata' });

        // 12:00 - 游戏推荐
        cron.schedule('0 12 * * *', () => {
            this.postChannelGame();
        }, { timezone: 'Asia/Kolkata' });

        // 15:00 - 游戏推荐
        cron.schedule('0 15 * * *', () => {
            this.postChannelGame();
        }, { timezone: 'Asia/Kolkata' });

        // 18:00 - 游戏推荐
        cron.schedule('0 18 * * *', () => {
            this.postChannelGame();
        }, { timezone: 'Asia/Kolkata' });

        // === 群组游戏推荐（每天 4 次，错开时间）===

        // 09:30 - 游戏推荐
        cron.schedule('30 9 * * *', () => {
            this.postGroupGame();
        }, { timezone: 'Asia/Kolkata' });

        // 12:30 - 游戏推荐
        cron.schedule('30 12 * * *', () => {
            this.postGroupGame();
        }, { timezone: 'Asia/Kolkata' });

        // 15:30 - 游戏推荐
        cron.schedule('30 15 * * *', () => {
            this.postGroupGame();
        }, { timezone: 'Asia/Kolkata' });

        // 18:30 - 游戏推荐
        cron.schedule('30 18 * * *', () => {
            this.postGroupGame();
        }, { timezone: 'Asia/Kolkata' });

        console.log('[GAME_POSTER] All schedules started!');
        console.log('[GAME_POSTER] Channel game posts: 4 per day');
        console.log('[GAME_POSTER] Group game posts: 4 per day');
        console.log('[GAME_POSTER] Total game types:', this.gameTypes.length);
    }

    // ============ 手动测试 ============

    async testPost(target, gameType = null) {
        const type = gameType || this.getNextGameType();
        console.log(`[TEST] Sending ${type} game to ${target}...`);
        
        const content = await this.generateContent('game', target, { gameType: type });
        
        if (target === 'channel') {
            await this.sendToChannel(content);
        } else {
            await this.sendToGroup(content);
        }
        
        console.log(`[TEST] ${type} sent to ${target}`);
    }
    
    // 获取当前生成模式
    getGenerationMode() {
        return this.aiGenerator.isAvailable() ? 'AI (Kimi API)' : 'Template Fallback';
    }
    
    // 获取游戏列表
    getGameTypes() {
        return this.gameTypes;
    }
}

module.exports = GameOnlyPoster;
