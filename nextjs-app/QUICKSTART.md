# ⚡ 5分钟快速启动指南

## 1️⃣ 启动开发服务器（30秒）

\`\`\`bash
cd /nextjs-app
npm run dev
\`\`\`

✅ 访问: **http://localhost:3000**

---

## 2️⃣ 配置 WalletConnect（2分钟）

### 获取 Project ID

1. 访问: https://cloud.walletconnect.com
2. 点击 "Create New Project"
3. 输入项目名称: `Confidential Property Valuation`
4. 复制 **Project ID**

### 创建环境变量文件

\`\`\`bash
# 在 nextjs-app 目录创建 .env.local
echo NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=你的_PROJECT_ID > .env.local
\`\`\`

### 重启开发服务器

\`\`\`bash
# Ctrl+C 停止服务器
npm run dev
\`\`\`

---

## 3️⃣ 测试功能（2分钟）

### A. 连接钱包
1. 点击 "Connect Wallet"
2. 选择 MetaMask
3. 确认连接
4. 切换到 Sepolia 测试网

### B. 注册物业
1. 填写物业信息:
   - Area: 120
   - Bedrooms: 3
   - Bathrooms: 2
   - Year Built: 2010
   - Floor Level: 5
   - Location Score: 85
2. 点击 "Register Property"
3. 确认 MetaMask 交易

### C. 授权评估师
1. 复制你的钱包地址
2. 粘贴到 "Valuator Address"
3. 点击 "Authorize Valuator"
4. 确认交易

### D. 提交估值
1. Property ID: 1
2. Estimated Value: 500000
3. Confidence Score: 90
4. 点击 "Submit Valuation"

---

## 4️⃣ 部署到 Vercel（1分钟）

### 使用 Vercel CLI

\`\`\`bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 添加环境变量后部署到生产
vercel --prod
\`\`\`

### 或使用 GitHub + Dashboard

\`\`\`bash
# 推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# 然后访问 vercel.com 导入仓库
\`\`\`

---

## 🎉 完成！

你的 Next.js dApp 现在运行在:
- **本地**: http://localhost:3000
- **生产**: https://YOUR_PROJECT.vercel.app

---

## 📝 命令速查

\`\`\`bash
# 开发
npm run dev          # 启动开发服务器

# 生产
npm run build        # 构建生产版本
npm start            # 运行生产服务器

# 部署
vercel               # 部署到 Vercel
vercel --prod        # 部署到生产环境
\`\`\`

---

## 🔧 故障排除

### RainbowKit 不显示？
\`\`\`bash
# 检查环境变量
cat .env.local

# 确保格式正确
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
\`\`\`

### 端口被占用？
\`\`\`bash
# 使用不同端口
npm run dev -- -p 3001
\`\`\`

### 编译错误？
\`\`\`bash
# 清理缓存
rm -rf .next
npm run dev
\`\`\`

---

**需要帮助？** 查看 [README.md](./README.md) 或 [DEPLOYMENT.md](./DEPLOYMENT.md)
