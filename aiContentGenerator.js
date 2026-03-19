/**
 * ============================================================
 * AI 内容生成器 - Kimi API 集成版
 * ============================================================
 * 
 * 功能：
 * - 接入 Kimi API 智能生成内容
 * - 支持 Kimi Code 平台 API (https://www.kimi.com/code)
 * - 双风格输出（频道广告风 / 群组社区风）
 * - 实时数据融合（奖池、参与人数等）
 * - 支持多种帖子类型
 */

const axios = require('axios');

class AIContentGenerator {
    constructor(config = {}) {
        this.apiKey = config.KIMI_API_KEY || process.env.KIMI_API_KEY;
        // Kimi Code API 端点 (OpenAI 兼容格式)
        this.apiUrl = config.KIMI_API_URL || process.env.KIMI_API_URL || 'https://api.kimi.com/coding/v1/chat/completions';
        this.model = config.KIMI_MODEL || process.env.KIMI_MODEL || 'kimi-for-coding';
        this.botName = config.BOT_NAME || 'TeenPatti Lucky Bot';
        this.appName = config.APP_NAME || 'TeenPatti Master';
        this.gameLink = config.GAME_LINK || 'https://t.me/yourbot';
        
        if (!this.apiKey) {
            console.warn('[AIContentGenerator] WARNING: KIMI_API_KEY not configured, falling back to template mode');
        } else {
            console.log('[AIContentGenerator] Kimi API URL:', this.apiUrl);
            console.log('[AIContentGenerator] Kimi Model:', this.model);
        }
    }

    // 检查是否可用
    isAvailable() {
        return !!this.apiKey;
    }

    // 主生成接口
    async generate(type, target, data = {}) {
        if (!this.isAvailable()) {
            console.log('[AIContentGenerator] Kimi API not available, using fallback template');
            return this.fallbackGenerate(type, target, data);
        }

        try {
            const prompt = this.buildPrompt(type, target, data);
            const content = await this.callKimiAPI(prompt);
            return content;
        } catch (error) {
            console.error('[AIContentGenerator] Kimi API error:', error.message);
            if (error.response) {
                console.error('[AIContentGenerator] Response status:', error.response.status);
                console.error('[AIContentGenerator] Response data:', JSON.stringify(error.response.data));
            }
            return this.fallbackGenerate(type, target, data);
        }
    }

    // 构建提示词
    buildPrompt(type, target, data) {
        const style = target === 'group' ? 'community' : 'advertising';
        const isChannel = target === 'channel';
        
        const baseContext = this.getBaseContext(data);
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
- 游戏类型: ${gameType}
- 倒计时: ${minutes} 分钟`;
    }

    // 帖子类型指令
    getTypeInstructions(type, isChannel) {
        const instructions = {
            morning: isChannel 
                ? '类型: 早安帖。目的: 开启新的一天，吸引用户参与今日抽奖。语气: 充满活力、激励人心。'
                : '类型: 早安帖。目的: 自然地开始对话，询问大家今天怎么样。语气: 像朋友一样聊天。',
            
            pool: isChannel
                ? '类型: 奖池更新。目的: 展示奖池增长，刺激用户参与。强调: 参与人数越多，奖池越大。'
                : '类型: 奖池更新。目的: 分享奖池数据，引发讨论。语气: 轻松、带点兴奋。',
            
            countdown: isChannel
                ? '类型: 开奖倒计时。目的: 制造紧迫感，最后冲刺。强调: 时间紧迫，立即行动。'
                : '类型: 开奖倒计时。目的: 提醒大家时间快到了，互动式。语气: 期待、紧张。',
            
            winners: isChannel
                ? '类型: 开奖结果。目的: 宣布中奖者，同时预告明天。强调: 真实中奖，鼓励继续参与。'
                : '类型: 开奖结果。目的: 祝贺中奖者，安慰其他人。语气: 祝贺、鼓励。',
            
            night: isChannel
                ? '类型: 晚安帖。目的: 结束一天，预告明天。强调: 明天继续，保持期待。'
                : '类型: 晚安帖。目的: 自然地结束对话。语气: 轻松、友好道别。',
            
            game: isChannel
                ? '类型: 游戏推荐。目的: 推荐游戏，引导试玩。强调: 游戏特点、赢钱机会。'
                : '类型: 游戏推荐。目的: 分享游戏体验，征求意见。语气: 真实、分享式。',
            
            tips: isChannel
                ? '类型: 技巧分享。目的: 提供价值，建立信任。强调: 实用技巧，帮助赢钱。'
                : '类型: 技巧分享。目的: 分享小窍门，引发讨论。语气: 友好建议。'
        };
        
        return instructions[type] || instructions.morning;
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
    async callKimiAPI(prompt) {
        const requestBody = {
            model: this.model,
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
            this.apiUrl,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
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
