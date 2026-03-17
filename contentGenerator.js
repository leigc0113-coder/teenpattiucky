/**
 * ============================================================
 * AI 社群内容生成器 v3.0 - 真实社群风格
 * ============================================================
 * 
 * 核心设计理念：
 * - 像朋友聊天，不像广告
 * - 真实、自然、有温度
 * - 引发互动和讨论
 * - 建立社群归属感
 */

class ContentGenerator {
    constructor(config) {
        this.config = config;
        this.botName = config.BOT_NAME || 'TeenPatti Lucky Bot';
        this.appName = config.APP_NAME || 'TeenPatti Master';
        this.channelId = config.CHANNEL_ID;
        this.gameLink = config.GAME_LINK || 'https://t.me/yourbot';
        
        // 社群经理人设
        this.managerNames = ['Rahul', 'Vikram', 'Amit', 'Priya'];
        this.managerName = this.randomPick(this.managerNames);
    }

    // 随机选择
    randomPick(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 问候语（根据时间）
    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return this.randomPick(['Morning', 'Good morning', 'Rise and shine']);
        if (hour < 17) return this.randomPick(['Afternoon', 'Hey there', 'What\'s up']);
        if (hour < 21) return this.randomPick(['Evening', 'Hey guys', 'What\'s going on']);
        return this.randomPick(['Night', 'Hey night owls', 'Still awake']);
    }

    // 口语化表达
    getCasualPhrase() {
        return this.randomPick([
            'TBH', 'NGL', 'Tbh', 'Honestly', 'Real talk',
            'Lowkey', 'Highkey', 'Not gonna lie', 'Between us'
        ]);
    }

    // 引发互动的问句
    getEngagementQuestion(topic) {
        const questions = {
            game: [
                'What\'s your go-to game?',
                'Which one do you play most?',
                'Team Aviator or Team Dragon?',
                'Slots or cards - what\'s your vibe?'
            ],
            strategy: [
                'What\'s your secret move?',
                'How do you usually play?',
                'Any tips to share with the squad?',
                'What works for you?'
            ],
            luck: [
                'Feeling lucky today?',
                'How\'s your luck been?',
                'Big win recently?',
                'When did you last hit?'
            ],
            general: [
                'Who\'s online?',
                'What are you up to?',
                'How\'s everyone doing?',
                'Any plans for today?'
            ]
        };
        return this.randomPick(questions[topic] || questions.general);
    }

    // 真实用户语气
    getUserVoice() {
        return this.randomPick([
            'just dropped',
            'checked in',
            'popped in',
            'hopped on',
            'came by'
        ]);
    }

    // 社群俚语
    getSlang() {
        return this.randomPick([
            'Let\'s goooo', 'Here we go', 'Let\'s get it',
            'Fire', 'Lit', 'Crazy', 'Insane',
            'Vibes', 'Mood', 'Energy'
        ]);
    }

    // 早安开启 - 社群风格
    generateMorningPost(poolData) {
        const greeting = this.getGreeting();
        const day = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
        
        return `${greeting} everyone! ☀️

${this.getSlang()}! It's ${day} and the pool is already looking good 👀

*Today's numbers:*
💰 Pool: \`${this.formatMoney(poolData?.amount || 0)}\`
⏰ Draw: \`9 PM IST\`

${this.getEngagementQuestion('general')} Drop a 🔥 if you're ready!

Been playing any games while waiting? The new Chicken Road update is wild 🐔

Catch you all later! 👋`;
    }

    // 游戏推荐 - 朋友推荐风格
    generateGamePost(gameType, winData) {
        const games = {
            aviator: {
                name: 'Aviator',
                hook: 'Okay so I tried Aviator for the first time yesterday...',
                vibe: 'The rush when that plane takes off is something else',
                tip: 'Started small (₹50) and cashed at 2x. Small wins add up!',
                comment: 'Who else plays this?'
            },
            dragon: {
                name: 'Dragon vs Tiger',
                hook: 'Quick game between meetings? Say less.',
                vibe: '10 seconds and you know. Love the speed.',
                tip: 'Saw someone hit 10x on a tie yesterday. Wild.',
                comment: 'Dragon or Tiger - what\'s your pick usually?'
            },
            slots: {
                name: 'Slots',
                hook: 'The jackpot on Wealth Slot right now is INSANE',
                vibe: 'Just watching the numbers go up is addictive lol',
                tip: 'Free spins during bonus rounds are where it\'s at',
                comment: 'Anyone hit big on slots recently?'
            },
            chicken: {
                name: 'Chicken Road',
                hook: 'This game is actually genius',
                vibe: '7 steps = sweet spot. 10x and you\'re out. Clean.',
                tip: 'Greed gets you killed. Literally. Ask me how I know 😅',
                comment: 'How far do you usually go?'
            },
            teenpatti: {
                name: 'Teen Patti',
                hook: 'The OG. Nothing beats a good Teen Patti session.',
                vibe: 'Bluffing your way through is an art form',
                tip: 'Reading the table is everything. Watch more, play smart.',
                comment: 'Who\'s got the best poker face here? 🃏'
            }
        };

        const game = games[gameType] || games.aviator;

        return `${game.hook}

${game.vibe}

${this.getCasualPhrase()} ${game.tip}

${game.comment}

Drop your strategies below 👇 Always learning from you guys!`;
    }

    // 午休技巧 - 分享经验风格
    generateTipsPost() {
        const tips = [
            {
                setup: 'So I\'ve been playing for a while now and...',
                tip: 'The 3-round rule on Aviator actually works. Watch before you play.',
                reaction: 'Saved me so many times.',
                ask: 'What\'s your go-to strategy?'
            },
            {
                setup: 'Real talk - saw someone lose big today because...',
                tip: 'Chasing losses is the fastest way to zero. Set a limit. Stick to it.',
                reaction: 'Hard to do in the moment but so important.',
                ask: 'How do you stay disciplined?'
            },
            {
                setup: 'Small wins > big losses. Every time.',
                tip: 'Cash out at 2x on Aviator. Boring but profitable.',
                reaction: 'Not as exciting but my balance thanks me.',
                ask: 'Are you team "play safe" or team "go big"?'
            },
            {
                setup: 'Between us... 👀',
                tip: 'Dragon vs Tiger patterns are real. 3 in a row = switch coming.',
                reaction: 'Don\'t tell everyone though 😅',
                ask: 'What patterns have you noticed?'
            }
        ];

        const t = this.randomPick(tips);

        return `${t.setup}

_${t.tip}_

${t.reaction}

${t.ask}

Sharing is caring! Drop your wisdom below 👇`;
    }

    // 奖池更新 - 社群讨论风格
    generatePoolUpdate(poolData) {
        const reactions = [
            'Pool is getting JUICY 🔥',
            'Numbers looking good today 👀',
            'The pot is stacking up nicely',
            'Today might be THE day'
        ];

        return `${this.randomPick(reactions)}

Current stats:
💰 \`${this.formatMoney(poolData?.amount || 0)}\`
👥 \`${poolData?.participants || 0}\` players in

${this.getCasualPhrase()} the energy today feels different

${this.getEngagementQuestion('luck')}

Been a minute since I hit something big. Manifesting it for tonight ✨`;
    }

    // 倒计时 - 紧张但不推销
    generateCountdown(minutesLeft, poolData) {
        const urgency = minutesLeft <= 30 ? 
            'Okay this is it. Final half hour. No cap.' :
            minutesLeft <= 60 ? 
            'One hour left. The tension is real.' :
            'Getting close now...';

        return `${urgency}

Pool sitting at \`${this.formatMoney(poolData?.amount || 0)}\`

${this.getSlang()}!

Who's feeling lucky? Drop a 🍀

Fingers crossed for everyone! 🤞`;
    }

    // 开奖结果 - 庆祝社群风格
    generateWinnerPost(winners, poolData) {
        let winnerText = '';
        if (winners && winners.length > 0) {
            winnerText = `
🏆 Shoutout to today's winners!

Biggest win: ${this.formatMoney(winners[0].amount || 0)}
To whoever that was - enjoy it! 🎉`;
        }

        return `DRAW DONE! ${this.getSlang()}!

${winnerText}

For everyone else - your time is coming! ${this.getCasualPhrase()} consistency wins in the end

Who's already in for tomorrow? 👀`;
    }

    // 睡前推送 - 轻松告别
    generateNightPost() {
        return `Calling it a night! 🌙

Tomorrow's draw resets at 9 PM
Fresh start, fresh luck ✨

${this.getEngagementQuestion('general')}

Sweet dreams and big wins! 

See you all tomorrow 👋`;
    }

    // 大赢家晒单 - 真实分享风格
    generateWinnerStory() {
        const stories = [
            {
                player: 'Rahul from Mumbai',
                story: 'Started with FREE entry. Lost first 3 days. Then hit ₹10K on day 5.',
                lesson: 'Patience pays off. Literally.'
            },
            {
                player: 'Priya',
                story: '₹500 on Aviator. Cashed at 25x. Walked away with ₹12.5K.',
                lesson: 'Knew when to stop. That\'s the real win.'
            },
            {
                player: 'Some random guy',
                story: 'Hit the jackpot on slots while waiting for his tea.',
                lesson: 'Luck hits when you least expect it 😅'
            }
        ];

        const s = this.randomPick(stories);

        return `Love this story from ${s.player}:

"${s.story}"

${s.lesson}

Your turn next? 👀

Share your wins! We celebrate everything here 🎉`;
    }

    // 游戏技巧 + 紧迫感 - 自然风格
    generateTipsUrgency() {
        return `Quick one before the draw 👇

Been watching Aviator patterns today. Something's brewing.

_${this.getCasualPhrase()} if you're playing, watch the first 3 rounds first._

Thank me later 😉

Who's already got their numbers for tonight?`;
    }

    // 明日预告 - 轻松预告
    generateTomorrowPreview() {
        return `That's a wrap for today! 

Tomorrow:
• Fresh pool starting ₹1,000
• 9 PM draw
• Hopefully better luck for all of us 😅

${this.getSlang()} for tomorrow!

Rest up everyone 💪`;
    }

    // 最后冲刺 - 自然提醒
    generateFinalPush() {
        return `Last call people!

If you were thinking about joining today... well... now's the time ⏰

No pressure though 😄

Good luck to everyone in the draw! 🤞`;
    }

    // 开奖前提醒 - 轻松提醒
    generatePreDrawReminder() {
        return `30 minutes out!

Just saying... if you forgot to join today, this is your reminder 😅

Pool's looking healthy though 🔥

${this.getSlang()} everyone!`;
    }

    formatMoney(amount) {
        return `₹${amount.toLocaleString('en-IN')}`;
    }
}

module.exports = ContentGenerator;
