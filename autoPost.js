/**
 * ============================================================
 * 自动发帖脚本 (autoPost.js)
 * ============================================================
 * 
 * AI 动态生成内容，定时发布到频道
 * 每天内容都不同，根据实时数据变化
 * 
 * 使用方式:
 * node autoPost.js          # 手动执行所有帖子
 * node autoPost.js morning  # 手动执行特定类型
 * 
 * 定时运行（推荐添加到 bot.js）:
 * require('./autoPost').startScheduledPosts();
 */

const ContentGenerator = require('./contentGenerator');
const PoolService = require('./poolService');
const CONFIG = require('./config');
const cron = require('node-cron');

class AutoPoster {
    constructor(bot) {
        this.bot = bot;
        this.channelId = CONFIG.CHANNEL_ID;
        
        // 配置
        this.config = {
            BOT_NAME: CONFIG.BOT_NAME || 'TeenPatti Lucky Bot',
            APP_NAME: CONFIG.APP_NAME || 'TeenPatti Master',
            CHANNEL_ID: this.channelId,
            GAME_LINK: CONFIG.GAME_LINK || `https://t.me/${CONFIG.BOT_USERNAME || 'yourbot'}`
        };
        
        this.generator = new ContentGenerator(this.config);
        this.postLog = new Map(); // 记录已发帖时间
    }

    // 获取实时奖池数据
    async getPoolData() {
        try {
            const today = new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const [month, day, year] = today.split('/');
            const dateStr = `${year}-${month}-${day}`;
            
            const pool = await PoolService.getTodayPool();
            return {
                amount: pool?.finalAmount || pool?.amount || 0,
                participants: pool?.participantCount || pool?.participants || 0,
                date: dateStr
            };
        } catch (error) {
            console.error('[AUTO_POST] Get pool data error:', error);
            return { amount: 0, participants: 0, date: '' };
        }
    }

    // 发送帖子
    async sendPost(content, options = {}) {
        if (!this.channelId) {
            console.error('[AUTO_POST] CHANNEL_ID not configured');
            return;
        }

        try {
            const result = await this.bot.sendMessage(this.channelId, content, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
                ...options
            });
            
            console.log('[AUTO_POST] Posted successfully:', new Date().toISOString());
            return result;
        } catch (error) {
            console.error('[AUTO_POST] Send failed:', error.message);
            throw error;
        }
    }

    // 检查今天是否已经发过此类型的帖子
    hasPostedToday(type) {
        const today = new Date().toDateString();
        const key = `${today}_${type}`;
        return this.postLog.has(key);
    }

    // 记录已发帖
    markPosted(type) {
        const today = new Date().toDateString();
        const key = `${today}_${type}`;
        this.postLog.set(key, new Date());
    }

    // 09:00 - 早安帖子
    async postMorning() {
        if (this.hasPostedToday('morning')) {
            console.log('[AUTO_POST] Morning post already sent today');
            return;
        }

        const poolData = await this.getPoolData();
        const content = this.generator.generateMorningPost(poolData);
        
        await this.sendPost(content);
        this.markPosted('morning');
        console.log('[AUTO_POST] Morning post sent');
    }

    // 11:00 - 游戏推荐（Aviator）
    async postGame1() {
        if (this.hasPostedToday('game1')) return;
        
        const winData = Math.floor(Math.random() * 30000 + 20000); // 模拟昨日大奖
        const content = this.generator.generateGamePost('aviator', winData);
        
        await this.sendPost(content);
        this.markPosted('game1');
        console.log('[AUTO_POST] Game post 1 sent');
    }

    // 13:00 - 技巧帖子
    async postTips() {
        if (this.hasPostedToday('tips')) return;
        
        const content = this.generator.generateTipsPost();
        
        await this.sendPost(content);
        this.markPosted('tips');
        console.log('[AUTO_POST] Tips post sent');
    }

    // 15:00 - 奖池更新 + 游戏推荐（Dragon）
    async postPoolUpdate1() {
        if (this.hasPostedToday('pool1')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generatePoolUpdate(poolData);
        
        await this.sendPost(content);
        this.markPosted('pool1');
        console.log('[AUTO_POST] Pool update 1 sent');
    }

    // 17:00 - 游戏推荐（Slots）
    async postGame2() {
        if (this.hasPostedToday('game2')) return;
        
        const content = this.generator.generateGamePost('slots');
        
        await this.sendPost(content);
        this.markPosted('game2');
        console.log('[AUTO_POST] Game post 2 sent');
    }

    // 18:00 - 奖池更新（倒计时开始）
    async postPoolUpdate2() {
        if (this.hasPostedToday('pool2')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generatePoolUpdate(poolData);
        
        await this.sendPost(content);
        this.markPosted('pool2');
        console.log('[AUTO_POST] Pool update 2 sent');
    }

    // 19:00 - 倒计时（3小时）
    async postCountdown3h() {
        if (this.hasPostedToday('cd3h')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generateCountdown(180, poolData);
        
        await this.sendPost(content);
        this.markPosted('cd3h');
        console.log('[AUTO_POST] Countdown 3h sent');
    }

    // 20:00 - 倒计时（1小时）
    async postCountdown1h() {
        if (this.hasPostedToday('cd1h')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generateCountdown(60, poolData);
        
        await this.sendPost(content);
        this.markPosted('cd1h');
        console.log('[AUTO_POST] Countdown 1h sent');
    }

    // 20:30 - 倒计时（30分钟）
    async postCountdown30m() {
        if (this.hasPostedToday('cd30m')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generateCountdown(30, poolData);
        
        await this.sendPost(content);
        this.markPosted('cd30m');
        console.log('[AUTO_POST] Countdown 30m sent');
    }

    // 21:00 - 开奖公告
    async postDrawStart() {
        if (this.hasPostedToday('drawstart')) return;
        
        const content = `🎉 ${this.randomEmoji('win')} LIVE DRAW STARTING NOW!

🏆 Selecting lucky winners...
⏳ Results in 2 minutes!

May luck be with you! ${this.randomEmoji('luck')}

Play games while waiting 👇
👉 ${this.config.GAME_LINK}

#LiveDraw #WinnersComing`;
        
        await this.sendPost(content);
        this.markPosted('drawstart');
        console.log('[AUTO_POST] Draw start announcement sent');
    }

    // 21:05 - 中奖结果
    async postWinners(winners) {
        if (this.hasPostedToday('winners')) return;
        
        const poolData = await this.getPoolData();
        const content = this.generator.generateWinnerPost(winners, poolData);
        
        await this.sendPost(content);
        this.markPosted('winners');
        console.log('[AUTO_POST] Winners post sent');
    }

    // 23:00 - 睡前推送
    async postNight() {
        if (this.hasPostedToday('night')) return;
        
        const content = this.generator.generateNightPost();
        
        await this.sendPost(content);
        this.markPosted('night');
        console.log('[AUTO_POST] Night post sent');
    }

    randomEmoji(category) {
        const emojis = {
            win: ['🏆', '🎉', '🎊', '✨', '🥇'],
            luck: ['🍀', '🌟', '✨', '💫', '🎯']
        };
        const arr = emojis[category] || ['✨'];
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 启动定时任务
    startScheduledPosts() {
        console.log('[AUTO_POST] Starting scheduled posts...');
        console.log('[AUTO_POST] Channel:', this.channelId);

        // 09:00 - 早安
        cron.schedule('0 9 * * *', () => {
            this.postMorning();
        }, { timezone: 'Asia/Kolkata' });

        // 11:00 - 游戏推荐1
        cron.schedule('0 11 * * *', () => {
            this.postGame1();
        }, { timezone: 'Asia/Kolkata' });

        // 13:00 - 技巧
        cron.schedule('0 13 * * *', () => {
            this.postTips();
        }, { timezone: 'Asia/Kolkata' });

        // 15:00 - 奖池更新1
        cron.schedule('0 15 * * *', () => {
            this.postPoolUpdate1();
        }, { timezone: 'Asia/Kolkata' });

        // 17:00 - 游戏推荐2
        cron.schedule('0 17 * * *', () => {
            this.postGame2();
        }, { timezone: 'Asia/Kolkata' });

        // 18:00 - 奖池更新2
        cron.schedule('0 18 * * *', () => {
            this.postPoolUpdate2();
        }, { timezone: 'Asia/Kolkata' });

        // 19:00 - 倒计时3小时
        cron.schedule('0 19 * * *', () => {
            this.postCountdown3h();
        }, { timezone: 'Asia/Kolkata' });

        // 20:00 - 倒计时1小时
        cron.schedule('0 20 * * *', () => {
            this.postCountdown1h();
        }, { timezone: 'Asia/Kolkata' });

        // 20:30 - 倒计时30分钟
        cron.schedule('30 20 * * *', () => {
            this.postCountdown30m();
        }, { timezone: 'Asia/Kolkata' });

        // 21:00 - 开奖开始
        cron.schedule('0 21 * * *', () => {
            this.postDrawStart();
        }, { timezone: 'Asia/Kolkata' });

        // 23:00 - 睡前
        cron.schedule('0 23 * * *', () => {
            this.postNight();
        }, { timezone: 'Asia/Kolkata' });

        console.log('[AUTO_POST] All schedules started!');
        console.log('[AUTO_POST] Posts per day: 11');
    }

    // 手动执行特定类型
    async postManual(type) {
        switch(type) {
            case 'morning': await this.postMorning(); break;
            case 'game1': await this.postGame1(); break;
            case 'tips': await this.postTips(); break;
            case 'pool1': await this.postPoolUpdate1(); break;
            case 'game2': await this.postGame2(); break;
            case 'pool2': await this.postPoolUpdate2(); break;
            case 'cd3h': await this.postCountdown3h(); break;
            case 'cd1h': await this.postCountdown1h(); break;
            case 'cd30m': await this.postCountdown30m(); break;
            case 'draw': await this.postDrawStart(); break;
            case 'night': await this.postNight(); break;
            default:
                console.log('Available types: morning, game1, tips, pool1, game2, pool2, cd3h, cd1h, cd30m, draw, night');
        }
    }
}

// 导出类
module.exports = AutoPoster;

// 如果直接运行此文件
if (require.main === module) {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(CONFIG.BOT_TOKEN, { polling: false });
    
    const poster = new AutoPoster(bot);
    const type = process.argv[2];
    
    if (type) {
        poster.postManual(type).then(() => {
            console.log('Manual post completed');
            process.exit(0);
        }).catch(err => {
            console.error('Manual post failed:', err);
            process.exit(1);
        });
    } else {
        console.log('Usage: node autoPost.js [type]');
        console.log('Types: morning, game1, tips, pool1, game2, pool2, cd3h, cd1h, cd30m, draw, night');
        process.exit(0);
    }
}
