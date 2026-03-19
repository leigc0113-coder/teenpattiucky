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
            intro: '类型: 平台介绍。目的: 介绍Teen Patti游戏平台，吸引新用户。强调: 游戏乐趣、赢钱机会、免费参与。必须包含游戏下载链接。',
            
            game_aviator: '类型: Aviator游戏推广。目的: 推广Aviator游戏。强调: 游戏特点、刺激玩法、高赔率、立即试玩。必须包含游戏下载链接。',
            
            game_slots: '类型: Slots游戏推广。目的: 推广Slots游戏。强调: 丰富主题、大奖机会、简单好玩。必须包含游戏下载链接。',
            
            tips: '类型: 赢钱技巧。目的: 提供游戏技巧，建立信任。强调: 实用技巧能帮助赢钱。可以提及游戏平台。',
            
            pool: '类型: 奖池更新。目的: 展示奖池金额，刺激参与。强调: 参与人数越多奖池越大，现在加入来得及。',
            
            countdown_bot: '类型: 开奖倒计时+关注提醒。目的: 制造紧迫感+引导关注机器人。强调: 时间紧迫，立即关注机器人获取号码。必须包含机器人链接和关注引导。',
            
            winners: '类型: 开奖结果。目的: 宣布中奖者，展示真实性。强调: 真实中奖、立即到账，鼓励明天继续参与。',
            
            preview: '类型: 明日预告。目的: 预告明天活动，保持期待。强调: 明天奖池更大、机会更多。'
        };

        // 群组内容：互动讨论为主，与频道完全不同
        const groupInstructions = {
            morning_chat: '类型: 早安闲聊。目的: 自然开启对话，不问游戏。话题: 今天计划、心情、天气。像朋友聊天，不要推销。',
            
            discussion: '类型: 话题讨论。目的: 引发群内讨论。话题: "你们最喜欢什么游戏？"、"赢过最大的奖是多少？"。纯互动，不要发链接。',
            
            experience: '类型: 经验分享。目的: 分享游戏经验，听取大家意见。语气: "我最近发现..."、"你们觉得怎么样？"。不要直接推销。',
            
            qa: '类型: 问答互动。目的: 提问让大家回答。问题: "有人中过奖吗？"、"新手建议玩什么？"。鼓励回复。',
            
            pool: '类型: 奖池讨论。目的: 分享奖池信息，引发讨论。语气: "哇今天奖池已经XXX了"、"你们猜今天多少人参与？"。',
            
            countdown: '类型: 倒计时互动。目的: 提醒开奖时间，互动式。语气: "还有X小时开奖，紧张！"、"你们都准备好了吗？"。',
            
            winners: '类型: 开奖庆祝。目的: 祝贺中奖者，安慰其他人。语气: 恭喜、鼓励、明天继续。',
            
            night_chat: '类型: 晚安闲聊。目的: 自然结束对话。话题: 明天见、好梦、感谢今天参与。像朋友道别。'
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
- 风格: 广告风格、专业直接、转化导向
- 目标: 吸引点击、促进转化、增加参与
- 语气: 专业、有说服力、有紧迫感
- 格式: 清晰分段、使用 emoji、适当使用 #hashtag
- 受众: 印度在线游戏玩家，懂英语
- CTA: 必须包含明确的行动号召（如 "Join Now", "Get Your Numbers"）`;
        } else {
            return `你是社群运营专家。群组风格要求：
- 风格: 社区风格、朋友式对话、互动导向
- 目标: 引发讨论、增加互动、建立社区感
- 语气: 自然、友好、像真人聊天（用 TBH, NGL, lol 等口语）
- 格式: 短句为主、口语化、提问式结尾
- 受众: 印度玩家社群，喜欢轻松氛围
- 互动: 必须包含问题，鼓励回复（如 "What do you think?", "Drop a 🔥 if..."）`;
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
