/**
 * ============================================================
 * AI 内容生成器 - 多提供商支持版
 * ============================================================
 * 
 * 支持的 AI 提供商（按优先级）：
 * 1. Kimi API (Moonshot)
 * 2. OpenRouter (免费替代)
 * 3. 模板降级
 * 
 * 功能：
 * - 智能生成内容
 * - 双风格输出（频道广告风 / 群组社区风）
 * - 实时数据融合（奖池、参与人数等）
 * - 支持多种帖子类型
 */

const axios = require('axios');
const OpenRouterGenerator = require('./openRouterGenerator');

class AIContentGenerator {
    constructor(config = {}) {
        this.config = {
            BOT_NAME: config.BOT_NAME || 'TeenPatti Lucky Bot',
            APP_NAME: config.APP_NAME || 'TeenPatti Master',
            GAME_LINK: config.GAME_LINK || 'https://t.me/yourbot',
            BOT_USERNAME: config.BOT_USERNAME || 'TeenPattiLuckyBot',
            ...config
        };
        
        this.botName = this.config.BOT_NAME;
        this.appName = this.config.APP_NAME;
        this.gameLink = this.config.GAME_LINK;
        this.botUsername = this.config.BOT_USERNAME;
        
        // 初始化 Kimi
        this.kimiApiKey = config.KIMI_API_KEY || process.env.KIMI_API_KEY;
        this.kimiApiUrl = config.KIMI_API_URL || process.env.KIMI_API_URL || 'https://api.kimi.com/coding/v1/chat/completions';
        this.kimiModel = config.KIMI_MODEL || process.env.KIMI_MODEL || 'kimi-for-coding';
        
        // 初始化 OpenRouter（备选）
        this.openRouter = new OpenRouterGenerator(config);
        
        console.log('[AIContentGenerator] AI Providers:');
        console.log('  - Kimi:', this.kimiApiKey ? '✅ Configured' : '❌ Not configured');
        console.log('  - OpenRouter:', this.openRouter.isAvailable() ? '✅ Configured' : '❌ Not configured');
    }

    // 检查是否可用（任一提供商）
    isAvailable() {
        return !!this.kimiApiKey || this.openRouter.isAvailable();
    }

    // 主生成接口 - 自动选择最佳提供商
    async generate(type, target, data = {}) {
        // 尝试 1: Kimi API
        if (this.kimiApiKey) {
            try {
                console.log('[AIContentGenerator] Trying Kimi API...');
                const content = await this.callKimiAPI(type, target, data);
                if (content) return content;
            } catch (error) {
                console.error('[AIContentGenerator] Kimi API failed:', error.message);
            }
        }
        
        // 尝试 2: OpenRouter
        if (this.openRouter.isAvailable()) {
            try {
                console.log('[AIContentGenerator] Trying OpenRouter API...');
                const content = await this.openRouter.generate(type, target, data);
                if (content) return content;
            } catch (error) {
                console.error('[AIContentGenerator] OpenRouter failed:', error.message);
            }
        }
        
        // 降级到模板
        console.log('[AIContentGenerator] All AI providers failed, using template fallback');
        return this.fallbackGenerate(type, target, data);
    }

    // 构建提示词
    buildPrompt(type, target, data) {
        const style = target === 'group' ? 'community' : 'advertising';
        const isChannel = target === 'channel';
        
        // 将 type 和 target 传入 data 以便 getBaseContext 使用
        const enhancedData = { ...data, type, target };
        
        const baseContext = this.getBaseContext(enhancedData);
        const typeInstructions = this.getTypeInstructions(type, isChannel);
        const styleGuide = this.getStyleGuide(isChannel);
        
        return `${styleGuide}

${baseContext}

${typeInstructions}

要求：
1. 使用印度英语风格（印度玩家理解）
2. 加入适当的 emoji
3. 包含行动号召（CTA）
4. 内容要吸引人、有紧迫感
5. 长度适中（Telegram 适合阅读）
6. 使用 Markdown 格式

直接输出帖子内容，不要解释。`;
    }

    // 基础上下文
    getBaseContext(data) {
        const poolAmount = data.poolData?.amount || 0;
        const participants = data.poolData?.participants || 0;
        const gameType = data.gameType || 'aviator';
        const minutes = data.minutes || 60;
        
        return `当前数据：
- 奖池金额: ₹${poolAmount.toLocaleString('en-IN')}
- 参与人数: ${participants}
- 开奖时间: 21:00 IST (印度时间)
- 游戏链接: ${this.gameLink}
- 机器人链接: https://t.me/${this.botUsername}
- 游戏类型: ${gameType}
- 倒计时: ${minutes} 分钟

重要要求：
${data.target === 'channel' ? '- 必须包含游戏下载链接' : '- 不要发链接，纯聊天'}
${data.type === 'countdown_bot' ? '- 必须提醒用户关注机器人获取号码' : ''}`;
    }

    // 帖子类型指令
    getTypeInstructions(type, isChannel) {
        // 频道内容：游戏推广为主
        const channelInstructions = {
            intro: `类型: 平台介绍
格式示例：
🎰 WELCOME TO TEEN PATTI MASTER!

💰 Today's Jackpot: ₹[amount]
👥 [X] players joined

├ ✈️ Aviator - 100x multiplier
├ 🎰 Slots - Jackpot every hour  
└ 🎲 Teen Patti - Classic game

🔥 NEW PLAYERS GET FREE SPINS!

👉 Start Playing: [游戏链接]

#TeenPatti #WinRealCash`,
            
            game_aviator: `类型: Aviator游戏推广
格式示例：
✈️ AVIATOR - FLY TO WIN!

Crash game with 100x potential! 🔥

├ ⏱️ Rounds every 15 seconds
├ 📈 Watch multiplier grow
└ 💰 Cash out anytime!

Yesterday's top win: ₹50,000! 💵

Try FREE demo mode 👇
👉 [游戏链接]

#Aviator #CrashGame`,
            
            game_slots: `类型: Slots游戏推广
格式示例：
🎰 WEALTH SLOTS - SPIN & WIN!

Jackpot hits every 2-3 hours! 💎

├ 🎁 10 FREE spins for new players
├ 🎯 50+ themed slot machines
└ 🏆 Max win: 1000x your bet!

🎉 Bonus round = Guaranteed win!

Spin now 👇
👉 [游戏链接]

#Slots #Jackpot`,
            
            tips: `类型: 赢钱技巧
格式示例：
💡 PRO TIP #1: AVIATOR STRATEGY

Smart players win more! 📈

├ 1️⃣ Start with ₹50-100 bets
├ 2️⃣ Watch 3 rounds first
├ 3️⃣ Cash out at 2x-3x (safe)
└ 4️⃣ Never chase losses!

💰 347 players used this yesterday!

Practice FREE 👇
👉 [游戏链接]

#WinningTips #Aviator`,
            
            pool: `类型: 奖池更新
格式示例：
📊 POOL UPDATE - GROWING FAST!

🎰 Current Jackpot: ₹[amount] ⬆️

├ 👥 Participants: [X] players
├ ⏰ Draw in: [X] hours
└ 🎯 Your chance to win BIG!

More players = BIGGER pool! 🔥

Join now 👇
👉 @YourBot

#LuckyDraw #BigPool`,
            
            countdown_bot: `类型: 开奖倒计时+关注提醒
格式示例：
⏰ FINAL [X] MINUTES!

🎰 Pool locked at: ₹[amount]

⚠️ Don't have your numbers yet?

🔥 QUICK! Follow our bot:
👉 @YourBot

Get FREE numbers in 30 seconds!

Draw starts at 21:00 IST 🍀

#LastChance #GetYourNumbers`,
            
            live_draw: `类型: 开奖直播
格式示例：
🔴 LIVE DRAW STARTING NOW!

🎰 Selecting lucky winners...

├ ⏳ Results in 2 minutes
├ 🎯 [X] numbers competing
└ 💰 [X] winners will be chosen!

Stay tuned! 🍀
Your number could win!

Results at 21:05 👇
👉 @YourBot

#LuckyDrawLive`,
            
            winners: `类型: 开奖结果
格式示例：
🏆 CONGRATULATIONS WINNERS!

🎰 Lucky Draw Results - [Date]

🥇 1st Prize: ₹[amount]
   Number: #[number]
   Winner: @username

🥈 2nd Prize: ₹[amount]
   Winners: @user1, @user2

💰 Total paid: ₹[amount]!

Tomorrow is YOUR day! 👇
👉 @YourBot

#Winners #Congratulations`,
            
            preview: `类型: 明日预告
格式示例：
🌙 GOOD NIGHT WINNERS!

🎰 Tomorrow's Pool: ₹[amount]

├ 🔥 Bigger than today!
├ ⏰ Draw at 21:00 IST
└ 🎁 Early bird bonuses!

Set your alarm! ⏰
Don't miss tomorrow! 💪

Get ready 👇
👉 @YourBot

#SeeYouTomorrow #BiggerPool`
        };

        // 群组内容：互动讨论为主，与频道完全不同
        const groupInstructions = {
            morning_chat: `类型: 早安闲聊
格式示例：
Hey guys! 👋

How's everyone doing today?

TBH I'm feeling lucky! 🍀
Might grab some coffee first ☕

What's your plan for today?`,
            
            discussion: `类型: 话题讨论
格式示例：
Quick question! 🤔

What's your favorite game here?

Mine's Aviator - can't stop playing lol
The rush when it hits 10x! 🔥

What about you guys?
Drop your fav below! 👇`,
            
            experience: `类型: 经验分享
格式示例：
Just wanted to share! 💭

Tried the new slots today
NGL it's pretty addictive 😅

Hit 3 bonuses in a row!
Small wins but still fun 🎉

Anyone else tried it?`,
            
            qa: `类型: 问答互动
格式示例：
Question for everyone! 🙋

Has anyone actually won BIG here?

Like ₹10,000+ kind of big?

Curious about your stories!
Share if you're comfortable 😊`,
            
            pool: `类型: 奖池讨论
格式示例：
Wow guys! 😮

Today's pool is already ₹[amount]!

That's pretty good right?
More than yesterday I think

How many of you joined today?
I'm in with 5 numbers! 🎫`,
            
            countdown: `类型: 倒计时互动
格式示例：
[X] hours left! ⏰

Getting nervous now lol

My hands are literally shaking 😅
Anyone else feeling the same?

What numbers did you get?
Good luck everyone! 🍀`,
            
            live_draw: `类型: 开奖直播互动
格式示例：
IT'S HAPPENING! 🔥🔥🔥

Draw is LIVE right now!

Omg I'm so nervous 😅
Can't even look at my phone lol

Who do you think will win?
Drop your guess! 👇

Good luck everyone!! 🍀`,
            
            winners: `类型: 开奖庆祝
格式示例：
RESULTS ARE IN! 🎉

Congrats to all winners! 
Especially @username - huge win! 🏆

NGL I'm a bit jealous lol
But happy for you guys! 😊

Tomorrow is my day I can feel it!
Who's joining tomorrow? 💪`,
            
            night_chat: `类型: 晚安闲聊
格式示例：
Alright guys! 🌙

Time to call it a night

Thanks for the fun chat today!
You all are awesome ❤️

Good luck to everyone tomorrow!
Sleep well and dream big 😴

See you in the morning! 👋`
        };

        if (isChannel) {
            return channelInstructions[type] || channelInstructions.intro;
        } else {
            return groupInstructions[type] || groupInstructions.morning_chat;
        }
    }

    // 风格指南
    getStyleGuide(isChannel) {
        if (isChannel) {
            return `你是专业的 Telegram 频道运营专家。频道风格要求：

📐 格式规范：
- 标题行：使用大emoji + 大写英文（如：🎰 WELCOME TO TEEN PATTI）
- 分隔线：用空行或 ═══ 分隔不同段落
- 数据展示：用项目符号 ├ ├ └ 或 • 展示列表
- 重点数据：用 **粗体** 突出金额、人数
- 链接位置：放在底部，前面加 👉 或 🔗
- 结尾：使用 #Hashtag（2-3个相关标签）

🎨 视觉排版：
- 每段不超过3行
- 段落间空一行
- emoji放在行首或关键数据旁
- 数字用英文逗号分隔（如：₹10,000）

📝 内容结构：
1. 标题（抓眼球）
2. 核心数据（奖池、人数）
3. 详细介绍（游戏特点）
4. 行动号召（链接）
5. 标签

🎯 语气: 专业、有说服力、紧迫感
👥 受众: 印度在线游戏玩家
✅ CTA: 必须包含明确行动号召`;
        } else {
            return `你是社群运营专家。群组风格要求：

📐 格式规范：
- 开头：用简短问候（Hey guys! / Morning everyone!）
- 段落：短句为主，每段1-2行
- 换行：频繁换行，便于手机阅读
- emoji：每段1-2个，放在句首或句尾
- 问题：单独一行，用问号结尾
- 无链接：纯聊天，不要任何链接

🎨 视觉排版：
- 像发短信一样自然
- 使用口语缩写（TBH, NGL, lol, btw）
- 个人感受用 "I think..." / "Just..."
- 提问用 "What about you?" / "Anyone else?"

📝 内容结构：
1. 问候（简短）
2. 话题/分享（个人化）
3. 提问（引发回复）
4. 互动（期待回复）

🎯 语气: 自然、友好、像真人聊天
👥 受众: 印度玩家社群
❌ 禁止: 正式语言、长段落、推销语气`;
        }
    }

    // 调用 Kimi API
    async callKimiAPI(type, target, data) {
        const prompt = this.buildPrompt(type, target, data);
        
        const requestBody = {
            model: this.kimiModel,
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional content creator for Indian iGaming Telegram communities. Create engaging, conversion-focused content.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 800
        };

        console.log('[AIContentGenerator] Calling Kimi API...');
        
        const response = await axios.post(
            this.kimiApiUrl,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${this.kimiApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('[AIContentGenerator] API response received');
        
        // 处理不同 API 格式的响应
        if (response.data.choices && response.data.choices[0]) {
            return response.data.choices[0].message.content;
        } else if (response.data.content) {
            return response.data.content;
        } else {
            throw new Error('Unexpected API response format');
        }
    }

    // 备用模板生成（当 API 不可用时）
    fallbackGenerate(type, target, data) {
        console.log('[AIContentGenerator] Using fallback template generator');
        // 使用现有的 contentGeneratorDual 作为备用
        const ContentGeneratorDual = require('./contentGeneratorDual');
        const generator = new ContentGeneratorDual({
            BOT_NAME: this.botName,
            APP_NAME: this.appName,
            GAME_LINK: this.gameLink
        });
        return generator.generate(type, target, data);
    }

    // 批量生成（用于 A/B 测试）
    async generateVariants(type, target, data, count = 2) {
        const variants = [];
        for (let i = 0; i < count; i++) {
            const content = await this.generate(type, target, data);
            variants.push({
                id: `variant_${i + 1}`,
                content,
                timestamp: new Date()
            });
        }
        return variants;
    }
}

module.exports = AIContentGenerator;
