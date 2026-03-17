/**
 * ============================================================
 * AI内容优化数据库初始化
 * ============================================================
 */

const Database = require('./database');

async function initContentMasterDB() {
    console.log('[INIT] Setting up Content Master database tables...');

    // 内容生成日志表
    await Database.createCollection('content_logs', {
        id: 'string',
        type: 'string',          // morning, game, tips, pool, countdown, winners, night
        target: 'string',        // channel, group
        segment: 'string',       // newbie, regular, engaged, vip, dormant
        version: 'string',       // A/B测试版本ID
        contentHash: 'string',   // 内容指纹
        createdAt: 'string',
        festival: 'string'       // 节日类型（如果有）
    });

    // 表现指标表
    await Database.createCollection('performance_metrics', {
        id: 'string',
        postId: 'string',        // 关联content_logs.id
        contentLogId: 'string',
        target: 'string',        // channel, group
        views: 'number',         // 查看次数
        clicks: 'number',        // 链接点击
        reactions: 'number',     // 表情反应
        comments: 'number',      // 评论数
        shares: 'number',        // 转发数
        conversions: 'number',   // 实际转化（下载/注册/充值）
        timestamp: 'string',
        hourOfDay: 'number'      // 发布时段（用于时段分析）
    });

    // A/B测试表
    await Database.createCollection('ab_tests', {
        id: 'string',
        name: 'string',
        type: 'string',          // morning, game, tips, etc.
        target: 'string',        // channel, group
        variants: 'array',       // [{id, content, weight}]
        status: 'string',        // running, completed, paused
        startDate: 'string',
        endDate: 'string',
        winner: 'string'         // 获胜版本ID
    });

    // 用户分层表
    await Database.createCollection('user_segments', {
        userId: 'string',
        segment: 'string',       // newbie, regular, engaged, vip, dormant
        joinDate: 'string',
        lastActive: 'string',
        totalSpending: 'number',
        activityLevel: 'string', // high, medium, low
        preferredGames: 'array', // ['aviator', 'slots', ...]
        updatedAt: 'string'
    });

    // 节日营销表
    await Database.createCollection('festival_campaigns', {
        id: 'string',
        name: 'string',          // diwali, holi, ipl, etc.
        date: 'string',
        type: 'string',          // major, medium, sports, national
        multiplier: 'number',    // 奖池倍数
        active: 'boolean',
        contentUsed: 'array'     // 已使用的内容ID
    });

    // 最佳实践表（AI学习库）
    await Database.createCollection('best_practices', {
        id: 'string',
        type: 'string',          // morning, game, tips, etc.
        target: 'string',        // channel, group
        content: 'string',       // 优秀内容模板
        performance: 'object',   // {conversionRate, engagementRate}
        lessons: 'string',       // 为什么这个内容好
        createdAt: 'string'
    });

    console.log('[INIT] Content Master database ready!');
}

module.exports = { initContentMasterDB };
