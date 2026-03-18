# 版本回退指南

## 📌 当前稳定版本

**标签**: `v1.0-stable`  
**提交哈希**: `e8d092f`  
**备份时间**: 2026-03-18 22:00  
**状态**: ✅ 可运行，功能正常

---

## 🔄 回退方法

### 方法1：本地回退（推荐测试用）

```bash
# 1. 进入项目目录
cd teenpatti-lucky-bot

# 2. 查看当前状态
git status

# 3. 回退到稳定版本（保留修改）
git reset --soft v1.0-stable

# 或 完全回退（丢弃所有修改）
git reset --hard v1.0-stable

# 4. 强制推送到远程（谨慎使用！）
git push origin master --force
```

---

### 方法2：Railway 控制台回退（推荐生产环境）

**步骤1**: 打开 Railway Dashboard  
👉 https://railway.com/project/d1aaea53-3a71-4a78-a5a7-550b6d6aba1e/service/415dda3c-8446-42ad-a625-6981ad77d799

**步骤2**: 在 "Deployments" 标签中找到想要回退的版本

**步骤3**: 点击 "Redeploy" 按钮重新部署该版本

---

### 方法3：GitHub 回退

**步骤1**: 打开 GitHub 仓库  
👉 https://github.com/leigc0113-coder/teenpattiucky

**步骤2**: 进入 "Commits" 页面

**步骤3**: 找到稳定版本 `e8d092f`

**步骤4**: 点击右侧的 "..." → "Revert"

**步骤5**: 创建 Pull Request 并合并

---

## 📋 重构版本信息

**重构分支**: `feature/menu-rebuild` (即将创建)  
**目标**: 实施完整菜单重构方案  
**影响文件**:
- `menuContent.i18n.js`
- `menuRouter.i18n.js`
- `bot.js` (Help 菜单部分)

---

## ⚠️ 回退前检查清单

回退前请确认：
- [ ] 已备份数据库（如有重要数据）
- [ ] 已通知用户（如影响大）
- [ ] 已记录当前问题（便于修复）

---

## 🆘 紧急回退（如果部署后服务崩溃）

**最快方式**:
1. 进入 Railway Dashboard
2. 找到上一个稳定部署
3. 点击 "Redeploy"
4. 等待 1-2 分钟完成

---

## 📞 需要帮助？

如果回退过程中遇到问题：
1. 查看 Railway Logs 找错误信息
2. 检查 MongoDB 连接状态
3. 确认环境变量配置

---

**最后更新**: 2026-03-18  
**维护者**: GC
