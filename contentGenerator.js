/**
 * ============================================================
 * AI 动态内容生成器 (contentGenerator.js)
 * ============================================================
 * 
 * 根据实时数据、时间、游戏类型动态生成频道帖子
 * 无需固定模板，每次内容都不同
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
            luck: ['🍀', '🌟', '✨', '💫', '🎯']
        };
        return this.randomPick(emojis[category] || emojis.fire);
    }

    // 生成变体开场白
    generateOpening(type) {
        const openings = {
            morning: [
                `${this.randomEmoji('morning')} Rise and shine, winners!`,
                `${this.randomEmoji('morning')} Good morning champions!`,
                `${this.randomEmoji('morning')} Another day, another chance to win!`,
                `${this.randomEmoji('sun')} Wake up to winning!`,
                `${this.randomEmoji('morning')} New day = New opportunities!`
            ],
            pool: [
                `${this.randomEmoji('money')} Pool update coming in hot!`,
                `${this.randomEmoji('fire')} The pot is growing FAST!`,
                `${this.randomEmoji('money')} Your winning moment awaits!`,
                `${this.randomEmoji('luck')} Luck is in the air!`,
                `${this.randomEmoji('fire')} Things are heating up!`
            ],
            game: [
                `${this.randomEmoji('game')} Game time!`,
                `${this.randomEmoji('fire')} Hot game alert!`,
                `${this.randomEmoji('win')} Ready to win?`,
                `${this.randomEmoji('game')} Your next favorite game!`,
                `${this.randomEmoji('fire')} This game is FIRE!`
            ],
            countdown: [
                `${this.randomEmoji('time')} Clock is ticking!`,
                `${this.randomEmoji('fire')} Final countdown!`,
                `${this.randomEmoji('time')} Time's running out!`,
                `${this.randomEmoji('fire')} Last chance!`,
                `${this.randomEmoji('time')} Don't miss out!`
            ],
            winner: [
                `${this.randomEmoji('win')} We have WINNERS!`,
                `${this.randomEmoji('trophy')} Champions crowned!`,
                `${this.randomEmoji('win')} Congratulations to!`,
                `${this.randomEmoji('celebrate')} Big wins today!`,
                `${this.randomEmoji('win')} Victory calls!`
            ]
        };
        return this.randomPick(openings[type] || openings.morning);
    }

    // 生成变体行动号召
    generateCTA(type) {
        const ctas = {
            join: [
                `👉 Join now: ${this.gameLink}`,
                `🎮 Start playing: ${this.gameLink}`,
                `💰 Claim your spot: ${this.gameLink}`,
                `🚀 Get started: ${this.gameLink}`,
                `✅ Join the action: ${this.gameLink}`
            ],
            download: [
                `📲 Download ${this.appName}: ${this.gameLink}`,
                `🎮 Get the app: ${this.gameLink}`,
                `💰 Play & Win: ${this.gameLink}`,
                `🚀 Start winning: ${this.gameLink}`,
                `✅ Download now: ${this.gameLink}`
            ],
            play: [
                `🎰 Play FREE: ${this.gameLink}`,
                `🎮 Try your luck: ${this.gameLink}`,
                `💰 Win real money: ${this.gameLink}`,
                `🚀 Game on: ${this.gameLink}`,
                `✅ Play now: ${this.gameLink}`
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

    // 早安帖子（09:00）
    generateMorningPost(poolData) {
        const opening = this.generateOpening('morning');
        const day = this.getDayOfWeek();
        
        return `${opening}

${this.randomEmoji('fire')} Happy ${day}!

🎱 Today's Lucky Draw Pool: ₹${(poolData?.amount || 0).toLocaleString()}
⏰ Draw at 21:00 IST

While you wait, warm up with our games! ${this.randomEmoji('game')}
✈️ Aviator - 100x multiplier
🐉 Dragon vs Tiger - 50/50 wins
🎰 Slots - ₹5 Lakh jackpot

${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 游戏推荐帖子（11:00 / 15:00 / 17:00）
    generateGamePost(gameType, winData) {
        const opening = this.generateOpening('game');
        
        const games = {
            aviator: {
                name: 'Aviator ✈️',
                features: ['100x multiplier', 'Cash out anytime', '15-sec rounds'],
                tip: 'Cash out at 2x-3x for steady wins!',
                highlight: winData ? `Yesterday's top: ₹${winData.toLocaleString()} at ${Math.floor(Math.random() * 50 + 20)}x!` : 'High stakes, high rewards!'
            },
            dragon: {
                name: 'Dragon vs Tiger 🐉⚡',
                features: ['10-sec rounds', '50/50 chance', '10x on tie'],
                tip: 'Watch the pattern, then strike!',
                highlight: 'Fastest game - perfect for quick wins!'
            },
            slots: {
                name: 'Wealth Slot 💎',
                features: ['Progressive jackpot', 'Free spins', 'Bonus rounds'],
                tip: 'Max bet during bonus rounds!',
                highlight: `Current jackpot: ₹${(Math.floor(Math.random() * 3 + 3) * 100000).toLocaleString()}!`
            },
            chicken: {
                name: 'Chicken Road 🐔',
                features: ['7 steps = 10x', '15 steps = 100x', 'Strategy game'],
                tip: '7 steps is the sweet spot!',
                highlight: 'Most addictive game this month!'
            },
            teenpatti: {
                name: 'Teen Patti 🇮🇳',
                features: ['1M+ players', 'Tournaments', '₹1 Lakh pools'],
                tip: 'Bluff smart, win big!',
                highlight: 'India\'s favorite card game!'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${opening}

${this.randomEmoji('fire')} ${game.name}

Why players LOVE it:
${game.features.map(f => `✅ ${f}`).join('\n')}

💡 Pro Tip: ${game.tip}

${this.randomEmoji('win')} ${game.highlight}

${this.generateCTA('play')}

${this.generateHashtags()}`;
    }

    // 技巧帖子（13:00）
    generateTipsPost() {
        const tips = [
            {
                game: 'Aviator',
                title: 'The 3-Round Rule',
                content: 'Watch 3 rounds before betting. Identify the pattern, then strike!'
            },
            {
                game: 'Dragon vs Tiger',
                title: 'The Streak Strategy',
                content: 'If Dragon wins 3x in a row, bet on Tiger next. Patterns matter!'
            },
            {
                game: 'Slots',
                title: 'Timing is Everything',
                content: 'Jackpots hit every 2-3 hours. Watch when it last hit!'
            },
            {
                game: 'Chicken Road',
                title: 'The 7-Step Safety',
                content: '7 steps = 10x with 90% safety. Greed kills, discipline wins!'
            },
            {
                game: 'General',
                title: 'Bankroll Management',
                content: 'Never bet more than 10% of your balance. Stay in the game longer!'
            }
        ];

        const tip = this.randomPick(tips);

        return `${this.randomEmoji('fire')} PRO TIP: ${tip.title}

💡 ${tip.game} Strategy:

${tip.content}

${this.randomEmoji('win')} Winners use strategy, not just luck!

Practice FREE in ${this.appName}:
${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 奖池更新（15:00 / 18:00）
    generatePoolUpdate(poolData) {
        const opening = this.generateOpening('pool');
        const hoursLeft = 21 - new Date().getHours();
        
        return `${opening}

${this.randomEmoji('money')} Lucky Draw Update

💰 Current Pool: ₹${(poolData?.amount || 0).toLocaleString()}
👥 Players Joined: ${poolData?.participants || 0}
⏰ Draw in: ${hoursLeft} hours

${hoursLeft <= 3 ? `${this.randomEmoji('fire')} FINAL HOURS! Don't miss out!` : 'Pool growing fast! 🔥'}

Bored waiting? Try our games! 🎮
✈️ Aviator | 🐉 Dragon vs Tiger | 🎰 Slots

${this.generateCTA('join')}

${this.generateHashtags()}`;
    }

    // 倒计时帖子（19:00 / 20:00 / 20:30）
    generateCountdown(minutesLeft, poolData) {
        const opening = this.generateOpening('countdown');
        const urgency = minutesLeft <= 30 ? '⏰ FINAL 30 MINUTES!' : 
                       minutesLeft <= 60 ? '🔥 LAST HOUR!' : '⏳ Time is running out!';

        return `${opening}

${urgency}

🎱 Pool: ₹${(poolData?.amount || 0).toLocaleString()} ${this.randomEmoji('money')}
👥 ${poolData?.participants || 0} players competing

${minutesLeft <= 30 ? '⚡ Last chance to join!' : '✅ Still time to get your numbers!'}

₹100-₹20,000 = 2-12 lucky numbers

${this.generateCTA('join')}

${this.generateHashtags()}`;
    }

    // 开奖结果（21:05）
    generateWinnerPost(winners, poolData) {
        const opening = this.generateOpening('winner');
        
        let winnerText = '';
        if (winners && winners.length > 0) {
            const topWinner = winners[0];
            winnerText = `
🥇 1st Prize: ₹${(topWinner.amount || 0).toLocaleString()}
   Winner: @${topWinner.username || 'Player****'}

${winners.length > 1 ? `🥈 2nd Prize winners: ${winners.length - 1}` : ''}`;
        }

        return `${opening}

🏆 ${this.getDayOfWeek()} Draw Results

${winnerText}

💰 Total Pool: ₹${(poolData?.amount || 0).toLocaleString()}
🎉 Congratulations to all winners!

Missed out? Don't worry! 🎮
Play games in ${this.appName} while waiting for tomorrow!

${this.generateCTA('download')}

${this.generateHashtags()}`;
    }

    // 睡前推送（23:00）
    generateNightPost() {
        return `${this.randomEmoji('moon')} Good Night Winners!

🎱 Tomorrow's draw starts fresh at:
💰 Base Pool: ₹1,000
⏰ Draw: 21:00 IST

Set your alarm! ⏰

Before sleep... 🎮
One quick game of Aviator?
Who knows, you might wake up richer! 💰

${this.generateCTA('play')}

Sweet dreams & big wins! ${this.randomEmoji('luck')}

${this.generateHashtags()}`;
    }
}

module.exports = ContentGenerator;
