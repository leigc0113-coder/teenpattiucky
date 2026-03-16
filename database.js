/**
 * ============================================================
 * 数据库模块 (database.js)
 * ============================================================
 * 
 * JSON文件存储
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

class Database {
    constructor() {
        this.files = {
            users: path.join(DATA_DIR, 'users.json'),
            tierIdentities: path.join(DATA_DIR, 'tierIdentities.json'),
            tierNumberPool: path.join(DATA_DIR, 'tierNumberPool.json'),
            lotteryNumbers: path.join(DATA_DIR, 'lotteryNumbers.json'),
            recharges: path.join(DATA_DIR, 'recharges.json'),
            pools: path.join(DATA_DIR, 'pools.json'),
            winners: path.join(DATA_DIR, 'winners.json'),
            inviteRecords: path.join(DATA_DIR, 'inviteRecords.json'),
            checkins: path.join(DATA_DIR, 'checkins.json')
        };
        this.cache = {};
    }

    async init() {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
        } catch (e) {}

        for (const [key, filePath] of Object.entries(this.files)) {
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, JSON.stringify([], null, 2));
            }
        }

        await this.initTierNumberPool();
        console.log('✅ 数据库初始化完成');
    }

    async initTierNumberPool() {
        const CONFIG = require('./config');
        const pool = await this.getAll('tierNumberPool');
        
        if (pool.length === 0) {
            const tierNumbers = [];
            for (let level = 1; level <= 10; level++) {
                const [tierName, number] = CONFIG.TIER_NAMES[level];
                tierNumbers.push({
                    id: `${tierName}·${number}`,
                    level,
                    tierName,
                    number,
                    status: 'FREE',
                    userId: null,
                    assignedAt: null,
                    coolingEndDate: null
                });
            }
            await this.save('tierNumberPool', tierNumbers);
        }
    }

    async getAll(collection) {
        if (this.cache[collection]) {
            return this.cache[collection];
        }
        try {
            const data = await fs.readFile(this.files[collection], 'utf8');
            const parsed = JSON.parse(data);
            this.cache[collection] = parsed;
            return parsed;
        } catch {
            return [];
        }
    }

    async save(collection, data) {
        this.cache[collection] = data;
        await fs.writeFile(this.files[collection], JSON.stringify(data, null, 2));
    }

    async findById(collection, id) {
        const data = await this.getAll(collection);
        return data.find(item => item.id === id) || null;
    }

    async findOne(collection, condition) {
        const data = await this.getAll(collection);
        return data.find(item => {
            for (const [key, value] of Object.entries(condition)) {
                if (item[key] !== value) return false;
            }
            return true;
        }) || null;
    }

    async findAll(collection, condition) {
        const data = await this.getAll(collection);
        if (!condition) return data;
        return data.filter(item => {
            for (const [key, value] of Object.entries(condition)) {
                if (item[key] !== value) return false;
            }
            return true;
        });
    }

    async insert(collection, item) {
        const data = await this.getAll(collection);
        data.push(item);
        await this.save(collection, data);
        return item;
    }

    async update(collection, id, updates) {
        const data = await this.getAll(collection);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            await this.save(collection, data);
            return data[index];
        }
        return null;
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }
}

module.exports = new Database();
