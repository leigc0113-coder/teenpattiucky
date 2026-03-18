/**
 * ============================================================
 * 自动发帖脚本 v3.0 - 双风格/双目标
 * ============================================================
 * 
 * 频道 @telltest222：广告风格（专业、直接推销）
 * 群组 @tkgfg：社群风格（自然、朋友式）
 */

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
            GAME_LINK: CONFIG.GAME_LINK || 'https://t.me/yourbot'
        };
        
        this.generator = new ContentGeneratorDual(this.config);
        this.postLog = new Map();
        
        Database.init().catch(err => {
            console.error('[AUTO_POST] Database init error:', err);
        });
    }

    async getPoolData() {
        try {
            console.log('[AUTO_POST] Getting pool data...');
            const pool = await PoolService.getTodayPool();
            console.log('[AUTO_POST] Raw pool data:', JSON.stringify(pool));
            
            const amount = pool?.finalAmount || pool?.amount || pool?.totalAmount || 0;
            const participants = pool?.participantCount || pool?.participants || 0;
            
            console.log(`[AUTO_POST] Parsed data: amount=${amount}, participants=${participants}`);
            
            return { amount, participants };
        } catch (error) {
            console.error('[AUTO_POST] getPoolData error:', error);
            return { amount: 0, participants: 0 };
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

    // ============ 频道帖子（广告风格）============
    
    async postChannelMorning() {
        if (this.hasPostedToday('ch_morning')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('morning', 'channel', poolData);
        await this.sendToChannel(content);
        this.markPosted('ch_morning');
    }

    async postChannelGame(gameType) {
        const type = `ch_game_${gameType}`;
        if (this.hasPostedToday(type)) return;
        const content = this.generator.generate('game', 'channel', { gameType });
        await this.sendToChannel(content);
        this.markPosted(type);
    }

    async postChannelTips() {
        if (this.hasPostedToday('ch_tips')) return;
        const content = this.generator.generate('tips', 'channel');
        await this.sendToChannel(content);
        this.markPosted('ch_tips');
    }

    async postChannelPool() {
        if (this.hasPostedToday('ch_pool')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('pool', 'channel', poolData);
        await this.sendToChannel(content);
        this.markPosted('ch_pool');
    }

    async postChannelCountdown(minutes) {
        const type = `ch_cd_${minutes}`;
        if (this.hasPostedToday(type)) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('countdown', 'channel', { minutes, poolData });
        await this.sendToChannel(content);
        this.markPosted(type);
    }

    async postChannelWinners() {
        if (this.hasPostedToday('ch_winners')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('winners', 'channel', poolData);
        await this.sendToChannel(content);
        this.markPosted('ch_winners');
    }

    async postChannelNight() {
        if (this.hasPostedToday('ch_night')) return;
        const content = this.generator.generate('night', 'channel');
        await this.sendToChannel(content);
        this.markPosted('ch_night');
    }

    // ============ 群组帖子（社群风格）============

    async postGroupMorning() {
        if (this.hasPostedToday('gr_morning')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('morning', 'group', poolData);
        await this.sendToGroup(content);
        this.markPosted('gr_morning');
    }

    async postGroupGame(gameType) {
        const type = `gr_game_${gameType}`;
        if (this.hasPostedToday(type)) return;
        const content = this.generator.generate('game', 'group', { gameType });
        await this.sendToGroup(content);
        this.markPosted(type);
    }

    async postGroupTips() {
        if (this.hasPostedToday('gr_tips')) return;
        const content = this.generator.generate('tips', 'group');
        await this.sendToGroup(content);
        this.markPosted('gr_tips');
    }

    async postGroupPool() {
        if (this.hasPostedToday('gr_pool')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('pool', 'group', poolData);
        await this.sendToGroup(content);
        this.markPosted('gr_pool');
    }

    async postGroupCountdown(minutes) {
        const type = `gr_cd_${minutes}`;
        if (this.hasPostedToday(type)) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('countdown', 'group', { minutes, poolData });
        await this.sendToGroup(content);
        this.markPosted(type);
    }

    async postGroupWinners() {
        if (this.hasPostedToday('gr_winners')) return;
        const poolData = await this.getPoolData();
        const content = this.generator.generate('winners', 'group', poolData);
        await this.sendToGroup(content);
        this.markPosted('gr_winners');
    }

    async postGroupNight() {
        if (this.hasPostedToday('gr_night')) return;
        const content = this.generator.generate('night', 'group');
        await this.sendToGroup(content);
        this.markPosted('gr_night');
    }

    // ============ 定时任务 ============

    startScheduledPosts() {
        console.log('[AUTO_POST] Starting dual-style posts...');
        console.log('[AUTO_POST] Channel:', this.channelId);
        console.log('[AUTO_POST] Group:', this.groupId);

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
        console.log('[AUTO_POST] Channel posts: 11 (ad style)');
        console.log('[AUTO_POST] Group posts: 11 (community style)');
    }

    // ============ 手动测试 ============

    async testPost(target, type, data = {}) {
        console.log(`[TEST] Sending ${type} to ${target}...`);
        
        const content = this.generator.generate(type, target, data);
        
        if (target === 'channel') {
            await this.sendToChannel(content);
        } else {
            await this.sendToGroup(content);
        }
        
        console.log(`[TEST] ${type} sent to ${target}`);
    }
}

module.exports = AutoPoster;

// 如果直接运行
if (require.main === module) {
    console.log('Usage: This module should be imported from bot.js');
    console.log('Or use /testpost command in Telegram');
}
