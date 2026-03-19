const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://leigc0113_db_user:WaVep5zm9XeJFGzc@cluster0.imfyovl.mongodb.net/teenpatti?retryWrites=true&w=majority&appName=Cluster0';

async function checkUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({}, { collection: 'users' }));
        const Recharge = mongoose.model('Recharge', new mongoose.Schema({}, { collection: 'recharges' }));

        // 检查用户 7054117110
        console.log('\n=== User 7054117110 ===');
        const user1 = await User.find({ telegramId: 7054117110 });
        console.log('Users found:', user1.length);
        user1.forEach(u => {
            console.log(`  ID: ${u.id}, GameID: ${u.gameId}, Created: ${u.createdAt}`);
        });

        // 检查用户 5234313912
        console.log('\n=== User 5234313912 ===');
        const user2 = await User.find({ telegramId: 5234313912 });
        console.log('Users found:', user2.length);
        user2.forEach(u => {
            console.log(`  ID: ${u.id}, GameID: ${u.gameId}, Created: ${u.createdAt}`);
        });

        // 检查充值记录中的 gameId
        console.log('\n=== Recharge records for 7054117110 ===');
        const recharges1 = await Recharge.find({ userId: { $regex: '7054117110' } }).sort({ createdAt: -1 }).limit(5);
        console.log('Recharges found:', recharges1.length);
        recharges1.forEach(r => {
            console.log(`  ID: ${r.id}, GameID: ${r.gameId}, Amount: ${r.amount}, Status: ${r.status}`);
        });

        console.log('\n=== Recharge records for 5234313912 ===');
        const recharges2 = await Recharge.find({ userId: { $regex: '5234313912' } }).sort({ createdAt: -1 }).limit(5);
        console.log('Recharges found:', recharges2.length);
        recharges2.forEach(r => {
            console.log(`  ID: ${r.id}, GameID: ${r.gameId}, Amount: ${r.amount}, Status: ${r.status}`);
        });

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
