/**
 * ============================================================
 * 多语言菜单内容 (menuContent.i18n.js)
 * ============================================================
 * 
 * 支持自动语言检测：
 * - 默认：英文 (en)
 * - 可选：中文 (zh)
 * - 可根据用户 Telegram 语言自动切换
 */

const MenuContent = {
    
    // 检测用户语言 - 强制返回英文
    getUserLanguage(user) {
        // 强制使用英文
        return 'en';
    },

    // 获取内容
    get(key, lang = 'en') {
        const content = this[key];
        if (!content) return null;
        
        if (typeof content === 'object' && content[lang]) {
            return content[lang];
        }
        
        // 如果指定语言不存在，返回英文
        if (typeof content === 'object' && content['en']) {
            return content['en'];
        }
        
        return content;
    },

    // ==================== 主菜单 ====================
    mainMenu: {
        en: {
            title: '🎰 *Teen Patti Lucky Draw*',
            subtitle: '━━━━━━━━━━━━━━━━━━━',
            description: '💰 Win Real Cash Daily!\n🎁 FREE Lottery Numbers!',
            buttons: [
                [{ text: '🎯 How to Play', callback_data: 'menu_how_to_play' }],
                [{ text: '💰 Pool & Prizes', callback_data: 'menu_pool_rules' }],
                [{ text: '🎁 Numbers & Tiers', callback_data: 'menu_numbers_guide' }],
                [{ text: '👥 Invite Friends', callback_data: 'menu_invite_guide' }],
                [{ text: '📊 Platform Stats', callback_data: 'menu_platform_stats' }],
                [{ text: '⚖️ Rules & Help', callback_data: 'menu_help_center' }],
                [{ text: '🚀 Join Now', callback_data: 'menu_join_now' }]
            ]
        },
        zh: {
            title: '🎰 *Teen Patti 幸运抽奖*',
            subtitle: '━━━━━━━━━━━━━━━━━━━',
            description: '💰 每日赢取真实现金！\n🎁 免费抽奖号码！',
            buttons: [
                [{ text: '🎯 如何参与', callback_data: 'menu_how_to_play' }],
                [{ text: '💰 奖池与奖金', callback_data: 'menu_pool_rules' }],
                [{ text: '🎁 号码与等级', callback_data: 'menu_numbers_guide' }],
                [{ text: '👥 邀请好友', callback_data: 'menu_invite_guide' }],
                [{ text: '📊 平台数据', callback_data: 'menu_platform_stats' }],
                [{ text: '⚖️ 规则与帮助', callback_data: 'menu_help_center' }],
                [{ text: '🚀 立即参与', callback_data: 'menu_join_now' }]
            ]
        }
    },

    // ==================== 1. 如何参与 ====================
    howToPlay: {
        en: {
            title: '🎯 How to Play',
            content: 
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📱 *Step 1: Choose Method*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '🎁 *FREE Entry*\n' +
                '└ Get 1 FREE number\n' +
                '└ Just send Game ID\n\n' +
                '💰 *Recharge Entry*\n' +
                '└ Get 2-12 numbers\n' +
                '└ Send screenshot\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📸 *Step 2: Submit*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*FREE:* Send Game ID (7 digits)\n\n' +
                '*Recharge:*\n' +
                '1. Select amount\n' +
                '2. Recharge in game\n' +
                '3. Screenshot payment\n' +
                '4. Send screenshot + Game ID\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '⏰ *Step 3: Wait Review*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• Review time: 5-30 min\n' +
                '• Working: 24/7\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎉 *Step 4: Get Numbers*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• Numbers auto sent\n' +
                '• Auto join 21:00 draw\n' +
                '• Prize within 48h\n\n' +
                '⚠️ *Limit: One entry per user*',
            buttons: [
                [{ text: '🚀 Join Now', callback_data: 'action_join_now' }],
                [{ text: '💰 Recharge Tiers', callback_data: 'menu_recharge_tiers' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '🎯 如何参与',
            content: 
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📱 *第1步：选择方式*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '🎁 *免费参与*\n' +
                '└ 获得1个免费号码\n' +
                '└ 只需发送Game ID\n\n' +
                '💰 *充值参与*\n' +
                '└ 获得2-12个号码\n' +
                '└ 发送充值截图\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📸 *第2步：提交资料*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*免费：*发送Game ID（7位数字）\n\n' +
                '*充值：*\n' +
                '1. 选择档位\n' +
                '2. 在游戏内充值\n' +
                '3. 截图支付页面\n' +
                '4. 发送截图+Game ID\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '⏰ *第3步：等待审核*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• 审核时间：5-30分钟\n' +
                '• 工作时间：全天24小时\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎉 *第4步：获取号码*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• 号码自动发放\n' +
                '• 自动参与21:00开奖\n' +
                '• 奖金48小时内到账\n\n' +
                '⚠️ *注意：每人限参与一次*',
            buttons: [
                [{ text: '🚀 立即参与', callback_data: 'action_join_now' }],
                [{ text: '💰 查看充值档位', callback_data: 'menu_recharge_tiers' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // ==================== 2. 奖池与奖金规则 ====================
    poolRules: {
        en: {
            title: '💰 Pool & Prize Rules',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📊 *Pool Structure*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                'Pool consists of:\n\n' +
                '1️⃣ *Base Guarantee*\n' +
                '   └ Daily ₹1,000\n\n' +
                '2️⃣ *User Contribution*\n' +
                '   ├ Bronze: 15% of recharge\n' +
                '   └ Silver+: 10% of recharge\n\n' +
                '3️⃣ *Weekend Bonus*\n' +
                '   └ Extra +30% (Sat-Sun)\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🏆 *Prize Distribution*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*80%* of pool for prizes:\n\n' +
                '🥇 *1st Prize*: 40% of pool\n' +
                '   └ 1 winner\n\n' +
                '🥈 *2nd Prize*: 20% of pool\n' +
                '   └ 2 winners\n\n' +
                '🥉 *3rd Prize*: 20% of pool\n' +
                '   └ Remaining winners\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎯 *Winning Mechanism*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• Draw: Daily 21:00 IST\n' +
                '• Min 10 numbers to draw\n' +
                '• Win rate: ~5% (max 20)\n' +
                '• Higher weight = higher chance\n' +
                '• Fair & verifiable algorithm',
            buttons: [
                [{ text: '📈 Current Pool', callback_data: 'action_current_pool' }],
                [{ text: '📊 Stats', callback_data: 'menu_platform_stats' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '💰 奖池与奖金规则',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📊 *奖池构成*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '奖池由三部分组成：\n\n' +
                '1️⃣ *基础保底*\n' +
                '   └ 每日固定 ₹1,000\n\n' +
                '2️⃣ *用户贡献*\n' +
                '   ├ Bronze等级：充值15%\n' +
                '   └ Silver+等级：充值10%\n\n' +
                '3️⃣ *周末加成*\n' +
                '   └ 周六日额外+30%\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🏆 *奖金分配*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '奖池的 *80%* 用于奖金：\n\n' +
                '🥇 *一等奖*：40%\n' +
                '   └ 1人独得\n\n' +
                '🥈 *二等奖*：20%\n' +
                '   └ 2人平分\n\n' +
                '🥉 *三等奖*：20%\n' +
                '   └ 剩余中奖者平分\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎯 *中奖机制*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• 开奖时间：每日21:00 IST\n' +
                '• 最低10个号码开奖\n' +
                '• 中奖率：约5%（最多20人）\n' +
                '• 权重越高，中奖概率越大\n' +
                '• 公平可验证的算法',
            buttons: [
                [{ text: '📈 当前奖池', callback_data: 'action_current_pool' }],
                [{ text: '📊 数据统计', callback_data: 'menu_platform_stats' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // ==================== 3. 号码与等级指南（更新后）====================
    numbersGuide: {
        en: {
            title: '🎁 Numbers & Tier System',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎫 *Number Types*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                'Number tier = Winning weight:\n\n' +
                '🎁 *FREE* - Free Number\n' +
                '   └ Count: 1\n' +
                '   └ Weight: 1x\n\n' +
                '⭐ *Silver* - Silver Number\n' +
                '   └ Count: 2-3\n' +
                '   └ Weight: 2-3x\n\n' +
                '⭐⭐ *Gold* - Gold Number\n' +
                '   └ Count: 4-5\n' +
                '   └ Weight: 4-5x\n\n' +
                '⭐⭐⭐ *Diamond* - Diamond\n' +
                '   └ Count: 6-7\n' +
                '   └ Weight: 6-7x\n\n' +
                '👑 *Crown* - Crown Number\n' +
                '   └ Count: 8-10\n' +
                '   └ Weight: 8-10x\n\n' +
                '👑👑 *VIP* - VIP Number\n' +
                '   └ Count: 12\n' +
                '   └ Weight: 12x\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🏆 *Tier System (Everyone Has)*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '6 Tiers by total recharge:\n\n' +
                '🥉 Bronze - ₹0\n' +
                '🥈 Silver - ₹5,000\n' +
                '🥇 Gold - ₹15,000\n' +
                '💎 Platinum - ₹50,000\n' +
                '💠 Diamond - ₹120,000\n' +
                '🌟 Star - ₹300,000\n\n' +
                '*Auto-upgrade on threshold*\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '💡 *How to Get Numbers*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '✅ Register: 1 FREE\n' +
                '✅ Check-in: 0.1-1 daily\n' +
                '✅ Invite: 2 per friend\n' +
                '✅ Recharge: 2-12 numbers',
            buttons: [
                [{ text: '👤 My Tier', callback_data: 'action_my_account' }],
                [{ text: '💰 Get Numbers', callback_data: 'action_join_recharge' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '🎁 号码与等级系统',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎫 *号码类型*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '号码等级决定中奖权重：\n\n' +
                '🎁 *FREE* - 免费号码\n' +
                '   └ 数量: 1个\n' +
                '   └ 权重: 1x\n\n' +
                '⭐ *Silver* - 白银号码\n' +
                '   └ 数量: 2-3个\n' +
                '   └ 权重: 2-3x\n\n' +
                '⭐⭐ *Gold* - 黄金号码\n' +
                '   └ 数量: 4-5个\n' +
                '   └ 权重: 4-5x\n\n' +
                '⭐⭐⭐ *Diamond* - 钻石号码\n' +
                '   └ 数量: 6-7个\n' +
                '   └ 权重: 6-7x\n\n' +
                '👑 *Crown* - 皇冠号码\n' +
                '   └ 数量: 8-10个\n' +
                '   └ 权重: 8-10x\n\n' +
                '👑👑 *VIP* - VIP号码\n' +
                '   └ 数量: 12个\n' +
                '   └ 权重: 12x\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🏆 *等级系统（人人有份）*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '6个等级按累计充值：\n\n' +
                '🥉 Bronze - ₹0\n' +
                '🥈 Silver - ₹5,000\n' +
                '🥇 Gold - ₹15,000\n' +
                '💎 Platinum - ₹50,000\n' +
                '💠 Diamond - ₹120,000\n' +
                '🌟 Star - ₹300,000\n\n' +
                '*达到门槛自动升级*\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '💡 *如何获得号码*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '✅ 注册：1个 FREE\n' +
                '✅ 签到：每日 0.1-1个\n' +
                '✅ 邀请：每个朋友2个\n' +
                '✅ 充值：2-12个号码',
            buttons: [
                [{ text: '👤 我的等级', callback_data: 'action_my_account' }],
                [{ text: '💰 获取号码', callback_data: 'action_join_recharge' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // ==================== 4. 邀请好友指南 ====================
    inviteGuide: {
        en: {
            title: '👥 Invite Friends',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎁 *Invite Rewards*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                'Invite friends, win together!\n\n' +
                '✅ *Friend Registers*\n' +
                '   └ You get: 2 Silver ⭐⭐\n\n' +
                '✅ *Friend Recharges ≥₹100*\n' +
                '   └ You get: 2 Gold ⭐⭐\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📱 *How to Invite*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '1️⃣ Click "Invite Friends"\n' +
                '2️⃣ Copy your invite link\n' +
                '3️⃣ Share (WhatsApp/Telegram)\n' +
                '4️⃣ Friend registers via link\n' +
                '5️⃣ Reward auto-sent on approval\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '💡 *Tips*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• Share with game lovers\n' +
                '• Highlight FREE entry\n' +
                '• Show your win history\n' +
                '• More invites = more rewards\n\n' +
                '🚫 No cheating or fake accounts',
            buttons: [
                [{ text: '🔗 My Invite Link', callback_data: 'action_invite_friends' }],
                [{ text: '📊 My Stats', callback_data: 'action_my_account' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '👥 邀请好友赚号码',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '🎁 *邀请奖励*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '邀请朋友加入，双方共赢！\n\n' +
                '✅ *朋友注册成功*\n' +
                '   └ 你获得：2 Silver ⭐⭐\n\n' +
                '✅ *朋友首充 ≥₹100*\n' +
                '   └ 你获得：2 Gold ⭐⭐\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '📱 *如何邀请*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '1️⃣ 点击"邀请好友"\n' +
                '2️⃣ 复制您的专属邀请链接\n' +
                '3️⃣ 分享给朋友（WhatsApp等）\n' +
                '4️⃣ 朋友通过链接注册\n' +
                '5️⃣ 审核通过后奖励自动发放\n\n' +
                '━━━━━━━━━━━━━━━━━━━\n' +
                '💡 *邀请技巧*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '• 分享给喜欢游戏的朋友\n' +
                '• 强调免费参与的机会\n' +
                '• 展示您的中奖记录\n' +
                '• 邀请越多，奖励越多\n\n' +
                '🚫 禁止作弊或虚假账号',
            buttons: [
                [{ text: '🔗 获取邀请链接', callback_data: 'action_invite_friends' }],
                [{ text: '📊 查看统计', callback_data: 'action_my_account' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // ==================== 5. 平台数据统计 ====================
    platformStats: {
        en: {
            title: '📊 Platform Statistics',
            content: '{{DYNAMIC_CONTENT}}',
            buttons: [
                [{ text: '💰 Current Pool', callback_data: 'action_current_pool' }],
                [{ text: '🏆 Yesterday Winners', callback_data: 'action_yesterday_winners' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '📊 平台数据统计',
            content: '{{DYNAMIC_CONTENT}}',
            buttons: [
                [{ text: '💰 当前奖池', callback_data: 'action_current_pool' }],
                [{ text: '🏆 昨日中奖', callback_data: 'action_yesterday_winners' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // ==================== 6. 帮助中心 ====================
    helpCenter: {
        en: {
            title: '⚖️ Rules & Help',
            content: '━━━━━━━━━━━━━━━━━━━\nChoose a topic:\n━━━━━━━━━━━━━━━━━━━\n\n🎯 How to Play - Get started\n❓ FAQ - Common questions\n📊 Prize Pool Info - How prizes work',
            buttons: [
                [{ text: '🎯 How to Play', callback_data: 'menu_how_to_play' }],
                [{ text: '❓ FAQ', callback_data: 'menu_faq' }],
                [{ text: '📊 Prize Pool Info', callback_data: 'menu_pool_info' }],
                [{ text: '📋 User Rules', callback_data: 'menu_user_rules' }],
                [{ text: '⚖️ Fairness', callback_data: 'menu_fairness' }],
                [{ text: '📜 Legal', callback_data: 'menu_legal' }],
                [{ text: '🎯 Responsible Gaming', callback_data: 'menu_responsible' }],
                [{ text: '💬 Support', callback_data: 'action_support' }],
                [{ text: '🔙 Back', callback_data: 'menu_main' }]
            ]
        },
        zh: {
            title: '⚖️ 规则与帮助',
            content: '━━━━━━━━━━━━━━━━━━━\n选择您想了解的内容：\n━━━━━━━━━━━━━━━━━━━\n\n🎯 如何参与 - 快速开始\n❓ 常见问题 - 常见问题解答\n📊 奖池说明 - 奖金如何分配',
            buttons: [
                [{ text: '🎯 如何参与', callback_data: 'menu_how_to_play' }],
                [{ text: '❓ 常见问题', callback_data: 'menu_faq' }],
                [{ text: '📊 奖池说明', callback_data: 'menu_pool_info' }],
                [{ text: '📋 用户准则', callback_data: 'menu_user_rules' }],
                [{ text: '⚖️ 公平性', callback_data: 'menu_fairness' }],
                [{ text: '📜 法律声明', callback_data: 'menu_legal' }],
                [{ text: '🎯 责任博彩', callback_data: 'menu_responsible' }],
                [{ text: '💬 联系客服', callback_data: 'action_support' }],
                [{ text: '🔙 返回', callback_data: 'menu_main' }]
            ]
        }
    },

    // FAQ
    faq: {
        en: {
            title: '❓ FAQ',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*Frequently Asked Questions*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*Q: How long for recharge approval?*\n' +
                'A: Usually 5-30 min, max 24h.\n\n' +
                '*Q: What if recharge fails?*\n' +
                'A: Keep screenshot, contact support.\n\n' +
                '*Q: Can I transfer numbers?*\n' +
                'A: No, numbers bind to your account.\n\n' +
                '*Q: Do numbers expire?*\n' +
                'A: Valid for the day, recycled after draw.\n\n' +
                '*Q: How do I know if I won?*\n' +
                'A: Bot auto-notifies, check history.\n\n' +
                '*Q: How are prizes sent?*\n' +
                'A: UPI transfer within 48h.\n\n' +
                '*Q: Can I join multiple times?*\n' +
                'A: One registration only, but can recharge multiple times.',
            buttons: [
                [{ text: '💬 Contact Support', callback_data: 'action_support' }],
                [{ text: '🔙 Back', callback_data: 'menu_help_center' }]
            ]
        },
        zh: {
            title: '❓ 常见问题',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*常见问题解答*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*Q: 充值后多久到账？*\n' +
                'A: 通常5-30分钟，最多24小时。\n\n' +
                '*Q: 充值失败怎么办？*\n' +
                'A: 请保留截图，联系客服处理。\n\n' +
                '*Q: 号码可以转让吗？*\n' +
                'A: 不可以，号码绑定个人账户。\n\n' +
                '*Q: 号码会过期吗？*\n' +
                'A: 当日有效，开奖后回收。\n\n' +
                '*Q: 如何知道是否中奖？*\n' +
                'A: Bot自动推送，也可查历史记录。\n\n' +
                '*Q: 奖金如何发放？*\n' +
                'A: UPI转账，48小时内到账。\n\n' +
                '*Q: 可以多次参与吗？*\n' +
                'A: 每人限注册一次，但可多次充值。',
            buttons: [
                [{ text: '💬 联系客服', callback_data: 'action_support' }],
                [{ text: '🔙 返回', callback_data: 'menu_help_center' }]
            ]
        }
    },

    // 通用按钮
    backToMain: {
        en: { text: '🔙 Back to Menu', callback_data: 'menu_main' },
        zh: { text: '🔙 返回主菜单', callback_data: 'menu_main' }
    },

    closeMenu: {
        en: { text: '❌ Close', callback_data: 'menu_close' },
        zh: { text: '❌ 关闭', callback_data: 'menu_close' }
    },

    // ==================== 用户准则 ====================
    userRules: {
        en: {
            title: '📋 User Rules',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*Rules & Guidelines*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*✅ Allowed*\n' +
                '• Use real Game ID\n' +
                '• Invite real friends\n' +
                '• Daily check-in\n' +
                '• Follow community rules\n\n' +
                '*❌ Not Allowed*\n' +
                '• Fake identity/screenshots\n' +
                '• Multiple accounts/devices\n' +
                '• Bots or scripts\n' +
                '• Ads or spam\n' +
                '• Harassment\n\n' +
                '*⚠️ Consequences*\n' +
                '1st: Warning\n' +
                '2nd: 7-day freeze\n' +
                '3rd: Permanent ban\n' +
                'Serious: Ban + prize void\n\n' +
                '*📞 Report*\n' +
                'Contact @support_account to report violations',
            buttons: [
                [{ text: '💬 Contact Support', callback_data: 'action_support' }],
                [{ text: '🔙 Back', callback_data: 'menu_help_center' }]
            ]
        },
        zh: {
            title: '📋 用户准则',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*规则与准则*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*✅ 允许行为*\n' +
                '• 使用真实Game ID\n' +
                '• 邀请真实朋友\n' +
                '• 每日正常签到\n' +
                '• 遵守社区规则\n\n' +
                '*❌ 禁止行为*\n' +
                '• 使用虚假身份或截图\n' +
                '• 一人多号/多设备作弊\n' +
                '• 恶意刷量或脚本\n' +
                '• 发布广告或垃圾信息\n' +
                '• 辱骂他人或传播谣言\n\n' +
                '*⚠️ 违规后果*\n' +
                '首次违规: 警告\n' +
                '二次违规: 冻结7天\n' +
                '三次违规: 永久封号\n' +
                '严重违规: 直接封号+奖金清零\n\n' +
                '*📞 举报渠道*\n' +
                '发现违规行为请联系 @support_account 举报',
            buttons: [
                [{ text: '💬 联系客服', callback_data: 'action_support' }],
                [{ text: '🔙 返回', callback_data: 'menu_help_center' }]
            ]
        }
    },

    // ==================== 公平性 ====================
    fairness: {
        en: {
            title: '⚖️ Fairness & Security',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*How We Ensure Fairness*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*1. Random Draw*\n' +
                '• Blockchain-verified randomness\n' +
                '• Transparent selection process\n' +
                '• All draws recorded\n\n' +
                '*2. Number Weights*\n' +
                '• Free: 1x base weight\n' +
                '• Silver: 2x weight\n' +
                '• Gold: 4x weight\n' +
                '• Higher tier = higher chance\n\n' +
                '*3. Security*\n' +
                '• Data encrypted\n' +
                '• MongoDB Atlas storage\n' +
                '• Regular audits',
            buttons: [
                [{ text: '🔙 Back', callback_data: 'menu_help_center' }]
            ]
        },
        zh: {
            title: '⚖️ 公平性与安全',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*我们如何确保公平*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*1. 随机开奖*\n' +
                '• 区块链验证的随机性\n' +
                '• 透明的选择过程\n' +
                '• 所有开奖记录可查\n\n' +
                '*2. 号码权重*\n' +
                '• 免费：1倍基础权重\n' +
                '• 白银：2倍权重\n' +
                '• 黄金：4倍权重\n' +
                '• 等级越高，中奖概率越高\n\n' +
                '*3. 安全性*\n' +
                '• 数据加密存储\n' +
                '• MongoDB Atlas云端存储\n' +
                '• 定期安全审计',
            buttons: [
                [{ text: '🔙 返回', callback_data: 'menu_help_center' }]
            ]
        }
    },

    // ==================== 法律声明 ====================
    legal: {
        en: {
            title: '📜 Legal Disclaimer',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*Terms of Service*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*1. Eligibility*\n' +
                '• 18+ years old required\n' +
                '• Valid Teen Patti account\n' +
                '• Residents of allowed regions\n\n' +
                '*2. Disclaimer*\n' +
                '• Lottery is entertainment\n' +
                '• No guaranteed winnings\n' +
                '• Play responsibly\n\n' +
                '*3. Rights*\n' +
                '• We reserve the right to modify rules\n' +
                '• Suspend accounts for violations\n' +
                '• Void fraudulent entries\n\n' +
                '*📧 Contact*\n' +
                'Operator: TeenPattiMaster Company\n' +
                'Support: @support_account\n' +
                'Admins: @Winbiginsta @jack059316',
            buttons: [
                [{ text: '💬 Contact Support', callback_data: 'action_support' }],
                [{ text: '🔙 Back', callback_data: 'menu_help_center' }]
            ]
        },
        zh: {
            title: '📜 法律声明',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*服务条款*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*1. 参与资格*\n' +
                '• 必须年满18岁\n' +
                '• 拥有有效的Teen Patti账号\n' +
                '• 来自允许参与的地区\n\n' +
                '*2. 免责声明*\n' +
                '• 抽奖仅供娱乐\n' +
                '• 不保证中奖\n' +
                '• 请理性参与\n\n' +
                '*3. 权利保留*\n' +
                '• 我们保留修改规则的权利\n' +
                '• 违规账号将被暂停\n' +
                '• 欺诈参与将被取消资格\n\n' +
                '*📧 联系我们*\n' +
                '运营方: TeenPattiMaster Company\n' +
                '客服: @support_account\n' +
                '管理员: @Winbiginsta @jack059316',
            buttons: [
                [{ text: '💬 联系客服', callback_data: 'action_support' }],
                [{ text: '🔙 返回', callback_data: 'menu_help_center' }]
            ]
        }
    },

    // ==================== 责任博彩 ====================
    responsible: {
        en: {
            title: '🎯 Responsible Gaming',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*Play Responsibly*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*⏰ Self-Limit Tools*\n' +
                '• Daily limit: ₹50,000\n' +
                '• Cool-off: 7-day pause available\n' +
                '• Self-exclusion: Permanent exit available\n\n' +
                '*🚨 Warning Signs*\n' +
                '□ Spending more than planned\n' +
                '□ Chasing losses\n' +
                '□ Neglecting responsibilities\n' +
                '□ Borrowing money to play\n\n' +
                '*📞 Help Resources*\n' +
                'India Mental Health Helpline:\n' +
                '• Vandrevala Foundation: +91 9999 666 555\n' +
                '• iCall: +91 22 2556 3291\n' +
                '• Available 24/7\n\n' +
                '*💡 Remember*\n' +
                '• It\'s entertainment, not income\n' +
                '• Set a budget and stick to it\n' +
                '• Take breaks regularly\n' +
                '• Seek help if needed',
            buttons: [
                [{ text: '⚙️ Set Limits', callback_data: 'action_set_limits' }],
                [{ text: '💬 Contact Support', callback_data: 'action_support' }],
                [{ text: '🔙 Back', callback_data: 'menu_help_center' }]
            ]
        },
        zh: {
            title: '🎯 责任博彩',
            content:
                '━━━━━━━━━━━━━━━━━━━\n' +
                '*理性参与*\n' +
                '━━━━━━━━━━━━━━━━━━━\n\n' +
                '*⏰ 自我限制工具*\n' +
                '• 每日限额: ₹50,000\n' +
                '• 冷静期: 可申请7天暂停\n' +
                '• 自我排除: 可申请永久退出\n\n' +
                '*🚨 问题博彩信号*\n' +
                '□ 充值超过承受能力\n' +
                '□ 试图追回损失\n' +
                '□ 影响工作或生活\n' +
                '□ 向他人借钱参与\n\n' +
                '*📞 求助资源*\n' +
                '印度心理健康热线:\n' +
                '• Vandrevala Foundation: +91 9999 666 555\n' +
                '• iCall: +91 22 2556 3291\n' +
                '• 24小时服务\n\n' +
                '*💡 请记住*\n' +
                '• 这是娱乐，不是收入来源\n' +
                '• 设定预算并坚持\n' +
                '• 定期休息\n' +
                '• 需要时寻求帮助',
            buttons: [
                [{ text: '⚙️ 设置限制', callback_data: 'action_set_limits' }],
                [{ text: '💬 联系客服', callback_data: 'action_support' }],
                [{ text: '🔙 返回', callback_data: 'menu_help_center' }]
            ]
        }
    }
};

module.exports = MenuContent;
