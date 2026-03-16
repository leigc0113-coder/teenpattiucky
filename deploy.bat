@echo off
chcp 65001 > nul
echo =========================================
echo Teen Patti Lucky Bot - 部署脚本
echo =========================================

:: 检查 Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo 错误: 未安装 Node.js
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

echo [OK] Node.js 版本:
node --version

:: 安装依赖
echo.
echo 正在安装依赖...
call npm install

if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo [OK] 依赖安装完成

:: 检查 .env 文件
if not exist .env (
    echo.
    echo 警告: 未找到 .env 文件
    
    if exist .env.example (
        echo 正在从 .env.example 创建...
        copy .env.example .env
        echo.
        echo ⚠️  请编辑 .env 文件，填入真实配置:
        echo    - BOT_TOKEN
        echo    - ADMIN_IDS
        echo.
        echo 编辑完成后再次运行此脚本
        pause
        exit /b 0
    ) else (
        echo 错误: 未找到 .env.example 文件
        pause
        exit /b 1
    )
)

:: 检查 BOT_TOKEN
findstr "YOUR_BOT_TOKEN_HERE" .env > nul
if not errorlevel 1 (
    echo.
    echo ⚠️  警告: .env 文件中还是示例配置
    echo 请编辑 .env 文件，填入真实的 BOT_TOKEN
    pause
    exit /b 0
)

:: 创建数据目录
echo.
echo 创建数据目录...
if not exist data mkdir data
echo [OK] 数据目录已创建

:: 测试启动
echo.
echo 测试启动 Bot...
echo 按 Ctrl+C 停止测试...
timeout /t 3 > nul
node bot.js

echo.
echo =========================================
echo 部署完成!
echo =========================================
echo.
echo 启动命令:
echo   npm start
echo.
pause
