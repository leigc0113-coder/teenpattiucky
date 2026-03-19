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
const TimeUtil = require('./timeUtil');

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
            BOT_USERNAME: CONFIG.CHANNEL_USERNAME?.replace('@', '') || 'TeenPattiLuckyBot',
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
                const yesterdayStr = TimeUtil.toISTDateString(yesterday);
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
        const key = `${TimeUtil.getTodayIST()}_${type}`;
        return this.postLog.has(key);
    }

    markPosted(type) {
        const key = `${TimeUtil.getTodayIST()}_${type}`;
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

        // === 频道帖子（游戏推广为主）===
        
        // 09:00 - 频道早安 + 游戏介绍
        cron.schedule('0 9 * * *', () => {
            this.postChannelContent('intro', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 10:00 - 频道游戏推广（新增）
        cron.schedule('0 10 * * *', () => {
            this.postChannelContent('game_aviator', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 11:00 - 频道游戏推荐1
        cron.schedule('0 11 * * *', () => {
            this.postChannelContent('game_aviator', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 12:00 - 频道技巧分享（新增）
        cron.schedule('0 12 * * *', () => {
            this.postChannelContent('tips', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 13:00 - 频道游戏技巧
        cron.schedule('0 13 * * *', () => {
            this.postChannelContent('tips', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 15:00 - 频道游戏推荐2
        cron.schedule('0 15 * * *', () => {
            this.postChannelContent('game_slots', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 17:00 - 频道奖池更新
        cron.schedule('0 17 * * *', () => {
            this.postChannelPool();
        }, { timezone: 'Asia/Kolkata' });

        // 20:00 - 频道倒计时1h（提醒关注机器人）
        cron.schedule('0 20 * * *', () => {
            this.postChannelCountdownWithBot(60);
        }, { timezone: 'Asia/Kolkata' });

        // 20:30 - 频道倒计时30m（提醒关注机器人）
        cron.schedule('30 20 * * *', () => {
            this.postChannelCountdownWithBot(30);
        }, { timezone: 'Asia/Kolkata' });

        // 21:00 - 频道开奖直播（新增）
        cron.schedule('0 21 * * *', () => {
            this.postChannelContent('live_draw', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // 21:05 - 频道开奖结果
        cron.schedule('5 21 * * *', () => {
            this.postChannelWinners();
        }, { timezone: 'Asia/Kolkata' });

        // 23:00 - 频道晚安 + 明日预告
        cron.schedule('0 23 * * *', () => {
            this.postChannelContent('preview', 'channel');
        }, { timezone: 'Asia/Kolkata' });

        // === 群组帖子（互动讨论为主，与频道完全不同）===

        // 09:30 - 群组早安互动
        cron.schedule('30 9 * * *', () => {
            this.postGroupContent('morning_chat', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 10:30 - 群组闲聊（新增）
        cron.schedule('30 10 * * *', () => {
            this.postGroupContent('discussion', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 11:30 - 群组讨论话题
        cron.schedule('30 11 * * *', () => {
            this.postGroupContent('discussion', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 12:30 - 群组午间聊天（新增）
        cron.schedule('30 12 * * *', () => {
            this.postGroupContent('experience', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 14:00 - 群组经验分享
        cron.schedule('0 14 * * *', () => {
            this.postGroupContent('experience', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 16:00 - 群组问答互动
        cron.schedule('0 16 * * *', () => {
            this.postGroupContent('qa', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 18:00 - 群组奖池讨论
        cron.schedule('0 18 * * *', () => {
            this.postGroupPool();
        }, { timezone: 'Asia/Kolkata' });

        // 20:10 - 群组倒计时1h（互动式）
        cron.schedule('10 20 * * *', () => {
            this.postGroupCountdown(60);
        }, { timezone: 'Asia/Kolkata' });

        // 20:40 - 群组倒计时30m（互动式）
        cron.schedule('40 20 * * *', () => {
            this.postGroupCountdown(30);
        }, { timezone: 'Asia/Kolkata' });

        // 21:00 - 群组开奖直播（新增）
        cron.schedule('0 21 * * *', () => {
            this.postGroupContent('live_draw', 'group');
        }, { timezone: 'Asia/Kolkata' });

        // 21:10 - 群组开奖庆祝
        cron.schedule('10 21 * * *', () => {
            this.postGroupWinners();
        }, { timezone: 'Asia/Kolkata' });

        // 22:30 - 群组晚安聊天
        cron.schedule('30 22 * * *', () => {
            this.postGroupContent('night_chat', 'group');
        }, { timezone: 'Asia/Kolkata' });

        console.log('[AUTO_POST] All schedules started!');
        console.log(`[AUTO_POST] Channel posts: 11 (Game promotion focus)`);
        console.log(`[AUTO_POST] Group posts: 11 (Community interaction focus)`);
    }

    // ============ 频道新帖子类型（游戏推广为主）============
    
    // 通用内容发布（支持自定义类型）
    async postChannelContent(type, target) {
        const typeKey = `ch_${type}`;
        if (this.hasPostedToday(typeKey)) return;
        
        const poolData = await this.getPoolData();
        const content = await this.generateContent(type, target, { poolData });
        await this.sendToChannel(content);
        this.markPosted(typeKey);
    }

    // 倒计时（提醒关注机器人）
    async postChannelCountdownWithBot(minutes) {
        const typeKey = `ch_cd_bot_${minutes}`;
        if (this.hasPostedToday(typeKey)) return;
        
        const poolData = await this.getPoolData();
        const content = await this.generateContent('countdown_bot', 'channel', { minutes, poolData });
        await this.sendToChannel(content);
        this.markPosted(typeKey);
    }

    // ============ 群组新帖子类型（互动讨论为主）============

    // 通用群组内容
    async postGroupContent(type, target) {
        const typeKey = `gr_${type}`;
        if (this.hasPostedToday(typeKey)) return;
        
        const poolData = await this.getPoolData();
        const content = await this.generateContent(type, target, { poolData });
        await this.sendToGroup(content);
        this.markPosted(typeKey);
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
