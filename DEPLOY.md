# Teen Patti Lucky Bot - 完整部署指南

## 快速部署检查清单

### 1. 部署前准备

确保你有：
- [ ] Telegram Bot Token (@BotFather 获取)
- [ ] 你的 Telegram User ID
- [ ] 服务器/VPS (或本地电脑保持运行)

### 2. 配置文件

创建 `.env` 文件：
```
BOT_TOKEN=你的真实BotToken
ADMIN_IDS=你的TelegramID
ADMIN_GROUP_ID=(可选)
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动 Bot

```bash
npm start
```

---

## 常见问题排查

### 问题1: Bot 不响应
- 检查 `.env` 中的 `BOT_TOKEN` 是否正确
- 检查是否运行了 `npm install`
- 查看控制台错误信息

### 问题2: 数据丢失
- `data/` 文件夹必须在项目目录中
- 不要删除 `data/` 文件夹内的 JSON 文件

### 问题3: 管理员收不到审核通知
- 确认 `ADMIN_IDS` 设置正确
- ID 必须是数字，没有引号
- 获取方法：@userinfobot

---

## 生产环境部署 (VPS)

### 使用 PM2 保持运行

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start bot.js --name "teenpatti-bot"

# 保存配置
pm2 save
pm2 startup
```

### 使用 Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p data
CMD ["node", "bot.js"]
```

---

## GitHub 部署注意事项

1. **不要上传 .env 文件** - 包含敏感信息
2. **不要上传 data/ 文件夹** - 运行时自动生成
3. **不要上传 node_modules/** - 运行 `npm install` 生成
4. **必须上传 .env.example** - 作为配置模板

---

## 首次部署步骤

```bash
# 1. 克隆仓库
git clone https://github.com/你的用户名/teenpatti-lucky-bot.git
cd teenpatti-lucky-bot

# 2. 安装依赖
npm install

# 3. 创建配置文件
cp .env.example .env
# 编辑 .env，填入真实值

# 4. 创建数据目录
mkdir -p data

# 5. 启动
npm start
```

---

## 功能验证清单

部署后测试：
- [ ] /start 命令正常
- [ ] 用户注册成功
- [ ] 充值截图上传成功
- [ ] 管理员收到审核通知
- [ ] 审核后用户收到号码
- [ ] 奖池显示正常
- [ ] /myaccount 显示正常

---

## 技术支持

如果还有问题，检查：
1. Node.js 版本 >= 18
2. 所有依赖安装成功
3. .env 文件配置正确
4. data/ 目录有写入权限
