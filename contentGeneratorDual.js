/**
 * ============================================================
 * 双风格内容生成器 v5.0 - 无分割线优化版
 * ============================================================
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
            luck: ['🍀', '🌟', '✨', '💫', '🎯']
        };
        return this.randomPick(emojis[category] || emojis.fire);
    }

    formatMoney(amount) {
        if (!amount || amount === 0) return '₹0';
        return `₹${amount.toLocaleString('en-IN')}`;
    }

    getTodayName() {
        return new Date().toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    }

    // ============ 频道风格：专业直接 ============
    
    channel_morning(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        
        return `${this.randomEmoji('morning')} Good Morning Champions!

Ready to start your day with a win? Today's Lucky Draw is live!

💰 Current Pool: ${this.formatMoney(poolData.amount)}
👥 Players Joined: ${poolData.participants}
🎁 Daily Cash Prizes via UPI
⏰ Draw Time: 21:00 IST

${poolData.amount > 2000 ? '🔥 Weekend bonus activated! Extra 30% prize boost!' : '✨ Join now for your chance to win real cash!'}

Tap "Join Now" to get your lucky numbers! 👇

${this.gameLink}

#TeenPattiLucky #DailyDraw #WinCash`;
    }

    channel_pool(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        const hoursLeft = 21 - new Date().getHours();
        
        return `${this.randomEmoji('money')} Pool Update!

The prize pool keeps growing! More players = Bigger prizes!

💰 Current Pool: ${this.formatMoney(poolData.amount)}
👥 Active Players: ${poolData.participants}
⏰ Draw in: ${hoursLeft} hours

${hoursLeft <= 3 ? '🔥 FINAL HOURS! Grab your numbers before 21:00 IST!' : '✨ Pool growing fast! Join the action now!'}

Entry Options:
• Free: 1 lucky number
• ₹100: 2 numbers
• ₹500: 4 numbers  
• ₹2000: 6 numbers
• ₹5000: 8 numbers
• ₹20000: 12 VIP numbers

👉 Join Now: ${this.gameLink}

#LuckyDraw #CashPrizes #PlayAndWin`;
    }

    channel_countdown(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        const minutes = data.minutes || 60;
        
        const urgency = minutes <= 30 ? '⏰ FINAL 30 MINUTES!' : 
                       minutes <= 60 ? '🔥 LAST HOUR!' : '⏳ Time is running out!';

        return `${urgency}

The draw is happening soon! Don't miss your chance to win!

🎱 Pool Amount: ${this.formatMoney(poolData.amount)}
👥 ${poolData.participants} players competing

${minutes <= 30 ? '⚡ Last chance to join! Numbers closing soon!' : '✅ Still time to get your lucky numbers!'}

💰 Entry: ₹100 - ₹20,000
🎫 Get 2-12 lucky numbers based on entry

👉 Join Now: ${this.gameLink}

#FinalCall #BigWin #LastChance`;
    }

    channel_winners(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        
        return `${this.randomEmoji('win')} Congratulations Winners!

🏆 Draw Results - ${this.getTodayName()}

💰 Total Pool: ${this.formatMoney(poolData.amount)}
🎉 Winners have been notified!

Missed out? Don't worry! Tomorrow's draw starts fresh at 21:00 IST with a guaranteed ₹1,000 pool!

While you wait, try our games:
✈️ Aviator - Multiplier madness
🐉 Dragon vs Tiger - 50/50 thrills  
🎰 Slots - Progressive jackpots

📲 Play FREE: ${this.gameLink}

#Winners #Congratulations #NextDraw`;
    }

    channel_night(data) {
        return `${this.randomEmoji('morning')} Good Night Winners!

Rest well, champions! Tomorrow brings another chance to win big!

🎱 Tomorrow's Draw Details:
💰 Starting Pool: ₹1,000 guaranteed
⏰ Draw Time: 21:00 IST sharp
✨ Weekend bonus on Sat/Sun (+30% extra)

Set your alarm and join early for the best numbers!

Sweet dreams and see you tomorrow! ${this.randomEmoji('luck')}

${this.gameLink}

#GoodNight #SeeYouTomorrow #DreamBig`;
    }

    // 频道：游戏推荐
    channel_game(data) {
        const gameType = data.gameType || 'aviator';
        
        const games = {
            aviator: {
                name: 'Aviator ✈️',
                tagline: 'Fly High, Cash Out Smart!',
                features: ['100x multiplier potential', 'Cash out anytime', '15-second rounds'],
                tip: 'Watch 3 rounds before betting. Patterns matter!'
            },
            dragon: {
                name: 'Dragon vs Tiger 🐉⚡',
                tagline: 'Fastest Game - 50/50 Thrills!',
                features: ['10-second rounds', '50/50 win chance', '10x payout on tie'],
                tip: 'If Dragon wins 3x in a row, bet on Tiger next!'
            },
            slots: {
                name: 'Wealth Slot 💎',
                tagline: 'Progressive Jackpots Await!',
                features: ['₹5 Lakh+ jackpot', 'Free spin bonuses', 'Multiple paylines'],
                tip: 'Jackpots hit every 2-3 hours. Time your play!'
            },
            chicken: {
                name: 'Chicken Road 🐔',
                tagline: 'Strategy Meets Luck!',
                features: ['7 steps = 10x payout', '15 steps = 100x payout', 'Strategy game'],
                tip: 'Greed gets you killed! Cash out at 7 steps for safety.'
            },
            teenpatti: {
                name: 'Teen Patti 🇮🇳',
                tagline: "India's Favorite Card Game!",
                features: ['1M+ active players', 'Daily tournaments', '₹1 Lakh prize pools'],
                tip: 'Reading opponents is everything. Watch before you bluff!'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${this.randomEmoji('game')} Game Spotlight: ${game.name}

${game.tagline}

Why players LOVE it:
${game.features.map(f => `• ${f}`).join('\n')}

💡 Pro Tip: ${game.tip}

🎮 Play FREE while waiting for the draw!

${this.gameLink}

#${gameType === 'dragon' ? 'DragonVsTiger' : gameType === 'aviator' ? 'Aviator' : gameType === 'slots' ? 'Slots' : gameType === 'chicken' ? 'ChickenRoad' : 'TeenPatti'} #WinBig #PlayAndWin`;
    }

    // ============ 群组风格：社群互动 ============

    group_morning(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        const greetings = ['Morning', 'Good morning', 'Rise and shine', 'What\'s up'];
        
        return `${this.randomPick(greetings)} everyone! ☀️

Let's go! It's ${this.getTodayName()} and the pool is already looking good 👀

Today's numbers:
💰 Pool: ${this.formatMoney(poolData.amount)}
⏰ Draw: 9 PM IST

What are you up to today? Drop a 🔥 if you're ready!

How's everyone doing? Been playing any games while waiting?

Catch you all later! 👋`;
    }

    group_pool(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        const reactions = ['Pool is getting JUICY 🔥', 'Numbers looking good today 👀', 'The pot is stacking up nicely'];

        return `${this.randomPick(reactions)}

Current stats:
💰 ${this.formatMoney(poolData.amount)}
👥 ${poolData.participants} players in

NGL the energy today feels different

Feeling lucky today? How's your luck been?

Been a minute since I hit something big. Manifesting it for tonight ✨`;
    }

    group_countdown(data) {
        const poolData = data.poolData || { amount: 0, participants: 0 };
        const minutes = data.minutes || 60;
        
        const urgency = minutes <= 30 ? 
            'Okay this is it. Final half hour. No cap.' :
            minutes <= 60 ? 
            'One hour left. The tension is real.' :
            'Getting close now...';

        return `${urgency}

Pool sitting at ${this.formatMoney(poolData.amount)}

Let's goooo! 🔥

Who's feeling lucky? Drop a 🍀

Fingers crossed for everyone! 🤞`;
    }

    group_winners(data) {
        const poolData = data.poolPool || { amount: 0 };
        
        return `DRAW DONE! Let's goooo! 🔥

🏆 Shoutout to today's winners!

Big win today was around ${this.formatMoney(poolData.amount * 0.4)} 👀

For everyone else - your time is coming! Consistency wins in the end

Who's already in for tomorrow? 👀`;
    }

    group_night(data) {
        return `Calling it a night! 🌙

Tomorrow's draw resets at 9 PM
Fresh start, fresh luck ✨

How's everyone doing? What are you up to?

Sweet dreams and big wins! 

See you all tomorrow 👋`;
    }

    // 群组：游戏推荐
    group_game(data) {
        const gameType = data.gameType || 'aviator';
        
        const games = {
            aviator: {
                hook: 'Okay so I tried Aviator for the first time yesterday...',
                vibe: 'The rush when that plane takes off is INSANE',
                tip: 'Started small (₹50) and cashed at 2x. Small wins add up!',
                ask: 'Who else plays this? What\'s your strategy?'
            },
            dragon: {
                hook: 'Quick game between meetings? Say less.',
                vibe: '10 seconds and you know. Love the speed.',
                tip: 'Saw someone hit 10x on a tie yesterday. Wild.',
                ask: 'Dragon or Tiger - what\'s your pick usually?'
            },
            slots: {
                hook: 'The jackpot on Wealth Slot right now is CRAZY',
                vibe: 'Just watching the numbers go up is addictive lol',
                tip: 'Free spins during bonus rounds are where it\'s at',
                ask: 'Anyone hit big on slots recently? Share your story!'
            },
            chicken: {
                hook: 'This game is actually genius',
                vibe: '7 steps = sweet spot. 10x and you\'re out. Clean.',
                tip: 'Greed gets you killed. Literally. Cash out at 7!',
                ask: 'How far do you usually go before chickening out? 😅'
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

    // ============ 主生成接口 ============
    
    generate(type, target, data = {}) {
        const prefix = target === 'group' ? 'group' : 'channel';
        const methodName = `${prefix}_${type}`;
        
        if (typeof this[methodName] === 'function') {
            return this[methodName](data);
        }
        
        // 默认返回早安
        return this.channel_morning(data);
    }
}

module.exports = ContentGeneratorDual;
