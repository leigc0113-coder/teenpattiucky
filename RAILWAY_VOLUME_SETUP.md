# Railway Volume 配置指南

## 1. 在 Railway Dashboard 添加 Volume

1. 打开你的项目: https://railway.app/project/xxx
2. 点击 ** teenpatti-lucky-bot ** 服务
3. 选择 **Volumes** 标签
4. 点击 **+ New Volume**
5. 配置:
   - Mount Path: `/app/data`
   - Size: 1GB (足够用)

## 2. 修改代码适配 Volume

修改 `database.js` 的 DATA_DIR:

```javascript
// 原来
const DATA_DIR = path.join(__dirname, 'data');

// 改为 (适配 Railway Volume)
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? '/app/data' 
    : path.join(__dirname, 'data');
```

## 3. 添加环境变量

在 Railway Dashboard → Variables 添加:
```
RAILWAY_VOLUME_MOUNT_PATH = /app/data
```

## 4. 重新部署

数据将持久化到 Volume 中！

---

## 替代方案：MongoDB Atlas (更稳定)

### 1. 注册 MongoDB Atlas (免费)
https://www.mongodb.com/atlas

### 2. 创建集群和数据库

### 3. 获取连接字符串
```
mongodb+srv://username:password@cluster0.xxx.mongodb.net/teenpatti?retryWrites=true&w=majority
```

### 4. 添加到 Railway 环境变量
```
MONGODB_URI = your_connection_string
```

### 5. 修改 database.js 使用 MongoDB
```javascript
const mongoose = require('mongoose');

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI);

// 定义 Schema
const UserSchema = new mongoose.Schema({
    telegramId: Number,
    gameId: String,
    // ...
});

module.exports = {
    users: mongoose.model('User', UserSchema),
    // ...
};
```

---

## 快速选择

| 方案 | 难度 | 稳定性 | 成本 |
|------|-----|--------|------|
| Railway Volume | 简单 | ⭐⭐⭐ | 免费 |
| MongoDB Atlas | 中等 | ⭐⭐⭐⭐⭐ | 免费额度 |
| 本地 JSON 备份 | 简单 | ⭐⭐ | 免费 |

---

## 立即执行

如果你现在就要更新代码，**必须先备份数据**！

```bash
# 在 Railway Shell 中运行
cd /app/data
zip -r backup.zip *.json
# 下载 backup.zip
```

然后:
1. 添加 Volume
2. 上传备份文件到 Volume
3. 重新部署

数据就不会丢失了！
