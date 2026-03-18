# MongoDB Atlas 设置指南 - Teen Patti Bot

## 第一步：注册 MongoDB Atlas

1. 访问 👉 https://www.mongodb.com/atlas
2. 点击 **"Try Free"** 或 **"Start Free"**
3. 使用以下方式注册：
   - Google 账号（推荐）
   - 或邮箱注册
4. 验证邮箱

---

## 第二步：创建集群

1. 登录后点击 **"Create"** 创建新集群
2. 选择 **M0 (Free Tier)** - 永久免费
3. 配置：
   - **Cloud Provider**: AWS
   - **Region**: 选择离你近的（如 Mumbai/ap-south-1）
   - **Cluster Name**: `teenpatti-cluster`
4. 点击 **"Create Deployment"**

⏱️ 等待 1-3 分钟集群创建完成...

---

## 第三步：创建数据库用户

1. 在左侧菜单点击 **"Database Access"**
2. 点击 **"Add New Database User"**
3. 配置：
   - **Authentication Method**: Password
   - **Username**: `teenpatti_user`
   - **Password**: 生成一个强密码（保存好！）
   - **Database User Privileges**: `Read and write to any database`
4. 点击 **"Add User"**

---

## 第四步：设置网络访问

1. 在左侧菜单点击 **"Network Access"**
2. 点击 **"Add IP Address"**
3. 选择 **"Allow Access from Anywhere"**（0.0.0.0/0）
   - 这是为了让 Railway 能连接
   - 也可以只添加 Railway 的 IP
4. 点击 **"Confirm"**

---

## 第五步：获取连接字符串

1. 回到 **"Database"** 页面
2. 点击你的集群 **"Connect"** 按钮
3. 选择 **"Drivers"**
4. 选择 **Node.js** 和版本 **5.5 or later**
5. 复制连接字符串：

```
mongodb+srv://teenpatti_user:<password>@teenpatti-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=teenpatti-cluster
```

6. 将 `<password>` 替换为你的实际密码

---

## 第六步：添加到 Railway 环境变量

1. 打开 Railway Dashboard
2. 进入你的项目 → 服务 → **Variables**
3. 添加新变量：
   - **Key**: `MONGODB_URI`
   - **Value**: 上面的连接字符串
4. 点击 **"Add"**

---

## 第七步：修改代码（我来帮你）

我会创建一个新的 `database-mongodb.js` 文件，替换现有的 `database.js`。

代码结构：
- 使用 Mongoose ORM
- 所有集合自动同步到 MongoDB
- 保留现有 API（完全兼容）

---

## 第八步：数据迁移

在 Railway Shell 中执行：

```bash
# 导出当前数据
cd /app/data
cat users.json
# ... 复制所有文件内容
```

然后使用脚本导入到 MongoDB。

---

## 费用说明

- **M0 免费版**: 512MB 存储，足够用几年
- 如果数据量大，可以升级到 M2 ($9/月)
- 你的 Bot 数据量很小，免费版完全够用

---

## 下一步

1. 你先完成第 1-5 步（注册和创建集群）
2. 拿到连接字符串后发给我
3. 我帮你修改代码并迁移数据

有问题随时问我！🚀
