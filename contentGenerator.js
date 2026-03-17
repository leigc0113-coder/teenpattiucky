/**
 * ============================================================
 * AI 动态内容生成器 v2.0 - 优化版 (contentGenerator.js)
 * ============================================================
 * 
 * 优化内容：
 * - 更好的排版和视觉层次
 * - 更美观的字体样式（粗体、斜体、等宽）
 * - 统一的分隔线和布局
 * - 更清晰的视觉引导
 */

class ContentGenerator {
    constructor(config) {
        this.config = config;
        this.botName = config.BOT_NAME || 'TeenPatti Lucky Bot';
        this.appName = config.APP_NAME || 'TeenPatti Master';
        this.channelId = config.CHANNEL_ID;
        this.gameLink = config.GAME_LINK || 'https://t.me/yourbot';
    }

    // 获取当前时间（IST）
    getISTTime() {
        return new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // 获取当前星期几
    getDayOfWeek() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    }

    // 随机选择数组元素
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 随机表情
    randomEmoji(category) {
        const emojis = {
            morning: ['☀️', '🌅', '✨', '💫', '🌞'],
            fire: ['🔥', '💥', '⚡', '🚀', '🎯'],
            money: ['💰', '💵', '🪙', '💎', '🏆'],
            time: ['⏰', '⏳', '⌛', '🕐', '⏱️'],
            game: ['🎮', '🎰', '🎲', '🎯', '🎪'],
            win: ['🏆', '🥇', '🎉', '🎊', '✨'],
            luck: ['🍀', '🌟', '✨', '💫', '🎯'],
            card: ['🃏', '🎴', '🀄', '♠️', '♥️']
        };
        return this.randomPick(emojis[category] || emojis.fire);
    }

    // 生成变体开场白
    generateOpening(type) {
        const openings = {
            morning: [
                `${this.randomEmoji('morning')} *Rise and shine, winners!*`,
                `${this.randomEmoji('morning')} *Good morning champions!*`,
                `${this.randomEmoji('morning')} *Another day, another chance to win!*`,
                `${this.randomEmoji('morning')} *Wake up to winning!*`,
                `${this.randomEmoji('morning')} *New day = New opportunities!*`
            ],
            pool: [
                `${this.randomEmoji('money')} *Pool update coming in hot!*`,
                `${this.randomEmoji('fire')} *The pot is growing FAST!*`,
                `${this.randomEmoji('money')} *Your winning moment awaits!*`,
                `${this.randomEmoji('luck')} *Luck is in the air!*`,
                `${this.randomEmoji('fire')} *Things are heating up!*`
            ],
            game: [
                `${this.randomEmoji('game')} *Game time!*`,
                `${this.randomEmoji('fire')} *Hot game alert!*`,
                `${this.randomEmoji('win')} *Ready to win?*`,
                `${this.randomEmoji('game')} *Your next favorite game!*`,
                `${this.randomEmoji('fire')} *This game is FIRE!*`
            ],
            countdown: [
                `${this.randomEmoji('time')} *Clock is ticking!*`,
                `${this.randomEmoji('fire')} *Final countdown!*`,
                `${this.randomEmoji('time')} *Time's running out!*`,
                `${this.randomEmoji('fire')} *Last chance!*`,
                `${this.randomEmoji('time')} *Don't miss out!*`
            ],
            winner: [
                `${this.randomEmoji('win')} *We have WINNERS!*`,
                `${this.randomEmoji('win')} *Champions crowned!*`,
                `${this.randomEmoji('win')} *Congratulations to!*`,
                `${this.randomEmoji('win')} *Big wins today!*`,
                `${this.randomEmoji('win')} *Victory calls!*`
            ]
        };
        return this.randomPick(openings[type] || openings.morning);
    }

    // 生成装饰分隔线
    getDivider(style = 'default') {
        const dividers = {
            default: '━━━━━━━━━━━━━━━━━━━━━',
            double: '═════════════════════',
            star: '✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦',
            dot: '•••••••••••••••••••',
            wave: '〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️'
        };
        return dividers[style] || dividers.default;
    }

    // 生成变体行动号召
    generateCTA(type) {
        const ctas = {
            join: [
                `👉 [Join Now](${this.gameLink})`,
                `🎮 [Start Playing](${this.gameLink})`,
                `💰 [Claim Your Spot](${this.gameLink})`,
                `🚀 [Get Started](${this.gameLink})`,
                `✅ [Join The Action](${this.gameLink})`
            ],
            download: [
                `📲 [Download ${this.appName}](${this.gameLink})`,
                `🎮 [Get The App](${this.gameLink})`,
                `💰 [Play \& Win](${this.gameLink})`,
                `🚀 [Start Winning](${this.gameLink})`,
                `✅ [Download Now](${this.gameLink})`
            ],
            play: [
                `🎰 [Play FREE](${this.gameLink})`,
                `🎮 [Try Your Luck](${this.gameLink})`,
                `💰 [Win Real Money](${this.gameLink})`,
                `🚀 [Game On](${this.gameLink})`,
                `✅ [Play Now](${this.gameLink})`
            ]
        };
        return this.randomPick(ctas[type] || ctas.join);
    }

    // 生成变体标签
    generateHashtags() {
        const tags = [
            ['#TeenPattiMaster', '#LuckyDraw', '#WinBig'],
            ['#DailyDraw', '#RealMoney', '#PlayAndWin'],
            ['#TeenPatti', '#Jackpot', '#Winners'],
            ['#OnlineGaming', '#IndianGaming', '#BigWins'],
            ['#LuckyDay', '#CashPrize', '#GameOn']
        ];
        return this.randomPick(tags).join(' ');
    }

    // 格式化金额
    formatMoney(amount) {
        return `₹${amount.toLocaleString('en-IN')}`;
    }

    // 早安帖子（09:00）- 优化版
    generateMorningPost(poolData) {
        const opening = this.generateOpening('morning');
        const day = this.getDayOfWeek();
        const divider = this.getDivider('star');
        
        return `${opening}

${divider}

${this.randomEmoji('morning')} *Happy ${day}!*

${this.randomEmoji('game')} *TODAY'S LUCKY DRAW*
${this.randomEmoji('money')} Pool: \`${this.formatMoney(poolData?.amount || 0)}\`
${this.randomEmoji('time')} Draw Time: \`21:00 IST\`

${divider}

${this.randomEmoji('fire')} *WHILE YOU WAIT:*

*Play our hot games!*

✈️ _Aviator_ — 100x multiplier
🐉 _Dragon vs Tiger_ — 50/50 wins  
🎰 _Slots_ — ₹5 Lakh jackpot

${divider}

${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 游戏推荐帖子（11:00 / 15:00 / 17:00）- 优化版
    generateGamePost(gameType, winData) {
        const opening = this.generateOpening('game');
        const divider = this.getDivider('fire');
        
        const games = {
            aviator: {
                name: 'Aviator ✈️',
                icon: '✈️',
                features: ['_100x multiplier_', '_Cash out anytime_', '_15-sec rounds_'],
                tip: 'Cash out at 2x-3x for steady wins!',
                highlight: winData ? `Yesterday's top: ${this.formatMoney(winData)} at ${Math.floor(Math.random() * 50 + 20)}x!` : 'High stakes, high rewards!'
            },
            dragon: {
                name: 'Dragon vs Tiger 🐉⚡',
                icon: '🐉',
                features: ['_10-sec rounds_', '_50/50 chance_', '_10x on tie_'],
                tip: 'Watch the pattern, then strike!',
                highlight: 'Fastest game — perfect for quick wins!'
            },
            slots: {
                name: 'Wealth Slot 💎',
                icon: '💎',
                features: ['_Progressive jackpot_', '_Free spins_', '_Bonus rounds_'],
                tip: 'Max bet during bonus rounds!',
                highlight: `Current jackpot: ${this.formatMoney(Math.floor(Math.random() * 3 + 3) * 100000)}!`
            },
            chicken: {
                name: 'Chicken Road 🐔',
                icon: '🐔',
                features: ['_7 steps = 10x_', '_15 steps = 100x_', '_Strategy game_'],
                tip: '7 steps is the sweet spot!',
                highlight: 'Most addictive game this month!'
            },
            teenpatti: {
                name: 'Teen Patti 🇮🇳',
                icon: '🃏',
                features: ['_1M+ players_', '_Tournaments_', '_₹1 Lakh pools_'],
                tip: 'Bluff smart, win big!',
                highlight: 'India\'s favorite card game!'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${opening}

${divider}

${game.icon} *${game.name}*

${divider}

*Why players LOVE it:*
${game.features.map(f => `• ${f}`).join('\n')}

💡 *Pro Tip:* _${game.tip}_

${this.randomEmoji('win')} *${game.highlight}*

${divider}

${this.generateCTA('play')}

${this.generateHashtags()}`;
    }

    // 技巧帖子（13:00）- 优化版
    generateTipsPost() {
        const divider = this.getDivider('double');
        const tips = [
            {
                game: 'Aviator ✈️',
                title: 'The 3-Round Rule',
                content: 'Watch 3 rounds before betting. Identify the pattern, then strike!'
            },
            {
                game: 'Dragon vs Tiger 🐉',
                title: 'The Streak Strategy',
                content: 'If Dragon wins 3x in a row, bet on Tiger next. Patterns matter!'
            },
            {
                game: 'Slots 💎',
                title: 'Timing is Everything',
                content: 'Jackpots hit every 2-3 hours. Watch when it last hit!'
            },
            {
                game: 'Chicken Road 🐔',
                title: 'The 7-Step Safety',
                content: '7 steps = 10x with 90% safety. Greed kills, discipline wins!'
            },
            {
                game: 'General 🎮',
                title: 'Bankroll Management',
                content: 'Never bet more than 10% of your balance. Stay in the game longer!'
            }
        ];

        const tip = this.randomPick(tips);

        return `${this.randomEmoji('fire')} *PRO TIP: ${tip.title}*

${divider}

*${tip.game}*

_${tip.content}_

${divider}

${this.randomEmoji('win')} *Winners use strategy, not just luck!*

Practice FREE in ${this.appName}:
${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 奖池更新（15:00 / 18:00）- 优化版
    generatePoolUpdate(poolData) {
        const opening = this.generateOpening('pool');
        const divider = this.getDivider('money');
        const hoursLeft = 21 - new Date().getHours();
        
        return `${opening}

${divider}

${this.randomEmoji('game')} *LUCKY DRAW UPDATE*

${divider}

${this.randomEmoji('money')} *Pool Amount:* \`${this.formatMoney(poolData?.amount || 0)}\`
👥 *Players:* \`${poolData?.participants || 0}\`
⏰ *Draw in:* \`${hoursLeft} hours\`

${divider}

${hoursLeft <= 3 ? `${this.randomEmoji('fire')} *FINAL HOURS!* Don't miss out!` : '*Pool growing fast!* 🔥'}

${this.randomEmoji('game')} *Bored waiting? Play our games!*

✈️ _Aviator_ | 🐉 _Dragon vs Tiger_ | 🎰 _Slots_

${divider}

${this.generateCTA('join')}

${this.generateHashtags()}`;
    }

    // 倒计时帖子（19:00 / 20:00 / 20:30）- 优化版
    generateCountdown(minutesLeft, poolData) {
        const opening = this.generateOpening('countdown');
        const divider = this.getDivider('time');
        const urgency = minutesLeft <= 30 ? '⏰ *FINAL 30 MINUTES!*' : 
                       minutesLeft <= 60 ? '🔥 *LAST HOUR!*' : '⏳ *Time is running out!*';

        return `${opening}

${divider}

${urgency}

${divider}

🎱 *Pool:* \`${this.formatMoney(poolData?.amount || 0)}\` ${this.randomEmoji('money')}
👥 *\`${poolData?.participants || 0}\` players competing*

${minutesLeft <= 30 ? '⚡ *Last chance to join!*' : '✅ *Still time to get your numbers!*'}

${divider}

💰 *₹100-₹20,000 = 2-12 lucky numbers*

${divider}

${this.generateCTA('join')}

${this.generateHashtags()}`;
    }

    // 开奖结果（21:05）- 优化版
    generateWinnerPost(winners, poolData) {
        const opening = this.generateOpening('winner');
        const divider = this.getDivider('star');
        
        let winnerText = '';
        if (winners && winners.length > 0) {
            const topWinner = winners[0];
            winnerText = `
🥇 *1st Prize: ${this.formatMoney(topWinner.amount || 0)}*
   Winner: @${topWinner.username || 'Player****'}

${winners.length > 1 ? `🥈 *2nd Prize winners: ${winners.length - 1}*` : ''}`;
        }

        return `${opening}

${divider}

🏆 *${this.getDayOfWeek().toUpperCase()} DRAW RESULTS*

${divider}
${winnerText}

💰 *Total Pool: ${this.formatMoney(poolData?.amount || 0)}*
🎉 *Congratulations to all winners!*

${divider}

*Missed out? Don't worry!* 🎮
Play games in ${this.appName} while waiting for tomorrow!

${divider}

${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 睡前推送（23:00）- 优化版
    generateNightPost() {
        const divider = this.getDivider('dot');
        
        return `${this.randomEmoji('morning')} *Good Night Winners!*

${divider}

🎱 *Tomorrow's Draw*
💰 Starting Pool: \`₹1,000\`
⏰ Draw: \`21:00 IST\`

*Set your alarm!* ⏰

${divider}

*Before sleep...* 🎮
_One quick game of Aviator?_
Who knows, you might wake up richer! 💰

${this.generateCTA('play')}

${divider}

*Sweet dreams & big wins!* ${this.randomEmoji('luck')}

${this.generateHashtags()}`;
    }
}

module.exports = ContentGenerator;
