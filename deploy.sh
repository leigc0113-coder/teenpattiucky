#!/bin/bash
# 部署脚本 - 自动设置 Bot

echo "========================================="
echo "Teen Patti Lucky Bot - 部署脚本"
echo "========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org/ 下载安装"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"

# 安装依赖
echo ""
echo "正在安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

echo "✓ 依赖安装完成"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "警告: 未找到 .env 文件"
    
    if [ -f .env.example ]; then
        echo "正在从 .env.example 创建..."
        cp .env.example .env
        echo ""
        echo "⚠️  请编辑 .env 文件，填入真实配置:"
        echo "   - BOT_TOKEN"
        echo "   - ADMIN_IDS"
        echo ""
        echo "编辑完成后再次运行此脚本"
        exit 0
    else
        echo "错误: 未找到 .env.example 文件"
        exit 1
    fi
fi

# 检查 BOT_TOKEN
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo ""
    echo "⚠️  警告: .env 文件中还是示例配置"
    echo "请编辑 .env 文件，填入真实的 BOT_TOKEN"
    exit 0
fi

# 创建数据目录
echo ""
echo "创建数据目录..."
mkdir -p data
echo "✓ 数据目录已创建"

# 测试启动
echo ""
echo "测试启动 Bot..."
timeout 5 node bot.js &
PID=$!
sleep 3

if ps -p $PID > /dev/null; then
    echo "✓ Bot 启动成功!"
    kill $PID 2>/dev/null
    echo ""
    echo "========================================="
    echo "部署完成!"
    echo "========================================="
    echo ""
    echo "启动命令:"
    echo "  前台运行: npm start"
    echo "  后台运行: nohup npm start &"
    echo "  PM2运行:  pm2 start bot.js"
    echo ""
else
    echo "✗ Bot 启动失败，请检查错误信息"
    exit 1
fi
