/**
 * ============================================================
 * 双风格内容生成器 (contentGeneratorDual.js)
 * ============================================================
 * 
 * 频道 @telltest222：广告风格（专业、清晰、直接推销）
 * 群组 @tkgfg：社群风格（自然、朋友式、互动）
 */

class ContentGeneratorDual {
    constructor(config) {
        this.config = config;
        this.botName = config.BOT_NAME || 'TeenPatti Lucky Bot';
        this.appName = config.APP_NAME || 'TeenPatti Master';
        this.channelId = config.CHANNEL_ID;
        this.groupId = config.GROUP_ID;
        this.gameLink = config.GAME_LINK || 'https://t.me/yourbot';
    }

    // ============ 通用工具 ============
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

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

    formatMoney(amount) {
        return `₹${amount.toLocaleString('en-IN')}`;
    }

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

    getTodayName() {
        return new Date().toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    }

    // ============ 频道风格：广告/专业 ============
    
    // 频道：早安开启
    channelMorning(poolData) {
        const divider = this.getDivider('star');
        
        return `${this.randomEmoji('morning')} *Good Morning Winners!*

${divider}

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

📲 [Download ${this.appName}](${this.gameLink})

#TeenPattiMaster #LuckyDraw #WinBig`;
    }

    // 频道：游戏推荐
    channelGamePost(gameType) {
        const divider = this.getDivider('fire');
        
        const games = {
            aviator: {
                title: 'Aviator ✈️',
                features: ['100x multiplier', 'Cash out anytime', '15-sec rounds'],
                highlight: 'High stakes, high rewards!'
            },
            dragon: {
                title: 'Dragon vs Tiger 🐉⚡',
                features: ['10-sec rounds', '50/50 chance', '10x on tie'],
                highlight: 'Fastest game - perfect for quick wins!'
            },
            slots: {
                title: 'Wealth Slot 💎',
                features: ['Progressive jackpot', 'Free spins', 'Bonus rounds'],
                highlight: `Current jackpot: ${this.formatMoney(500000)}+!`
            },
            chicken: {
                title: 'Chicken Road 🐔',
                features: ['7 steps = 10x', '15 steps = 100x', 'Strategy game'],
                highlight: 'Most addictive game this month!'
            },
            teenpatti: {
                title: 'Teen Patti 🇮🇳',
                features: ['1M+ players', 'Tournaments', '₹1 Lakh pools'],
                highlight: 'India\'s favorite card game!'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${this.randomEmoji('game')} *GAME SPOTLIGHT: ${game.title}*

${divider}

*Why players LOVE it:*
${game.features.map(f => `• _${f}_`).join('\n')}

${this.randomEmoji('win')} *${game.highlight}*

${divider}

🎮 [Play FREE](${this.gameLink})

#${gameType === 'dragon' ? 'DragonVsTiger' : gameType === 'aviator' ? 'Aviator' : 'Slots'} #WinBig`;
    }

    // 频道：技巧攻略
    channelTipsPost() {
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
📲 [Download Now](${this.gameLink})

#ProTips #WinningStrategy`;
    }

    // 频道：奖池更新
    channelPoolUpdate(poolData) {
        const divider = this.getDivider('money');
        const hoursLeft = 21 - new Date().getHours();
        
        return `${this.randomEmoji('money')} *POOL UPDATE*

${divider}

${this.randomEmoji('money')} *Pool Amount:* \`${this.formatMoney(poolData?.amount || 0)}\`
👥 *Players:* \`${poolData?.participants || 0}\`
⏰ *Draw in:* \`${hoursLeft} hours\`

${divider}

${hoursLeft <= 3 ? `${this.randomEmoji('fire')} *FINAL HOURS!* Don't miss out!` : '*Pool growing fast!* 🔥'}

${this.randomEmoji('game')} *Bored waiting? Play our games!*

✈️ _Aviator_ | 🐉 _Dragon vs Tiger_ | 🎰 _Slots_

${divider}

👉 [Join Now](${this.gameLink})

#LuckyDraw #PlayAndWin`;
    }

    // 频道：倒计时
    channelCountdown(minutesLeft, poolData) {
        const divider = this.getDivider('time');
        const urgency = minutesLeft <= 30 ? '⏰ *FINAL 30 MINUTES!*' : 
                       minutesLeft <= 60 ? '🔥 *LAST HOUR!*' : '⏳ *Time is running out!*';

        return `${urgency}

${divider}

🎱 *Pool:* \`${this.formatMoney(poolData?.amount || 0)}\` ${this.randomEmoji('money')}
👥 *\`${poolData?.participants || 0}\` players competing*

${minutesLeft <= 30 ? '⚡ *Last chance to join!*' : '✅ *Still time to get your numbers!*'}

${divider}

💰 *₹100-₹20,000 = 2-12 lucky numbers*

${divider}

👉 [Join Now](${this.gameLink})

#FinalCall #BigWin`;
    }

    // 频道：开奖结果
    channelWinners(poolData) {
        const divider = this.getDivider('star');
        
        return `${this.randomEmoji('win')} *CONGRATULATIONS!*

${divider}

🏆 *DRAW RESULTS - ${this.getTodayName().toUpperCase()}*

💰 *Total Pool: ${this.formatMoney(poolData?.amount || 0)}*
🎉 *Congratulations to all winners!*

${divider}

*Missed out? Don't worry!* 🎮
Play games in ${this.appName} while waiting for tomorrow!

${divider}

📲 [Download ${this.appName}](${this.gameLink})

#Winners #Congratulations`;
    }

    // 频道：睡前
    channelNight() {
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

🎰 [Play FREE](${this.gameLink})

${divider}

*Sweet dreams & big wins!* ${this.randomEmoji('luck')}

#GoodNight #DreamBig`;
    }

    // ============ 群组风格：社群/朋友 ============

    // 群组：早安开启
    groupMorning(poolData) {
        const greetings = ['Morning', 'Good morning', 'Rise and shine'];
        const slang = ['Let\'s goooo', 'Here we go', 'Fire'];
        
        return `${this.randomPick(greetings)} everyone! ☀️

${this.randomPick(slang)}! It's ${this.getTodayName()} and the pool is already looking good 👀

*Today's numbers:*
💰 Pool: \`${this.formatMoney(poolData?.amount || 0)}\`
⏰ Draw: \`9 PM IST\`

What are you up to today? Drop a 🔥 if you're ready!

Been playing any games while waiting? The Chicken Road update is wild 🐔

Catch you all later! 👋`;
    }

    // 群组：游戏推荐
    groupGamePost(gameType) {
        const games = {
            aviator: {
                hook: 'Okay so I tried Aviator for the first time yesterday...',
                vibe: 'The rush when that plane takes off is something else',
                tip: 'Started small (₹50) and cashed at 2x. Small wins add up!',
                ask: 'Who else plays this?'
            },
            dragon: {
                hook: 'Quick game between meetings? Say less.',
                vibe: '10 seconds and you know. Love the speed.',
                tip: 'Saw someone hit 10x on a tie yesterday. Wild.',
                ask: 'Dragon or Tiger - what\'s your pick usually?'
            },
            slots: {
                hook: 'The jackpot on Wealth Slot right now is INSANE',
                vibe: 'Just watching the numbers go up is addictive lol',
                tip: 'Free spins during bonus rounds are where it\'s at',
                ask: 'Anyone hit big on slots recently?'
            },
            chicken: {
                hook: 'This game is actually genius',
                vibe: '7 steps = sweet spot. 10x and you\'re out. Clean.',
                tip: 'Greed gets you killed. Literally. Ask me how I know 😅',
                ask: 'How far do you usually go?'
            },
            teenpatti: {
                hook: 'The OG. Nothing beats a good Teen Patti session.',
                vibe: 'Bluffing your way through is an art form',
                tip: 'Reading the table is everything. Watch more, play smart.',
                ask: 'Who\'s got the best poker face here? 🃏'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${game.hook}

${game.vibe}

TBH ${game.tip}

${game.ask}

Drop your strategies below 👇 Always learning from you guys!`;
    }

    // 群组：技巧
    groupTipsPost() {
        const setups = [
            'So I\'ve been playing for a while now and...',
            'Real talk - saw someone lose big today because...',
            'Small wins > big losses. Every time.'
        ];

        const tips = [
            'The 3-round rule on Aviator actually works. Watch before you play.',
            'Chasing losses is the fastest way to zero. Set a limit. Stick to it.',
            'Cash out at 2x on Aviator. Boring but profitable.'
        ];

        const reactions = [
            'Saved me so many times.',
            'Hard to do in the moment but so important.',
            'Not as exciting but my balance thanks me.'
        ];

        const asks = [
            'What\'s your go-to strategy?',
            'How do you stay disciplined?',
            'Are you team "play safe" or team "go big"?'
        ];

        const i = Math.floor(Math.random() * setups.length);

        return `${setups[i]}

_${tips[i]}_

${reactions[i]}

${asks[i]}

Sharing is caring! Drop your wisdom below 👇`;
    }

    // 群组：奖池更新
    groupPoolUpdate(poolData) {
        const reactions = [
            'Pool is getting JUICY 🔥',
            'Numbers looking good today 👀',
            'The pot is stacking up nicely'
        ];

        return `${this.randomPick(reactions)}

Current stats:
💰 \`${this.formatMoney(poolData?.amount || 0)}\`
👥 \`${poolData?.participants || 0}\` players in

NGL the energy today feels different

Feeling lucky today? How's your luck been?

Been a minute since I hit something big. Manifesting it for tonight ✨`;
    }

    // 群组：倒计时
    groupCountdown(minutesLeft, poolData) {
        const urgency = minutesLeft <= 30 ? 
            'Okay this is it. Final half hour. No cap.' :
            minutesLeft <= 60 ? 
            'One hour left. The tension is real.' :
            'Getting close now...';

        return `${urgency}

Pool sitting at \`${this.formatMoney(poolData?.amount || 0)}\`

${this.randomPick(['Let\'s goooo!', 'Fire!', 'Vibes!'])}

Who\'s feeling lucky? Drop a 🍀

Fingers crossed for everyone! 🤞`;
    }

    // 群组：开奖结果
    groupWinners(poolData) {
        return `DRAW DONE! ${this.randomPick(['Let\'s goooo', 'Fire', 'Insane'])}!

🏆 Shoutout to today\'s winners!

Big win today was around ${this.formatMoney(poolData?.amount * 0.4 || 0)} 👀

For everyone else - your time is coming! NGL consistency wins in the end

Who\'s already in for tomorrow? 👀`;
    }

    // 群组：睡前
    groupNight() {
        return `Calling it a night! 🌙

Tomorrow's draw resets at 9 PM
Fresh start, fresh luck ✨

How\'s everyone doing? What are you up to?

Sweet dreams and big wins! 

See you all tomorrow 👋`;
    }

    // ============ 统一接口 ============
    
    generate(type, target, data) {
        // target: 'channel' 或 'group'
        const prefix = target === 'group' ? 'group' : 'channel';
        
        const generators = {
            morning: () => this[`${prefix}Morning`](data),
            game: () => this[`${prefix}GamePost`](data?.gameType || 'aviator'),
            tips: () => this[`${prefix}TipsPost`](data),
            pool: () => this[`${prefix}PoolUpdate`](data),
            countdown: () => this[`${prefix}Countdown`](data?.minutes || 60, data?.poolData),
            winners: () => this[`${prefix}Winners`](data),
            night: () => this[`${prefix}Night`](data)
        };

        const generator = generators[type];
        if (!generator) {
            console.error(`[ContentGenerator] Unknown type: ${type}`);
            return '';
        }

        return generator();
    }
}

module.exports = ContentGeneratorDual;
