/**
 * ============================================================
 * OpenRouter AI 内容生成器 - 免费替代方案
 * ============================================================
 * 
 * OpenRouter 提供免费的 AI 模型（如 Google Gemma、Meta Llama 等）
 * 无需充值，每天有免费额度
 * 
 * 注册: https://openrouter.ai/
 */

const axios = require('axios');

class OpenRouterContentGenerator {
    constructor(config = {}) {
        this.apiKey = config.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
        this.apiUrl = config.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
        // 免费模型选项
        this.model = config.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free'; // 免费版
        this.botName = config.BOT_NAME || 'TeenPatti Lucky Bot';
        this.appName = config.APP_NAME || 'TeenPatti Master';
        this.gameLink = config.GAME_LINK || 'https://t.me/yourbot';
        
        if (!this.apiKey) {
            console.warn('[OpenRouterGenerator] WARNING: OPENROUTER_API_KEY not configured');
        }
    }

    // 检查是否可用
    isAvailable() {
        return !!this.apiKey;
    }

    // 主生成接口
    async generate(type, target, data = {}) {
        if (!this.isAvailable()) {
            console.log('[OpenRouterGenerator] OpenRouter API not available');
            return null;
        }

        try {
            const prompt = this.buildPrompt(type, target, data);
            const content = await this.callOpenRouterAPI(prompt);
            return content;
        } catch (error) {
            console.error('[OpenRouterGenerator] API error:', error.message);
            return null;
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

Requirements:
1. Use Indian English style (for Indian players)
2. Add appropriate emojis
3. Include call-to-action (CTA)
4. Make it engaging and urgent
5. Keep it concise (Telegram-friendly)
6. Use Markdown format

Output only the post content, no explanations.`;
    }

    // 基础上下文
    getBaseContext(data) {
        const poolAmount = data.poolData?.amount || 0;
        const participants = data.poolData?.participants || 0;
        const gameType = data.gameType || 'aviator';
        const minutes = data.minutes || 60;
        
        return `Current Data:
- Pool Amount: ₹${poolAmount.toLocaleString('en-IN')}
- Participants: ${participants}
- Draw Time: 21:00 IST (India Time)
- Game Link: ${this.gameLink}
- Game Type: ${gameType}
- Countdown: ${minutes} minutes`;
    }

    // 帖子类型指令
    getTypeInstructions(type, isChannel) {
        const instructions = {
            morning: isChannel 
                ? 'Type: Good morning post. Purpose: Start the day, attract users to join. Tone: Energetic, motivating.'
                : 'Type: Good morning post. Purpose: Natural conversation starter. Tone: Friendly chat.',
            
            pool: isChannel
                ? 'Type: Pool update. Purpose: Show pool growth, stimulate participation. Emphasize: More players = bigger pool.'
                : 'Type: Pool update. Purpose: Share pool data, start discussion. Tone: Casual, excited.',
            
            countdown: isChannel
                ? 'Type: Countdown. Purpose: Create urgency, final push. Emphasize: Time is running out, act now.'
                : 'Type: Countdown. Purpose: Remind time is near, interactive. Tone: Anticipating, tense.',
            
            winners: isChannel
                ? 'Type: Winners announcement. Purpose: Announce winners, preview tomorrow. Emphasize: Real winners, keep participating.'
                : 'Type: Winners announcement. Purpose: Congratulate winners, comfort others. Tone: Congratulatory, encouraging.',
            
            night: isChannel
                ? 'Type: Good night. Purpose: End the day, preview tomorrow. Emphasize: Continue tomorrow, stay tuned.'
                : 'Type: Good night. Purpose: Natural conversation end. Tone: Relaxed, friendly goodbye.',
            
            game: isChannel
                ? 'Type: Game recommendation. Purpose: Recommend games, guide to play. Emphasize: Game features, winning chances.'
                : 'Type: Game recommendation. Purpose: Share game experience, ask for opinions. Tone: Authentic, sharing.',
            
            tips: isChannel
                ? 'Type: Tips sharing. Purpose: Provide value, build trust. Emphasize: Practical tips to help win.'
                : 'Type: Tips sharing. Purpose: Share tips, start discussion. Tone: Friendly advice.'
        };
        
        return instructions[type] || instructions.morning;
    }

    // 风格指南
    getStyleGuide(isChannel) {
        if (isChannel) {
            return `You are a professional Telegram channel operator. Channel style requirements:
- Style: Advertising style, professional, direct, conversion-oriented
- Goal: Drive clicks, boost conversion, increase participation
- Tone: Professional, persuasive, urgent
- Format: Clear sections, use emojis, use #hashtags appropriately
- Audience: Indian online gamers who understand English
- CTA: Must include clear call-to-action (e.g., "Join Now", "Get Your Numbers")`;
        } else {
            return `You are a community engagement expert. Group style requirements:
- Style: Community style, friend-like conversation, interaction-oriented
- Goal: Spark discussion, increase interaction, build community
- Tone: Natural, friendly, like chatting with real people (use TBH, NGL, lol, etc.)
- Format: Short sentences, colloquial, question-style endings
- Audience: Indian gaming community, likes relaxed atmosphere
- Interaction: Must include questions to encourage replies (e.g., "What do you think?", "Drop a 🔥 if...")`;
        }
    }

    // 调用 OpenRouter API
    async callOpenRouterAPI(prompt) {
        const response = await axios.post(
            this.apiUrl,
            {
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
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://teenpatti-lucky-bot.com',
                    'X-Title': 'TeenPatti Lucky Bot'
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content;
    }
}

module.exports = OpenRouterContentGenerator;
