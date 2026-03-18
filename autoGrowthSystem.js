/**
 * ============================================================
 * 自动增长系统 - Auto Growth System
 * ============================================================
 * 
 * 每日自动执行:
 * 1. Telegram频道互推联系
 * 2. 目标群组发消息
 * 3. Reddit帖子发布
 * 4. 数据记录与优化
 */

const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class AutoGrowthSystem {
    constructor(bot) {
        this.bot = bot;
        this.logFile = path.join(__dirname, 'logs', 'growth-log.json');
        this.targetsFile = path.join(__dirname, 'config', 'targets.json');
        
        // 确保日志目录存在
        this.ensureLogDir();
    }

    async ensureLogDir() {
        try {
            await fs.mkdir(path.join(__dirname, 'logs'), { recursive: true });
            await fs.mkdir(path.join(__dirname, 'config'), { recursive: true });
        } catch (e) {}
    }

    // ============ 每日任务调度 ============
    
    startAllTasks() {
        console.log('[GROWTH] Starting auto growth system...');
        
        // 09:00 - 联系频道互推 (10个)
        cron.schedule('0 9 * * *', () => this.taskChannelOutreach(), {
            timezone: 'Asia/Kolkata'
        });
        
        // 11:00 - 群组分享 (5个群)
        cron.schedule('0 11 * * *', () => this.taskGroupSharing(), {
            timezone: 'Asia/Kolkata'
        });
        
        // 14:00 - Reddit发帖
        cron.schedule('0 14 * * *', () => this.taskRedditPost(), {
            timezone: 'Asia/Kolkata'
        });
        
        // 16:00 - 第二轮群组分享
        cron.schedule('0 16 * * *', () => this.taskGroupSharing(), {
            timezone: 'Asia/Kolkata'
        });
        
        // 20:00 - 数据整理报告
        cron.schedule('0 20 * * *', () => this.taskDailyReport(), {
            timezone: 'Asia/Kolkata'
        });
        
        console.log('[GROWTH] All tasks scheduled');
    }

    // ============ 任务1: 频道互推联系 ============
    
    async taskChannelOutreach() {
        console.log('[GROWTH][09:00] Starting channel outreach...');
        
        try {
            // 读取目标频道列表
            const targets = await this.loadTargets();
            const channels = targets.channels.filter(c => !c.contacted);
            
            // 今天联系前10个
            const toContact = channels.slice(0, 10);
            
            for (const channel of toContact) {
                try {
                    // 发送私信给频道管理员
                    const message = this.getOutreachMessage(channel.name);
                    await this.bot.sendMessage(channel.contact, message);
                    
                    // 标记为已联系
                    channel.contacted = true;
                    channel.contactedAt = new Date().toISOString();
                    
                    await this.logAction('channel_outreach', {
                        channel: channel.name,
                        contact: channel.contact,
                        status: 'sent'
                    });
                    
                    // 延迟30秒，避免频率限制
                    await this.sleep(30000);
                    
                } catch (error) {
                    await this.logAction('channel_outreach', {
                        channel: channel.name,
                        error: error.message
                    });
                }
            }
            
            // 保存更新后的列表
            await this.saveTargets(targets);
            
        } catch (error) {
            console.error('[GROWTH] Channel outreach error:', error);
        }
    }

    // ============ 任务2: 群组分享 ============
    
    async taskGroupSharing() {
        console.log('[GROWTH] Starting group sharing...');
        
        try {
            const targets = await this.loadTargets();
            const groups = targets.groups;
            
            // 随机选择5个群
            const selected = this.shuffle(groups).slice(0, 5);
            
            for (const group of selected) {
                try {
                    // 发送分享消息
                    const message = this.getGroupShareMessage();
                    await this.bot.sendMessage(group.id, message);
                    
                    await this.logAction('group_share', {
                        group: group.name,
                        status: 'sent'
                    });
                    
                    // 延迟60秒
                    await this.sleep(60000);
                    
                } catch (error) {
                    // 可能被禁言/踢出，记录错误
                    await this.logAction('group_share', {
                        group: group.name,
                        error: error.message
                    });
                }
            }
            
        } catch (error) {
            console.error('[GROWTH] Group sharing error:', error);
        }
    }

    // ============ 任务3: Reddit发帖 ============
    
    async taskRedditPost() {
        console.log('[GROWTH][14:00] Preparing Reddit post...');
        
        // 注意：Reddit需要手动操作或API，这里生成内容
        const postContent = this.generateRedditPost();
        
        // 保存到文件，你手动复制发布
        await fs.writeFile(
            path.join(__dirname, 'logs', 'reddit-post-today.md'),
            postContent
        );
        
        // 发送通知给你
        await this.bot.sendMessage(
            process.env.ADMIN_ID,
            '📝 Today\'s Reddit post is ready!\nCheck: logs/reddit-post-today.md'
        );
        
        await this.logAction('reddit_post', {
            status: 'generated',
            file: 'reddit-post-today.md'
        });
    }

    // ============ 任务4: 每日报告 ============
    
    async taskDailyReport() {
        console.log('[GROWTH][20:00] Generating daily report...');
        
        const today = new Date().toDateString();
        const logs = await this.loadLogs();
        const todayLogs = logs.filter(l => l.date === today);
        
        const report = {
            date: today,
            channelOutreach: todayLogs.filter(l => l.type === 'channel_outreach').length,
            groupShares: todayLogs.filter(l => l.type === 'group_share').length,
            redditPosts: todayLogs.filter(l => l.type === 'reddit_post').length,
            errors: todayLogs.filter(l => l.error).length
        };
        
        // 发送报告
        const message = `📊 Daily Growth Report\n\n` +
            `📢 Channel Outreach: ${report.channelOutreach}\n` +
            `💬 Group Shares: ${report.groupShares}\n` +
            `📝 Reddit Posts: ${report.redditPosts}\n` +
            `❌ Errors: ${report.errors}`;
        
        await this.bot.sendMessage(process.env.ADMIN_ID, message);
        
        // 保存报告
        await fs.writeFile(
            path.join(__dirname, 'logs', `report-${today}.json`),
            JSON.stringify(report, null, 2)
        );
    }

    // ============ 工具方法 ============
    
    getOutreachMessage(channelName) {
        const messages = [
            `Hi! I run @telltest222 - Teen Patti Lucky Draw with real cash prizes via UPI (₹1,000-₹20,000 daily).\n\nWould you be open to a mutual shoutout? I have ${this.getSubscribers()} subscribers. Win-win! 🎉`,
            
            `Hello! I noticed your channel ${channelName} is about gaming/earning.\n\nI run a Teen Patti lottery bot (@Teenpattiluckybot) with real UPI payouts. Would love to explore a cross-promotion! 💰`,
            
            `Hey there! 👋\n\nI operate @telltest222 - a daily lottery bot with guaranteed cash prizes. We're looking to partner with channels like yours.\n\nInterested in a mutual shoutout?`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getGroupShareMessage() {
        const messages = [
            `Hey everyone! 👋\n\nJust found this cool daily lottery bot - Teen Patti Lucky Draw. They actually pay via UPI instantly 💰\n\nGot my free number today. Anyone else playing? 🎲\n\n@Teenpattiluckybot`,
            
            `Daily cash giveaway alert! 🚨\n\n₹1,000-₹20,000 prize pool every day at 9 PM IST\n✅ Free entry available\n💸 UPI payment in minutes\n\nCheck it out: @Teenpattiluckybot`,
            
            `Who here likes Teen Patti? 🃏\n\nFound this bot that does daily draws with real cash prizes. Already won ₹500 yesterday! 🎉\n\nWorth a try if you're interested: @Teenpattiluckybot`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    generateRedditPost() {
        const posts = [
            `# [Experience] Won ₹500 from a Telegram lottery bot - Legit review

I've been playing this Teen Patti lottery bot for a week. Finally won yesterday! They actually pay via UPI instantly (got my money in 2 minutes).

**Details:**
- Daily draws at 9 PM IST
- Prize pool: ₹1,000-₹20,000
- Free entry available (1 number)
- Paid entries: ₹100-₹20,000 (2-12 numbers)
- Payment: UPI (verified instantly)

**My experience:**
Started with free entry, then did ₹500 recharge when I saw it was legit. Won ₹500 on my 3rd day!

Not saying you'll win, but it's legit and pays out. DYOR obviously.

Bot: @Teenpattiluckybot
Channel: @telltest222

*Not financial advice, just sharing my experience*`,

            `# Side income opportunity for Indians - Daily lottery with UPI payout

Found this interesting Telegram bot that does daily Teen Patti-style lottery draws.

**The good:**
- Actually pays (UPI verified)
- Free option available
- Daily draws (21:00 IST)
- Transparent winner list

**The reality:**
- It's gambling/lottery (risk involved)
- Not guaranteed income
- Addictive like any game

If anyone wants to check: @Teenpattiluckybot

Anyone else using this or similar bots? What's your experience?`,

            `# Question: Are Telegram lottery bots legit? This one actually paid me

I was skeptical but tried @Teenpattiluckybot because they offer free entry.

**What happened:**
- Day 1: Free entry, didn't win
- Day 2: ₹100 recharge, didn't win  
- Day 3: ₹100 recharge, won ₹200!
- Payment: Received via UPI in 2 minutes

**My take:**
It's legit BUT it's still gambling. Don't put money you can't afford to lose. The free entry is a good way to test.

Channel with updates: @telltest222

Anyone else tried this? What's your experience with Telegram money-making bots?`
        ];
        
        return posts[Math.floor(Math.random() * posts.length)];
    }

    async loadTargets() {
        try {
            const data = await fs.readFile(this.targetsFile, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return { channels: [], groups: [] };
        }
    }

    async saveTargets(targets) {
        await fs.writeFile(this.targetsFile, JSON.stringify(targets, null, 2));
    }

    async logAction(type, data) {
        const log = {
            type,
            date: new Date().toDateString(),
            time: new Date().toISOString(),
            ...data
        };
        
        const logs = await this.loadLogs();
        logs.push(log);
        
        await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2));
    }

    async loadLogs() {
        try {
            const data = await fs.readFile(this.logFile, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    shuffle(array) {
        return [...array].sort(() => Math.random() - 0.5);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSubscribers() {
        // 从实际数据获取
        return '1,500+';
    }
}

module.exports = AutoGrowthSystem;
