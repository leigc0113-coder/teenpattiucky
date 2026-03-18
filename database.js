/**
 * ============================================================
 * MongoDB 数据库模块 (database-mongodb.js)
 * ============================================================
 * 
 * 使用 MongoDB Atlas 替代 JSON 文件存储
 * API 与 database.js 完全兼容
 */

const mongoose = require('mongoose');

// 定义 Schema
const UserSchema = new mongoose.Schema({
    telegramId: Number,
    gameId: String,
    balance: { type: Number, default: 0 },
    tierLevel: { type: Number, default: 0 },
    vipLevel: { type: Number, default: 0 },
    vipExpireDate: String,
    inviteCount: { type: Number, default: 0 },
    invitedBy: Number,
    createdAt: String,
    lastCheckin: String,
    checkinCount: { type: Number, default: 0 }
}, { collection: 'users' });

const TierIdentitySchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String (如 "u_7054117110")
    gameId: String,
    tierId: String,
    level: Number,
    tierName: String,
    number: String,
    assignedAt: String,
    expireDate: String
}, { collection: 'tierIdentities' });

const TierNumberPoolSchema = new mongoose.Schema({
    id: String,
    level: Number,
    tierName: String,
    number: String,
    status: { type: String, default: 'FREE' },
    userId: { type: mongoose.Schema.Types.Mixed, default: null },  // 支持 Number 或 String
    assignedAt: { type: String, default: null },
    coolingEndDate: { type: String, default: null }
}, { collection: 'tierNumberPool' });

const LotteryNumberSchema = new mongoose.Schema({
    id: String,
    userId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
    gameId: String,
    tierId: String,
    level: Number,
    number: String,
    type: String,
    createdAt: String,
    drawDate: String,
    status: { type: String, default: 'ACTIVE' }
}, { collection: 'lotteryNumbers' });

const RechargeSchema = new mongoose.Schema({
    id: String,
    userId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
    gameId: String,
    amount: Number,
    tier: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String (如 "FREE")
    utrNumber: String,
    screenshot: String,
    status: { type: String, default: 'PENDING' },
    createdAt: String,
    processedAt: String,
    processedBy: mongoose.Schema.Types.Mixed  // 支持 Number 或 String
}, { collection: 'recharges' });

const PoolSchema = new mongoose.Schema({
    id: String,
    date: String,
    totalAmount: Number,
    tierAmounts: Object,
    status: { type: String, default: 'ACTIVE' }
}, { collection: 'pools' });

const WinnerSchema = new mongoose.Schema({
    id: String,
    drawDate: String,
    tier: Number,
    tierName: String,
    prize: Number,
    winner: {
        telegramId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
        gameId: String,
        tierId: String,
        number: String
    },
    createdAt: String
}, { collection: 'winners' });

const InviteRecordSchema = new mongoose.Schema({
    id: String,
    inviterId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
    inviteeId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
    inviteeGameId: String,
    status: { type: String, default: 'PENDING' },
    reward: { type: Number, default: 0 },
    createdAt: String,
    completedAt: String
}, { collection: 'inviteRecords' });

const CheckinSchema = new mongoose.Schema({
    id: String,
    userId: mongoose.Schema.Types.Mixed,  // 支持 Number 或 String
    date: String,
    reward: Number,
    consecutiveDays: Number,
    createdAt: String
}, { collection: 'checkins' });

class Database {
    constructor() {
        this.models = {};
        this.cache = {};
    }

    async init() {
        // 连接 MongoDB
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(uri);
        console.log('✅ MongoDB 连接成功');

        // 初始化模型
        this.models = {
            users: mongoose.model('User', UserSchema),
            tierIdentities: mongoose.model('TierIdentity', TierIdentitySchema),
            tierNumberPool: mongoose.model('TierNumberPool', TierNumberPoolSchema),
            lotteryNumbers: mongoose.model('LotteryNumber', LotteryNumberSchema),
            recharges: mongoose.model('Recharge', RechargeSchema),
            pools: mongoose.model('Pool', PoolSchema),
            winners: mongoose.model('Winner', WinnerSchema),
            inviteRecords: mongoose.model('InviteRecord', InviteRecordSchema),
            checkins: mongoose.model('Checkin', CheckinSchema)
        };

        await this.initTierNumberPool();
        console.log('✅ MongoDB 数据库初始化完成');
    }

    async initTierNumberPool() {
        const CONFIG = require('./config');
        const count = await this.models.tierNumberPool.countDocuments();
        
        if (count === 0) {
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
            await this.models.tierNumberPool.insertMany(tierNumbers);
        }
    }

    async getAll(collection) {
        if (this.cache[collection]) {
            return this.cache[collection];
        }
        const Model = this.models[collection];
        if (!Model) return [];
        
        const data = await Model.find().lean();
        this.cache[collection] = data;
        return data;
    }

    async save(collection, data) {
        this.cache[collection] = data;
        // MongoDB 不需要手动保存整个集合
        // 数据通过 insert/update 方法单独操作
    }

    async findById(collection, id) {
        const Model = this.models[collection];
        if (!Model) return null;
        return await Model.findOne({ id }).lean();
    }

    async findOne(collection, condition) {
        const Model = this.models[collection];
        if (!Model) return null;
        return await Model.findOne(condition).lean();
    }

    async findAll(collection, condition) {
        const Model = this.models[collection];
        if (!Model) return [];
        if (!condition) {
            return await Model.find().lean();
        }
        return await Model.find(condition).lean();
    }

    async insert(collection, item) {
        const Model = this.models[collection];
        if (!Model) return item;
        
        const doc = new Model(item);
        await doc.save();
        return item;
    }

    async update(collection, id, updates) {
        const Model = this.models[collection];
        if (!Model) return null;
        
        const result = await Model.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true }
        ).lean();
        
        return result;
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // 额外方法：用于直接 MongoDB 操作（可选）
    async deleteOne(collection, condition) {
        const Model = this.models[collection];
        if (!Model) return null;
        return await Model.deleteOne(condition);
    }

    async deleteMany(collection, condition) {
        const Model = this.models[collection];
        if (!Model) return null;
        return await Model.deleteMany(condition);
    }
}

module.exports = new Database();
