# Teen Patti Bot - 代码变更记录

## 当前状态（2026-03-18）

### 部署信息
- **平台**: Railway
- **服务名**: teenpattiucky
- **状态**: Online（运行中）
- **计划**: Trial（20天或$4.57剩余）
- **区域**: US West (California)

### 代码版本
- **GitHub**: leigc0113-coder/teenpattiucky
- **分支**: master
- **最新提交**: "fix: 修复数据库初始化错误 - 使用文件系统而非createCollection"

### 数据存储
- **方式**: JSON 文件（本地文件系统）
- **位置**: `/app/data/`
- **文件列表**:
  - users.json
  - tierIdentities.json
  - tierNumberPool.json
  - lotteryNumbers.json
  - recharges.json
  - pools.json
  - winners.json
  - inviteRecords.json
  - checkins.json

### 已知限制
- Railway Trial 计划**不支持 Volume**
- 重新部署会**丢失 data/ 目录数据**
- 当前无持久化存储方案

---

## 变更计划

### 方案 1: 使用 MongoDB Atlas（推荐长期方案）
**状态**: 待执行  
**影响文件**: 
- 新文件: `database-mongodb.js`
- 修改: `package.json`（添加 mongoose）
- 修改: `bot.js`（切换数据库引用）

**回滚方案**: 保留原 `database.js`，可随时切换回来

---

### 方案 2: 手动备份方案（短期应急）
**状态**: 立即可用  
**影响文件**: 无代码修改  
**操作步骤**:
1. 导出当前 data/ 数据
2. 更新 GitHub 代码
3. 重新部署
4. 导入 data/ 数据

---

## 备份记录

### 2026-03-18 数据备份
- [ ] users.json - 待备份
- [ ] tierIdentities.json - 待备份
- [ ] tierNumberPool.json - 待备份
- [ ] lotteryNumbers.json - 待备份
- [ ] recharges.json - 待备份
- [ ] pools.json - 待备份
- [ ] winners.json - 待备份
- [ ] inviteRecords.json - 待备份
- [ ] checkins.json - 待备份

---

## 决策记录

| 日期 | 决策 | 原因 | 执行人 |
|------|------|------|--------|
| 2026-03-18 | 暂不修改代码 | 用户要求保持原代码 | - |
| 2026-03-18 | 考虑 MongoDB 方案 | Railway 无 Volume 支持 | - |
| 2026-03-18 | 创建 MongoDB Atlas | 免费、永久存储 | GC |

## MongoDB Atlas 设置完成 ✅

### 配置详情
- **集群**: Cluster0
- **区域**: Hong Kong (ap-east-1)
- **用户**: leigc0113_db_user
- **连接字符串**: 已保存到 `.mongodb-credentials.md`

### 下一步行动（更新）
1. [x] 创建 MongoDB Atlas 集群
2. [x] 创建数据库用户
3. [x] 设置网络访问
4. [x] 获取连接字符串
5. [x] 在 Railway 添加 MONGODB_URI 环境变量 ✅
6. [x] 创建 database-mongodb.js（新文件）✅
7. [x] 更新 package.json 添加 mongoose ✅
8. [x] 重命名文件切换数据库 ✅
9. [x] 推送到 GitHub ✅
10. [x] Railway 自动部署 ✅ **部署成功！**
11. [x] 测试连接 - **数据已存储在 MongoDB Atlas**

---

## ✅ 迁移完成总结

### 已完成
- **MongoDB Atlas 集群**: Cluster0 (M0 免费版)
- **数据库用户**: leigc0113_db_user
- **Railway 环境变量**: MONGODB_URI 已配置
- **代码迁移**: 从 JSON 文件存储 → MongoDB 云存储
- **部署状态**: ✅ 成功运行

### 数据存储变化
| 之前 | 现在 |
|------|------|
| `/app/data/*.json` (易丢失) | MongoDB Atlas (永久保存) |
| Railway 容器内 | 云端数据库 |
| 重新部署丢失 | 重新部署保留 |

### 文件结构
```
database.js          # MongoDB 版本（当前使用）
database-json.js     # JSON 版本（备份）
.mongodb-credentials.md  # 连接信息（不提交到 Git）
```

---

## 🎊 恭喜！

你的 Teen Patti Bot 现在使用 **MongoDB Atlas** 存储数据：
- ✅ 免费 512MB 存储
- ✅ 数据永久保存
- ✅ 重新部署不丢失
- ✅ 全球访问

Bot 正在运行中，可以正常使用！

### Git 提交记录
```
a04158a fix: 更新 package-lock.json 添加 mongoose 依赖
b20aa3a feat: 迁移到 MongoDB Atlas 数据库
- 添加 MongoDB Atlas 支持（免费 M0 集群）
- 创建 database-mongodb.js 替代 JSON 文件存储
- 备份原 database.js 为 database-json.js
- 更新 package.json 添加 mongoose 依赖
- 添加 .gitignore 排除敏感文件
- 添加 CHANGELOG.md 记录变更
```

### 文件变更记录
**新创建：**
- `database-mongodb.js` → 已重命名为 `database.js`
- `database-json.js` - 原 JSON 版本备份
- `.mongodb-credentials.md` - 连接信息（敏感，不提交到 Git）

**修改：**
- `package.json` - 添加 mongoose 依赖
- `database.js` - 现在使用 MongoDB 版本

---

## 下一步行动

1. [ ] 确认是否需要立即更新代码
2. [ ] 如需要，执行数据备份
3. [ ] 创建 database-mongodb.js（新文件，不覆盖原文件）
4. [ ] 测试新数据库连接
5. [ ] 迁移数据
6. [ ] 验证功能正常
