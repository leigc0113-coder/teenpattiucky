# 🤖 AI 自动发帖系统 - Kimi API 集成

## ✅ 已完成集成

### 新增文件
| 文件 | 功能 |
|------|------|
| `aiContentGenerator.js` | Kimi API 内容生成器 |
| `AI_POSTING_GUIDE.md` | 使用文档 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `autoPost.js` | v4.0 升级，支持 AI 生成 + 模板降级 |
| `config.js` | 添加 KIMI_API_KEY / KIMI_API_URL / KIMI_MODEL 配置 |
| `.env.example` | 添加 Kimi API 环境变量示例 |

---

## 🚀 快速启用 AI 生成

### 方式 1: Kimi Code 平台 (https://www.kimi.com/code)

1. **获取 API Key**
   - 访问 https://www.kimi.com/code/console
   - 点击右上角头像 → Settings → API Keys
   - 创建新的 API Key

2. **配置环境变量**
   ```bash
   # 在 .env 文件中添加
   KIMI_API_KEY=your_kimi_code_api_key_here
   # Kimi Code 可能需要自定义 API URL，如果不确定可以先不设置
   # KIMI_API_URL=https://api.moonshot.cn/v1/chat/completions
   ```

### 方式 2: Moonshot 官方平台 (https://platform.moonshot.cn/)

1. **获取 API Key**
   - 访问 https://platform.moonshot.cn/
   - 注册/登录账号
   - 创建 API Key

2. **配置环境变量**
   ```bash
   # 在 .env 文件中添加
   KIMI_API_KEY=your_moonshot_api_key_here
   # 默认使用官方 API URL，无需额外设置
   ```

### 步骤 3: 重启机器人
```bash
npm start
```

启动时会显示：
```
[AIContentGenerator] Kimi API URL: https://api.moonshot.cn/v1/chat/completions
[AIContentGenerator] Kimi Model: moonshot-v1-8k
🤖 AI Content Generation: ENABLED (Kimi API)
```

---

## 📊 功能对比

| 功能 | 模板模式 | AI 模式 |
|------|---------|---------|
| 内容生成 | 固定模板 + 随机 | Kimi API 智能生成 |
| 多样性 | 有限 (20+ 模板) | 无限 (每次不同) |
| 数据融合 | ✅ 实时奖池/人数 | ✅ 实时数据 + 智能解读 |
| 双风格 | ✅ 频道/群组 | ✅ AI 分别优化 |
| 降级机制 | - | ✅ API 失败自动用模板 |

---

## 🎯 AI 生成提示词结构

### 频道风格 (广告/专业)
- 目标：转化导向
- 语气：专业、有说服力、紧迫感
- CTA：明确的行动号召

### 群组风格 (社群/朋友)
- 目标：互动导向
- 语气：自然、口语化、像朋友聊天
- 互动：包含问题，鼓励回复

---

## 📋 帖子类型

AI 支持生成以下类型帖子：
- `morning` - 早安帖
- `pool` - 奖池更新
- `countdown` - 开奖倒计时
- `winners` - 开奖结果
- `night` - 晚安帖
- `game` - 游戏推荐
- `tips` - 技巧分享

---

## 🧪 测试 AI 生成

使用管理员命令测试：
```
/testpost channel morning
/testpost group pool
/testpost channel countdown
```

---

## 🔧 配置选项

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `KIMI_API_KEY` | ✅ | - | Kimi API Key |
| `KIMI_API_URL` | ❌ | `https://api.moonshot.cn/v1/chat/completions` | API 端点 URL |
| `KIMI_MODEL` | ❌ | `moonshot-v1-8k` | 模型选择 |

### 模型选项

- `moonshot-v1-8k` - 标准版，性价比高 (推荐)
- `moonshot-v1-32k` - 长文本版
- `moonshot-v1-128k` - 超长文本版

---

## ⚠️ 注意事项

1. **API 费用**：Kimi API 按 token 计费，请监控使用量
2. **降级机制**：API 失败时自动使用模板，确保服务稳定
3. **响应时间**：AI 生成需要 1-3 秒，模板生成更快
4. **隐私**：API Key 不要提交到 Git，已添加到 `.gitignore`

---

## 🔧 故障排除

### 问题：AI 生成未启用
**症状**：启动显示 `⚠️ AI Content Generation: DISABLED`

**解决**：
1. 检查 `.env` 中 `KIMI_API_KEY` 是否设置
2. 重启服务
3. 检查控制台错误日志

### 问题：API 调用失败
**症状**：日志显示 `AI generation failed`

**解决**：
1. 检查 API Key 是否有效
2. 检查 `KIMI_API_URL` 是否正确（Kimi Code 平台可能需要不同 URL）
3. 检查网络连接
4. 系统会自动降级到模板模式

### 问题：如何找到正确的 API URL

**Moonshot 官方**:
```
https://api.moonshot.cn/v1/chat/completions
```

**Kimi Code 平台**:
- 访问 https://www.kimi.com/code/console
- 查看 API 文档获取正确的端点 URL
- 通常格式为 OpenAI-compatible API

---

## 📈 未来扩展

可添加的高级功能：
- [ ] A/B 测试优化
- [ ] 情感分析调整
- [ ] 节日自动营销
- [ ] 用户分层个性化
