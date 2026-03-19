/**
 * ============================================================
 * 自动发帖脚本 v4.0 - AI 驱动版 (Kimi API 集成)
 * ============================================================
 * 
 * 频道 @telltest222：AI 生成广告风格（专业、直接推销）
 * 群组 @tkgfg：AI 生成社群风格（自然、朋友式）
 * 
 * 功能：
 * - 接入 Kimi API 智能生成内容
 * - 双风格输出（频道/群组）
 * - 实时数据融合（奖池、参与人数）
 * - 备用模板机制（API 失败时自动降级）
 */

const AIContentGenerator = require('./aiContentGenerator');
const ContentGeneratorDual = require('./contentGeneratorDual');
const PoolService = require('./poolService');
const Database = require('./database');
const CONFIG = require('./config');
const cron = require('node-cron');

class AutoPoster {
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
        
        Database.init().catch(err => {
            console.error('[AUTO_POST] Database init error:', err);
        });
        
        // 显示 AI 状态
        if (this.aiGenerator.isAvailable()) {
            console.log('[AUTO_POST] 🤖 AI Content Generation: ENABLED (Kimi API)');
        } else {
            console.log('[AUTO_POST] ⚠️  AI Content Generation: DISABLED - using fallback templates');
            console.log('[AUTO_POST]     Tip: Set KIMI_API_KEY in .env to enable AI generation');
        }
    }

    // 智能生成内容（优先 AI，失败用模板）
    async generateContent(type, target, data = {}) {
        try {
            // 尝试使用 AI 生成
            if (this.aiGenerator.isAvailable()) {
                console.log(`[AUTO_POST] Generating AI content for ${type}/${target}...`);
                const content = await this.aiGenerator.generate(type, target, data);
                if (content) return content;
            }
        } catch (error) {
            console.error('[AUTO_POST] AI generation failed:', error.message);
        }
        
        // 降级到模板生成
        console.log(`[AUTO_POST] Using fallback template for ${type}/${target}`);
        return this.fallbackGenerator.generate(type, target, data);
    }

    async getPoolData() {
        try {
            console.log('[AUTO_POST] Getting pool data...');
            let pool = await PoolService.getTodayPool();
            
            // 如果今日无数据，尝试获取昨日数据
            if (!pool) {
                console.log('[AUTO_POST] No pool data for today, trying yesterday...');
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                pool = await PoolService.findOne('pools', { date: yesterdayStr });
            }
            
            console.log('[AUTO_POST] Raw pool data:', JSON.stringify(pool));
            
            const amount = pool?.finalAmount || pool?.amount || pool?.totalAmount || 0;
            const participants = pool?.participantCount || pool?.participants || 0;
            
            console.log(`[AUTO_POST] Parsed data: amount=${amount}, participants=${participants}`);
            
            // 确保最小值，避免显示过低数据
            return { 
                amount: Math.max(amount, 3000),           // 最低 ₹3000
                participants: Math.max(participants, 5)   // 最低 5人
            };
        } catch (error) {
            console.error('[AUTO_POST] getPoolData error:', error);
            // 返回默认高值，保持吸引力
            return { 
                amount: 3500,      // 默认 ₹3500
                participants: 8    // 默认 8人
            };
        }
    }

    async sendToChannel(content) {
        if (!this.channelId) {
            console.error('[AUTO_POST] CHANNEL_ID not configured');
            return;
        }
        try {
            await this.bot.sendMessage(this.channelId, content, { parse_mode: 'Markdown' });
            console.log('[AUTO_POST] Channel post sent');
        } catch (error) {
            console.error('[AUTO_POST] Channel send failed:', error.message);
        }
    }

    async sendToGroup(content) {
        if (!this.groupId) {
            console.error('[AUTO_POST] GROUP_ID not configured');
            return;
        }
        try {
            await this.bot.sendMessage(this.groupId, content, { parse_mode: 'Markdown' });
            console.log('[AUTO_POST] Group post sent');
        } catch (error) {
            console.error('[AUTO_POST] Group send failed:', error.message);
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

    // ============ 频道帖子（AI 广告风格）============
    
    async postChannelMorning() {
        if (this.hasPostedToday('ch_morning')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('morning', 'channel', { poolData });
        await this.sendToChannel(content);
        this.markPosted('ch_morning');
    }

    async postChannelGame(gameType) {
        const type = `ch_game_${gameType}`;
        if (this.hasPostedToday(type)) return;
        const content = await this.generateContent('game', 'channel', { gameType });
        await this.sendToChannel(content);
        this.markPosted(type);
    }

    async postChannelTips() {
        if (this.hasPostedToday('ch_tips')) return;
        const content = await this.generateContent('tips', 'channel');
        await this.sendToChannel(content);
        this.markPosted('ch_tips');
    }

    async postChannelPool() {
        if (this.hasPostedToday('ch_pool')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('pool', 'channel', { poolData });
        await this.sendToChannel(content);
        this.markPosted('ch_pool');
    }

    async postChannelCountdown(minutes) {
        const type = `ch_cd_${minutes}`;
        if (this.hasPostedToday(type)) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('countdown', 'channel', { minutes, poolData });
        await this.sendToChannel(content);
        this.markPosted(type);
    }

    async postChannelWinners() {
        if (this.hasPostedToday('ch_winners')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('winners', 'channel', { poolData });
        await this.sendToChannel(content);
        this.markPosted('ch_winners');
    }

    async postChannelNight() {
        if (this.hasPostedToday('ch_night')) return;
        const content = await this.generateContent('night', 'channel');
        await this.sendToChannel(content);
        this.markPosted('ch_night');
    }

    // ============ 群组帖子（AI 社群风格）============

    async postGroupMorning() {
        if (this.hasPostedToday('gr_morning')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('morning', 'group', { poolData });
        await this.sendToGroup(content);
        this.markPosted('gr_morning');
    }

    async postGroupGame(gameType) {
        const type = `gr_game_${gameType}`;
        if (this.hasPostedToday(type)) return;
        const content = await this.generateContent('game', 'group', { gameType });
        await this.sendToGroup(content);
        this.markPosted(type);
    }

    async postGroupTips() {
        if (this.hasPostedToday('gr_tips')) return;
        const content = await this.generateContent('tips', 'group');
        await this.sendToGroup(content);
        this.markPosted('gr_tips');
    }

    async postGroupPool() {
        if (this.hasPostedToday('gr_pool')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('pool', 'group', { poolData });
        await this.sendToGroup(content);
        this.markPosted('gr_pool');
    }

    async postGroupCountdown(minutes) {
        const type = `gr_cd_${minutes}`;
        if (this.hasPostedToday(type)) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('countdown', 'group', { minutes, poolData });
        await this.sendToGroup(content);
        this.markPosted(type);
    }

    async postGroupWinners() {
        if (this.hasPostedToday('gr_winners')) return;
        const poolData = await this.getPoolData();
        const content = await this.generateContent('winners', 'group', { poolData });
        await this.sendToGroup(content);
        this.markPosted('gr_winners');
    }

    async postGroupNight() {
        if (this.hasPostedToday('gr_night')) return;
        const content = await this.generateContent('night', 'group');
        await this.sendToGroup(content);
        this.markPosted('gr_night');
    }

    // ============ 定时任务 ============

    startScheduledPosts() {
        console.log('[AUTO_POST] Starting AI-powered dual-style posts...');
        console.log('[AUTO_POST] Channel:', this.channelId);
        console.log('[AUTO_POST] Group:', this.groupId);
        console.log('[AUTO_POST] AI Mode:', this.aiGenerator.isAvailable() ? 'Kimi API' : 'Template Fallback');

        // === 频道帖子（广告风格）===
        
        // 09:00 - 频道早安
        cron.schedule('0 9 * * *', () => {
            this.postChannelMorning();
        }, { timezone: 'Asia/Kolkata' });

        // 11:00 - 频道游戏1
        cron.schedule('0 11 * * *', () => {
            this.postChannelGame('aviator');
        }, { timezone: 'Asia/Kolkata' });

        // 13:00 - 频道技巧
        cron.schedule('0 13 * * *', () => {
            this.postChannelTips();
        }, { timezone: 'Asia/Kolkata' });

        // 15:00 - 频道奖池
        cron.schedule('0 15 * * *', () => {
            this.postChannelPool();
        }, { timezone: 'Asia/Kolkata' });

        // 17:00 - 频道游戏2
        cron.schedule('0 17 * * *', () => {
            this.postChannelGame('slots');
        }, { timezone: 'Asia/Kolkata' });

        // 18:00 - 频道奖池
        cron.schedule('0 18 * * *', () => {
            this.postChannelPool();
        }, { timezone: 'Asia/Kolkata' });

        // 19:00 - 频道倒计时3h
        cron.schedule('0 19 * * *', () => {
            this.postChannelCountdown(180);
        }, { timezone: 'Asia/Kolkata' });

        // 20:00 - 频道倒计时1h
        cron.schedule('0 20 * * *', () => {
            this.postChannelCountdown(60);
        }, { timezone: 'Asia/Kolkata' });

        // 20:30 - 频道倒计时30m
        cron.schedule('30 20 * * *', () => {
            this.postChannelCountdown(30);
        }, { timezone: 'Asia/Kolkata' });

        // 21:05 - 频道开奖结果
        cron.schedule('5 21 * * *', () => {
            this.postChannelWinners();
        }, { timezone: 'Asia/Kolkata' });

        // 23:00 - 频道睡前
        cron.schedule('0 23 * * *', () => {
            this.postChannelNight();
        }, { timezone: 'Asia/Kolkata' });

        // === 群组帖子（社群风格）===

        // 09:05 - 群组早安（稍晚于频道）
        cron.schedule('5 9 * * *', () => {
            this.postGroupMorning();
        }, { timezone: 'Asia/Kolkata' });

        // 11:05 - 群组游戏1
        cron.schedule('5 11 * * *', () => {
            this.postGroupGame('aviator');
        }, { timezone: 'Asia/Kolkata' });

        // 13:05 - 群组技巧
        cron.schedule('5 13 * * *', () => {
            this.postGroupTips();
        }, { timezone: 'Asia/Kolkata' });

        // 15:05 - 群组奖池
        cron.schedule('5 15 * * *', () => {
            this.postGroupPool();
        }, { timezone: 'Asia/Kolkata' });

        // 17:05 - 群组游戏2
        cron.schedule('5 17 * * *', () => {
            this.postGroupGame('slots');
        }, { timezone: 'Asia/Kolkata' });

        // 18:05 - 群组奖池
        cron.schedule('5 18 * * *', () => {
            this.postGroupPool();
        }, { timezone: 'Asia/Kolkata' });

        // 19:05 - 群组倒计时
        cron.schedule('5 19 * * *', () => {
            this.postGroupCountdown(180);
        }, { timezone: 'Asia/Kolkata' });

        // 20:05 - 群组倒计时
        cron.schedule('5 20 * * *', () => {
            this.postGroupCountdown(60);
        }, { timezone: 'Asia/Kolkata' });

        // 20:35 - 群组倒计时
        cron.schedule('35 20 * * *', () => {
            this.postGroupCountdown(30);
        }, { timezone: 'Asia/Kolkata' });

        // 21:10 - 群组开奖结果
        cron.schedule('10 21 * * *', () => {
            this.postGroupWinners();
        }, { timezone: 'Asia/Kolkata' });

        // 23:05 - 群组睡前
        cron.schedule('5 23 * * *', () => {
            this.postGroupNight();
        }, { timezone: 'Asia/Kolkata' });

        console.log('[AUTO_POST] All schedules started!');
        console.log(`[AUTO_POST] Channel posts: 11 (${this.aiGenerator.isAvailable() ? 'AI' : 'Template'} ad style)`);
        console.log(`[AUTO_POST] Group posts: 11 (${this.aiGenerator.isAvailable() ? 'AI' : 'Template'} community style)`);
    }

    // ============ 手动测试 ============

    async testPost(target, type, data = {}) {
        console.log(`[TEST] Generating ${type} for ${target} using ${this.aiGenerator.isAvailable() ? 'AI' : 'Template'}...`);
        
        const content = await this.generateContent(type, target, data);
        
        if (target === 'channel') {
            await this.sendToChannel(content);
        } else {
            await this.sendToGroup(content);
        }
        
        console.log(`[TEST] ${type} sent to ${target}`);
        console.log('[TEST] Content preview:', content.substring(0, 100) + '...');
    }
    
    // 获取当前生成模式
    getGenerationMode() {
        return this.aiGenerator.isAvailable() ? 'AI (Kimi API)' : 'Template Fallback';
    }
}

module.exports = AutoPoster;

// 如果直接运行
if (require.main === module) {
    console.log('Usage: This module should be imported from bot.js');
    console.log('Or use /testpost command in Telegram');
}
