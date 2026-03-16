/**
 * ============================================================
 * 消息模板文件 (messages.js)
 * ============================================================
 * 
 * 包含所有发送给用户的消息模板
 * 便于统一管理和多语言支持
 */

const CONFIG = require('./config');

module.exports = {
    
    // ==================== 欢迎消息 ====================
    
    /**
     * 注册成功欢迎消息
     * @param {string} gameId - 游戏ID
     * @param {string|null} tierName - 等级身份名称（如"青铜·01"）
     * @param {number} numbersCount - 获得号码数量
     */
    WELCOME: (gameId, tierName, numbersCount) => {
        let msg = `🎉 注册成功！\n\n`;
        msg += `📱 游戏ID：${gameId}\n`;
        
        if (tierName) {
            msg += `🏆 等级身份：${tierName}\n`;
            msg += `💎 恭喜您获得稀缺等级号码！\n`;
        } else {
            msg += `⏳ 等级身份：候补队列中\n`;
            msg += `💡 等级号码已满，将在有号码释放时优先分配给您\n`;
        }
        
        msg += `🎫 今日普通号码：${numbersCount}个\n`;
        msg += `⏰ 开奖时间：21:00 IST\n\n`;
        msg += `使用 /myaccount 查看详细信息\n`;
        msg += `使用 /checkin 每日签到获得更多号码`;
        return msg;
    },
    
    // ==================== 账户信息 ====================
    
    /**
     * 我的账户信息
     * @param {Object} data - 账户数据
     */
    MY_ACCOUNT: (data) => {
        let msg = `📱 我的账户\n`;
        msg += `${'='.repeat(30)}\n\n`;
        
        // 等级身份信息
        if (data.tier) {
            msg += `🏆 等级身份：${data.tier.displayName}\n`;
            msg += `📊 当前等级：Lv.${data.tier.level}\n`;
            msg += `💰 累计充值：${CONFIG.CURRENCY}${data.tier.totalRecharge.toLocaleString()}\n`;
            
            if (data.tier.level < 10) {
                const nextLevel = data.tier.level + 1;
                const threshold = CONFIG.TIER_THRESHOLDS[nextLevel];
                const remaining = threshold - data.tier.totalRecharge;
                msg += `📈 距离升级：还需${CONFIG.CURRENCY}${remaining.toLocaleString()} 晋升${CONFIG.TIER_NAMES[nextLevel][0]}·${CONFIG.TIER_NAMES[nextLevel][1]}\n`;
            } else {
                msg += `👑 已达最高等级！\n`;
            }
            
            msg += `⚡ 开奖权重：${data.weight.toFixed(1)}倍\n`;
        } else {
            msg += `⏳ 等级身份：候补队列中\n`;
            msg += `💡 等级号码（青铜·01 到 星耀·01）全球唯一，共10个\n`;
        }
        
        // 今日号码
        msg += `\n🎫 今日普通号码：${data.numbersCount}个\n`;
        if (data.numbersList) {
            msg += `号码：${data.numbersList}\n`;
        }
        
        // VIP进度
        if (data.vip.isVIP) {
            msg += `\n👑 VIP状态：✅ 已获得（永久有效）\n`;
            msg += `🎁 VIP特权：\n`;
            msg += `  ├─ 1.5倍开奖权重\n`;
            msg += `  ├─ 专属VIP专场抽奖\n`;
            msg += `  ├─ 充值号码+20%\n`;
            msg += `  └─ 等级候补优先权\n`;
        } else if (data.vip.consecutiveDays !== undefined) {
            msg += `\n👑 VIP资格进度：${data.vip.consecutiveDays}/${data.vip.targetDays}天\n`;
            msg += `📋 要求：连续${data.vip.targetDays}天单日充值≥${CONFIG.CURRENCY}${data.vip.threshold}\n`;
            msg += `📊 今日充值：${CONFIG.CURRENCY}${data.vip.todayRecharge}/${data.vip.threshold}\n`;
            if (data.vip.remaining > 0) {
                msg += `💡 还需${CONFIG.CURRENCY}${data.vip.remaining}即可达标今日\n`;
            } else {
                msg += `✅ 今日已达标！\n`;
            }
        }
        
        // 今日奖池
        if (data.poolAmount) {
            msg += `\n💰 今日奖池：${CONFIG.CURRENCY}${data.poolAmount.toLocaleString()}\n`;
            msg += `👥 参与人数：${data.participantCount}人\n`;
            msg += `🎯 中奖率：约${Math.min(data.participantCount * 0.05, 20)}人\n`;
        }
        
        msg += `\n⏰ 开奖时间：21:00 IST\n`;
        msg += `🍀 祝您好运！`;
        
        return msg;
    },
    
    // ==================== 签到消息 ====================
    
    /**
     * 签到成功
     * @param {number} consecutive - 连续签到天数
     * @param {number} rewardCount - 获得号码数量
     */
    CHECKIN_SUCCESS: (consecutive, rewardCount) => {
        let msg = `✅ 签到成功！\n\n`;
        msg += `📅 连续签到：${consecutive}天\n`;
        msg += `🎁 获得号码：${rewardCount}个\n`;
        
        if (consecutive % 7 === 0) {
            msg += `\n🎉🎉🎉 恭喜连续7天签到！\n`;
            msg += `💎 额外获得5个号码奖励！\n`;
        }
        
        msg += `\n⏰ 开奖时间：21:00 IST\n`;
        msg += `📱 使用 /myaccount 查看您的号码`;
        return msg;
    },
    
    // ==================== 邀请消息 ====================
    
    /**
     * 邀请好友信息
     * @param {Object} stats - 邀请统计数据
     * @param {string} inviteLink - 邀请链接
     */
    INVITE_INFO: (stats, inviteLink) => {
        let msg = `👥 邀请好友\n`;
        msg += `${'='.repeat(30)}\n\n`;
        
        msg += `📊 邀请统计：\n`;
        msg += `├─ 已邀请：${stats.total}人\n`;
        msg += `├─ 已注册：${stats.registered}人\n`;
        msg += `└─ 已首充：${stats.recharged}人\n\n`;
        
        msg += `🎁 奖励规则：\n`;
        msg += `├─ 好友注册：您得2个号码\n`;
        msg += `├─ 好友首充≥₹100：您再得5个号码\n`;
        msg += `└─ 好友通过您的链接注册额外得1个号码\n\n`;
        
        msg += `🔗 您的专属邀请链接：\n`;
        msg += `${inviteLink}\n\n`;
        msg += `💡 将链接分享给好友，好友点击并完成注册后，奖励自动发放！`;
        
        return msg;
    },
    
    // ==================== 充值消息 ====================
    
    /**
     * 充值说明
     */
    RECHARGE_INFO: () => {
        let msg = `💰 充值获得更多号码\n`;
        msg += `${'='.repeat(30)}\n\n`;
        
        msg += `📋 充值档位及奖励：\n`;
        msg += `├─ ₹100 → 3个号码\n`;
        msg += `├─ ₹300 → 10个号码\n`;
        msg += `├─ ₹500 → 20个号码 (1.2倍权重)\n`;
        msg += `├─ ₹1,000 → 50个号码 (1.3倍权重)\n`;
        msg += `├─ ₹5,000 → 200个号码 (1.5倍权重) ✅计入VIP进度\n`;
        msg += `└─ ₹10,000 → 500个号码 (2倍权重) ✅计入VIP进度\n\n`;
        
        msg += `📸 充值步骤：\n`;
        msg += `1. 完成游戏内充值\n`;
        msg += `2. 截图保存充值成功页面\n`;
        msg += `3. 直接发送截图给Bot\n`;
        msg += `4. 等待审核（5-30分钟）\n`;
        msg += `5. 审核通过后号码自动发放\n\n`;
        
        msg += `⚠️ 注意事项：\n`;
        msg += `• 截图需清晰可见充值金额和时间\n`;
        msg += `• 充值金额累计可晋升等级身份\n`;
        msg += `• 单日充值≥₹5,000连续5天可获得永久VIP\n\n`;
        
        msg += `💡 现在发送充值截图开始审核！`;
        
        return msg;
    },
    
    /**
     * 充值提交成功
     * @param {string} auditId - 审核单号
     */
    RECHARGE_SUBMITTED: (auditId) => {
        let msg = `✅ 充值截图已提交！\n\n`;
        msg += `🆔 审核单号：${auditId}\n`;
        msg += `⏰ 预计审核时间：5-30分钟\n`;
        msg += `📢 审核结果将通过消息通知您\n\n`;
        msg += `💡 您可以使用 /myaccount 查看审核进度\n`;
        msg += `⚠️ 请勿重复提交相同截图`;
        return msg;
    },
    
    // ==================== 开奖消息 ====================
    
    /**
     * 开奖结果
     * @param {string} date - 日期
     * @param {Array} winners - 中奖者列表
     * @param {number} poolAmount - 奖池金额
     */
    DRAW_RESULT: (date, winners, poolAmount) => {
        let msg = `🎉 开奖结果公布\n`;
        msg += `${'='.repeat(30)}\n\n`;
        
        msg += `📅 日期：${date}\n`;
        msg += `💰 奖池：${CONFIG.CURRENCY}${poolAmount.toLocaleString()}\n`;
        msg += `🏆 中奖人数：${winners.length}人\n\n`;
        
        const prizeEmoji = ['🥇 一等', '🥈 二等', '🥉 三等'];
        winners.slice(0, 5).forEach((w, i) => {
            const tier = w.tierName ? `[${w.tierName}] ` : '';
            const prizeName = prizeEmoji[Math.min(w.prizeTier - 1, 2)];
            msg += `${prizeName}：${tier}${CONFIG.CURRENCY}${w.amount.toLocaleString()}\n`;
        });
        
        if (winners.length > 5) {
            msg += `... 还有 ${winners.length - 5} 位中奖者\n`;
        }
        
        msg += `\n🎊 恭喜所有中奖者！\n`;
        msg += `⏰ 请在48小时内完成兑奖\n`;
        msg += `📩 中奖者请查收私信通知`;
        
        return msg;
    },
    
    /**
     * 中奖通知（私信）
     * @param {string} date - 日期
     * @param {number} amount - 中奖金额
     */
    WINNER_NOTIFICATION: (date, amount) => {
        let msg = `🎉 恭喜您中奖了！\n\n`;
        msg += `📅 开奖日期：${date}\n`;
        msg += `💰 中奖金额：${CONFIG.CURRENCY}${amount.toLocaleString()}\n\n`;
        msg += `⏰ 兑奖时限：48小时内\n`;
        msg += `💡 超过48小时未兑奖将视为自动放弃\n\n`;
        msg += `👉 请点击下方按钮完成兑奖：`;
        return msg;
    },
    
    // ==================== 帮助消息 ====================
    
    /**
     * 帮助信息
     */
    HELP: () => {
        let msg = `📖 使用帮助\n`;
        msg += `${'='.repeat(30)}\n\n`;
        
        msg += `🤖 可用命令：\n`;
        msg += `/start - 开始注册\n`;
        msg += `/myaccount - 查看我的账户\n`;
        msg += `/checkin - 每日签到\n`;
        msg += `/invite - 邀请好友\n`;
        msg += `/recharge - 充值说明\n`;
        msg += `/help - 显示帮助\n\n`;
        
        msg += `🎮 游戏流程：\n`;
        msg += `1️⃣ 使用 /start 注册并绑定游戏ID（7位数字）\n`;
        msg += `2️⃣ 获得免费号码参与每日21:00开奖\n`;
        msg += `3️⃣ 使用 /checkin 每日签到获得更多号码\n`;
        msg += `4️⃣ 充值获得大量号码和权重加成\n`;
        msg += `5️⃣ 邀请好友获得额外号码奖励\n`;
        msg += `6️⃣ 连续充值5天每天₹5,000获得永久VIP\n`;
        msg += `7️⃣ 中奖后48小时内通过UPI兑奖\n\n`;
        
        msg += `🏆 等级体系：\n`;
        msg += `• 共10个稀缺等级号码（青铜·01 到 星耀·01）\n`;
        msg += `• 累计充值达标可晋升等级\n`;
        msg += `• 高等级享有更高开奖权重\n\n`;
        
        msg += `👑 VIP特权：\n`;
        msg += `• 1.5倍开奖权重\n`;
        msg += `• 专属VIP专场抽奖\n`;
        msg += `• 充值号码+20%\n`;
        msg += `• 等级候补优先权\n`;
        msg += `• 一次获得，永久有效\n\n`;
        
        msg += `❓ 如有问题请联系客服`;
        
        return msg;
    },
    
    // ==================== 错误消息 ====================
    
    /**
     * 错误消息集合
     */
    ERRORS: {
        NOT_REGISTERED: '❌ 请先使用 /start 注册',
        INVALID_GAME_ID: '❌ 游戏ID格式错误！请输入7位数字，例如：1234567',
        GAME_ID_EXISTS: '❌ 该游戏ID已被注册！如果这是您的账号，请联系客服',
        ALREADY_CHECKED_IN: '⚠️ 您今日已经签到过了，明天再来吧！',
        RECHARGE_PENDING: '⏳ 您有充值正在审核中，请耐心等待',
        NOT_ENOUGH_PARTICIPANTS: '❌ 参与人数不足，开奖延期至明日'
    }
};
