/**
 * ============================================================
 * AI内容优化数据库初始化
 * ============================================================
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

async function initContentMasterDB() {
    console.log('[INIT] Setting up Content Master database tables...');

    const collections = [
        'content_logs',
        'performance_metrics', 
        'ab_tests',
        'user_segments',
        'festival_campaigns',
        'best_practices'
    ];

    for (const collection of collections) {
        const filePath = path.join(DATA_DIR, `${collection}.json`);
        try {
            await fs.access(filePath);
        } catch {
            // 文件不存在，创建空数组
            await fs.writeFile(filePath, JSON.stringify([], null, 2));
            console.log(`[INIT] Created ${collection}.json`);
        }
    }

    console.log('[INIT] Content Master database ready!');
}

module.exports = { initContentMasterDB };
