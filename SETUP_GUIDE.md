# 🚀 完整配置指南 - 5分钟设置

## ✅ 第一步: 获取 WalletConnect Project ID

### 为什么需要？
- RainbowKit 钱包连接需要
- 提供更好的用户体验
- 支持多种钱包

### 操作步骤：

1. **访问 WalletConnect Cloud**
   ```
   https://cloud.walletconnect.com
   ```

2. **注册/登录账号**
   - 使用 GitHub 登录（推荐）
   - 或使用邮箱注册

3. **创建新项目**
   - 点击 "Create New Project"
   - 项目名称: `Confidential Property Valuation`
   - 点击 "Create"

4. **复制 Project ID**
   ```
   看起来像这样：
   1234567890abcdef1234567890abcdef
   ```

5. **保存备用**
   - 复制到记事本
   - 马上要用到

---

## ✅ 第二步: 配置环境变量

### 方式 1: 自动配置（推荐）

我已经创建了 `.env.local` 文件，你只需要替换 Project ID：

**当前内容：**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder_replace_with_actual_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbc70aFE54495D028586f7E77c257359F1FDf6483
NEXT_PUBLIC_CHAIN_ID=11155111
```

**修改步骤：**
1. 打开文件: `\nextjs-app\.env.local`
2. 将 `placeholder_replace_with_actual_id` 替换为你的 Project ID
3. 保存文件

**修改后应该是：**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的真实Project_ID
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbc70aFE54495D028586f7E77c257359F1FDf6483
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 方式 2: 临时测试（不推荐）

如果你只是想快速测试，可以暂时跳过这一步。应用会使用占位符 ID，虽然会有警告，但基本功能仍然可用。

---

## ✅ 第三步: 重启开发服务器

**必须重启才能加载新的环境变量！**

### Windows:
```bash
# 在当前终端按 Ctrl+C 停止服务器
# 然后运行：
cd D:\nextjs-app
npm run dev
```

### 或者让我帮你重启

告诉我 "重启服务器"，我会帮你操作。

---

## ✅ 第四步: 验证配置

### 打开应用
```
http://localhost:1211
```

### 检查清单

#### 1. 检查控制台（F12）
```
✅ 不应该看到：
   "Warning: Missing WalletConnect projectId"

❌ 如果看到警告：
   说明 .env.local 未正确配置
   或服务器未重启
```

#### 2. 测试连接钱包
```
1. 点击 "Connect Wallet"
2. 应该看到 RainbowKit 模态框
3. 选择 MetaMask
4. 批准连接
5. ✅ 钱包地址显示在顶部
```

#### 3. 检查 Debug Information
```
应该显示：
✅ Connection Status: Connected
✅ Wallet Address: 0x你的地址
✅ Current Chain ID: 11155111 (Sepolia ✅)
```

#### 4. 测试核心功能
```
✅ Register Property - 可以填写并提交
✅ Submit Valuation - 可以提交估值
✅ View Properties - 可以查看列表
✅ Get Average - 可以查询（虽然返回空）
```

---

## 🔧 配置文件说明

### .env.local (本地开发)
```env
# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的ID

# 合约地址（已部署在 Sepolia）
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbc70aFE54495D028586f7E77c257359F1FDf6483

# Sepolia 链 ID
NEXT_PUBLIC_CHAIN_ID=11155111
```

### .env.example (模板文件)
```env
# 这是模板文件
# 给其他人使用
# 不要在这里放真实 ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbc70aFE54495D028586f7E77c257359F1FDf6483
NEXT_PUBLIC_CHAIN_ID=11155111
```

---

## 🌐 Vercel 部署配置

### 如果你要部署到 Vercel

#### 1. 准备 Git 仓库
```bash
cd D:\nextjs-app
git init
git add .
git commit -m "Initial commit: Confidential Property Valuation"
```

#### 2. 推送到 GitHub
```bash
# 创建 GitHub 仓库后
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

#### 3. 导入到 Vercel
```
1. 访问 https://vercel.com
2. 点击 "Import Project"
3. 选择你的 GitHub 仓库
4. 配置环境变量
```

#### 4. 添加环境变量
```
在 Vercel 项目设置中添加：

Name: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
Value: 你的真实Project_ID

Name: NEXT_PUBLIC_CONTRACT_ADDRESS
Value: 0xbc70aFE54495D028586f7E77c257359F1FDf6483

Name: NEXT_PUBLIC_CHAIN_ID
Value: 11155111
```

#### 5. 部署
```
点击 "Deploy" 按钮
等待 2-3 分钟
获得你的生产 URL
```

---

## 🔒 安全最佳实践

### ✅ 可以公开的
- `NEXT_PUBLIC_*` 开头的变量
- 合约地址
- 链 ID
- WalletConnect Project ID

### ❌ 不要公开的
- 私钥（永远不要放在代码里！）
- API 密钥（后端使用的）
- 数据库密码

### 📝 .gitignore 已配置
```
# 以下文件不会被 Git 跟踪
.env.local
.env*.local
node_modules/
.next/
```

---

## 🎯 配置完成检查

### 全部完成后，你应该有：

#### 文件
- [x] `.env.local` 有真实的 Project ID
- [x] `.env.example` 保持模板格式
- [x] `.gitignore` 包含 `.env.local`

#### 服务
- [x] Next.js 开发服务器运行中
- [x] 端口 1211 可访问
- [x] 没有控制台错误

#### 功能
- [x] 连接钱包正常
- [x] Debug Information 显示正确
- [x] 所有组件可交互
- [x] 表单可以提交

---

## 🐛 常见问题

### Q1: 修改 .env.local 后没有生效
```
A: 必须重启开发服务器
   Ctrl+C 停止
   npm run dev 重启
```

### Q2: 找不到 .env.local 文件
```
A: 文件可能被隐藏
   Windows: 文件管理器 → 查看 → 勾选"隐藏的项目"
   或者新建一个：
   在 nextjs-app 目录创建文件 .env.local
```

### Q3: WalletConnect 仍然显示警告
```
A: 检查 Project ID 格式
   - 应该是 32 位十六进制字符串
   - 不要有引号
   - 不要有空格

   正确: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456
   错误: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="abc123def456"
   错误: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc 123 def
```

### Q4: 如何获取免费的 WalletConnect Project ID
```
A: WalletConnect Cloud 是免费的
   1. 访问 https://cloud.walletconnect.com
   2. 使用 GitHub 登录
   3. 创建项目
   4. 复制 Project ID

   无需信用卡
   无需付费
   每月有足够的免费配额
```

### Q5: 可以不配置 WalletConnect 吗？
```
A: 可以，但不推荐

   不配置的影响：
   - ⚠️ 控制台会有警告
   - ⚠️ 某些钱包可能不可用
   - ✅ MetaMask 仍然可以工作
   - ✅ 核心功能不受影响

   建议：花 2 分钟配置一下
```

---

## 📚 配置后的下一步

### 1. 测试所有功能
```
按照 TESTING_GUIDE.md 测试每个功能
确保一切正常工作
```

### 2. 准备演示
```
录制演示视频
截图关键功能
准备解释文档
```

### 3. 部署到 Vercel
```
按照 DEPLOYMENT.md 部署
获得公开访问 URL
分享给评委或用户
```

### 4. 提交竞赛
```
准备 GitHub 仓库
编写完整的 README
提交到 Zama 竞赛
```

---

## 🎉 配置完成！

完成以上步骤后，你的应用就完全配置好了！

**核心配置只需要 1 个步骤：**
1. 获取并配置 WalletConnect Project ID

**其他一切都已经配置好：**
- ✅ Next.js 配置
- ✅ TypeScript 配置
- ✅ Tailwind CSS
- ✅ 合约 ABI
- ✅ Wagmi 配置
- ✅ RainbowKit 主题
- ✅ Vercel 配置

---

**需要帮助配置？告诉我你卡在哪一步！** 🚀
