const fs = require('fs');
const path = require('path');

console.log('=========================================');
console.log('Teen Patti Lucky Bot - 部署诊断');
console.log('=========================================\n');

let errors = 0;
let warnings = 0;

// 检查 Node.js 版本
console.log('1. 检查 Node.js 版本...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    console.log('   ✗ 错误: Node.js 版本过低 (' + nodeVersion + '), 需要 >= 18');
    errors++;
} else {
    console.log('   ✓ Node.js ' + nodeVersion);
}

// 检查必需文件
console.log('\n2. 检查必需文件...');
const requiredFiles = [
    'bot.js',
    'config.js',
    'database.js',
    'package.json',
    'userService.js',
    'tierService.js',
    'lotteryService.js',
    'numberTierService.js',
    'rechargeService.js'
];

for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log('   ✓ ' + file);
    } else {
        console.log('   ✗ 缺失: ' + file);
        errors++;
    }
}

// 检查 .env
console.log('\n3. 检查环境配置...');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('YOUR_BOT_TOKEN_HERE')) {
        console.log('   ✗ BOT_TOKEN 还是示例值');
        errors++;
    } else if (envContent.includes('BOT_TOKEN=')) {
        console.log('   ✓ BOT_TOKEN 已设置');
    } else {
        console.log('   ✗ BOT_TOKEN 未设置');
        errors++;
    }
    
    if (envContent.includes('ADMIN_IDS=') && !envContent.includes('ADMIN_IDS=your')) {
        console.log('   ✓ ADMIN_IDS 已设置');
    } else {
        console.log('   ⚠ ADMIN_IDS 未设置');
        warnings++;
    }
} else {
    console.log('   ✗ 未找到 .env 文件');
    console.log('     请复制 .env.example 为 .env 并配置');
    errors++;
}

// 检查 data 目录
console.log('\n4. 检查数据目录...');
if (!fs.existsSync('data')) {
    console.log('   创建 data/ 目录...');
    fs.mkdirSync('data');
}

const dataFiles = [
    'users.json',
    'tierIdentities.json',
    'lotteryNumbers.json',
    'recharges.json',
    'pools.json',
    'winners.json'
];

for (const file of dataFiles) {
    const filePath = path.join('data', file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]');
        console.log('   创建: data/' + file);
    }
}
console.log('   ✓ 数据目录检查完成');

// 检查 node_modules
console.log('\n5. 检查依赖...');
if (fs.existsSync('node_modules')) {
    const keyModules = ['node-telegram-bot-api', 'node-cron'];
    for (const mod of keyModules) {
        if (fs.existsSync(path.join('node_modules', mod))) {
            console.log('   ✓ ' + mod);
        } else {
            console.log('   ✗ 缺失: ' + mod);
            errors++;
        }
    }
} else {
    console.log('   ✗ node_modules 不存在，请运行 npm install');
    errors++;
}

// 总结
console.log('\n=========================================');
console.log('诊断结果');
console.log('=========================================');

if (errors === 0 && warnings === 0) {
    console.log('✓ 所有检查通过！Bot 可以正常运行。');
    console.log('\n启动命令: npm start');
} else {
    if (errors > 0) {
        console.log('✗ 发现 ' + errors + ' 个错误，需要修复');
    }
    if (warnings > 0) {
        console.log('⚠ 发现 ' + warnings + ' 个警告');
    }
    console.log('\n请根据上方提示修复问题。');
}

console.log('=========================================\n');
process.exit(errors > 0 ? 1 : 0);
