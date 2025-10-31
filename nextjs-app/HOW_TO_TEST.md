# 🎮 完整测试指南 - 正确的使用方法

## ⚠️ 重要：访问控制说明

`calculateAverageValuation` 函数有访问控制：
```solidity
require(
    msg.sender == properties[propertyId].owner ||
    msg.sender == owner,
    "Not authorized"
);
```

**这意味着：你只能查看自己注册的物业的平均估值！**

---

## ✅ 正确的测试流程

### Step 1: 连接钱包
```
1. 点击 "Connect Wallet"
2. 选择 MetaMask
3. 批准连接
4. 确认在 Sepolia 网络
```

### Step 2: 注册物业（重要！）
```
1. 找到 "🏢 Register Property" 卡片
2. 填写表单：
   Area: 120
   Bedrooms: 3
   Bathrooms: 2
   Year Built: 2010
   Floor Level: 5
   Location Score: 85
3. 点击 "Register Property"
4. 确认 MetaMask 交易
5. ⚠️ 记下 Property ID（从成功消息或交易日志）
```

**获取 Property ID 的方法：**
- 方式 1：成功消息会显示 Property ID
- 方式 2：在 MetaMask 查看交易详情
- 方式 3：使用 "View My Properties" 查看
- 方式 4：访问 Sepolia Etherscan 查看事件日志

### Step 3: 授权自己为评估师
```
1. 找到 "👨‍💼 Admin Functions" 卡片
2. 复制你的钱包地址
3. 粘贴到 "Valuator Address"
4. 点击 "Authorize Valuator"
5. 确认交易
```

### Step 4: 提交估值
```
1. 找到 "📝 Submit Valuation" 卡片
2. 填写：
   Property ID: [你的 Property ID]
   Estimated Value: 500000
   Confidence Score: 90
3. 点击 "Submit Valuation"
4. 确认交易
```

### Step 5: 查看平均值（现在可以用了！）
```
1. 找到 "🔍 Valuation Management" 卡片
2. 输入你注册的 Property ID
3. 点击 "Get Average Valuation"
4. ✅ 现在应该能看到结果了！
```

---

## 🎯 为什么会出现 "Not authorized" 错误？

### 原因 1: Property ID 不是你的
```
❌ 你输入了 "1"
✅ 但 Property ID 1 是别人注册的

解决方案：只使用你自己注册的 Property ID
```

### 原因 2: Property ID 不存在
```
❌ 你输入了 "999"
✅ 但还没有人注册 Property ID 999

解决方案：先注册一个物业
```

### 原因 3: 你不是合约 owner
```
❌ 你想查看别人的物业估值
✅ 合约不允许

解决方案：只查看自己的物业
```

---

## 📊 完整测试场景

### 场景 A: 首次使用
```
1. 连接钱包 ✅
2. 尝试查询 Property ID 1 ❌ "Not authorized"
   → 因为这不是你的物业

3. 注册自己的物业 ✅ 得到 Property ID 2
4. 授权自己为评估师 ✅
5. 提交估值 ✅
6. 查询 Property ID 2 ✅ 成功！
```

### 场景 B: 多个物业
```
1. 注册第一个物业 → Property ID 3
2. 注册第二个物业 → Property ID 4
3. 提交 Property ID 3 的估值
4. 提交 Property ID 4 的估值
5. 查询 Property ID 3 ✅ 能看到
6. 查询 Property ID 4 ✅ 能看到
7. 查询 Property ID 1 ❌ 不能看（不是你的）
```

---

## 🔍 如何获取 Property ID

### 方式 1: 从成功消息
```
注册物业后，会显示：
"Property registered successfully! Property ID: 5"

记下这个 ID: 5
```

### 方式 2: 使用 View Properties
```
1. 找到 "📋 View My Properties" 卡片
2. 点击 "Get My Properties"
3. 会列出你所有的物业 ID
```

### 方式 3: 查看 MetaMask 交易
```
1. MetaMask → Activity
2. 找到 "Register Property" 交易
3. 点击查看详情
4. 在 "Data" 或 "Logs" 中找到 Property ID
```

### 方式 4: Sepolia Etherscan
```
1. 访问 Sepolia Etherscan
2. 搜索你的地址
3. 找到 "Register Property" 交易
4. 查看 "Logs" 标签
5. PropertyRegistered 事件会显示 Property ID
```

---

## 💡 测试技巧

### 技巧 1: 记录 Property ID
```
注册物业后，马上记录：

我的物业：
- Property ID 5: 120 sqft, 3 bed
- Property ID 6: 150 sqft, 4 bed
```

### 技巧 2: 测试多个估值
```
为同一个物业提交多个估值：
1. Property ID 5, Value: 500000, Confidence: 90
2. Property ID 5, Value: 520000, Confidence: 85
3. Property ID 5, Value: 480000, Confidence: 95

然后查询平均值，应该看到：
Average Value: 500000 (大约)
Average Confidence: 90 (大约)
Count: 3
```

### 技巧 3: 使用浏览器控制台
```
F12 → Console

输入：
window.myPropertyIds = [5, 6]

记录你的 Property IDs
```

---

## ⚠️ 常见错误和解决方案

### 错误 1: "Not authorized"
```
原因：Property ID 不是你的或不存在
解决：使用自己注册的 Property ID
```

### 错误 2: "Property not active"
```
原因：Property ID 不存在
解决：先注册物业
```

### 错误 3: "Not authorized valuator"
```
原因：没有授权为评估师
解决：使用 Admin Functions 授权
```

### 错误 4: "No revealed valuations"
```
原因：这不是错误！这是正常结果
说明：因为没有 KMS Gateway，估值未被 reveal
      但这不影响功能演示
```

---

## 🎉 成功标准

### 成功测试应该看到：

#### 1. 注册物业
```
✅ Transaction confirmed
✅ Property ID: X
```

#### 2. 授权评估师
```
✅ Transaction confirmed
✅ You are now authorized
```

#### 3. 提交估值
```
✅ Transaction confirmed
✅ Valuation submitted
```

#### 4. 查询平均值
```
✅ No revealed valuations
   Total valuations: 1

   或（如果有 KMS）：

✅ Average Value: $500000
   Average Confidence: 90%
   Number of Valuations: 1
```

---

## 📝 完整测试检查清单

### 准备工作
- [ ] MetaMask 已安装
- [ ] 连接到 Sepolia 网络
- [ ] 有 Sepolia ETH（至少 0.01）
- [ ] 钱包已连接到应用

### 核心功能测试
- [ ] 注册第一个物业
- [ ] 记录 Property ID
- [ ] 授权自己为评估师
- [ ] 提交第一个估值
- [ ] 查询自己物业的平均值 ✅
- [ ] 尝试查询不存在的 Property ID ❌

### 高级测试
- [ ] 注册第二个物业
- [ ] 为第一个物业提交第二个估值
- [ ] 查看估值数量增加
- [ ] 使用 View Properties 查看列表
- [ ] 撤销评估师授权（如果需要）

---

## 🚀 快速测试脚本

### 如果你想快速测试，按这个顺序：

```
1. 连接钱包
   ↓
2. Register Property
   填写任意数据 → Submit
   ↓
3. 记下 Property ID (例如: 7)
   ↓
4. Admin Functions
   输入你的地址 → Authorize
   ↓
5. Submit Valuation
   Property ID: 7
   Value: 500000
   Confidence: 90
   → Submit
   ↓
6. Valuation Management
   Property ID: 7
   → Get Average
   ↓
7. ✅ 成功！看到结果
```

---

## 🎯 关键要点

### ✅ 正确理解：
```
1. 访问控制是故意的设计
2. 只能查看自己的物业
3. 需要先注册物业才能查询
4. "Not authorized" 不是 bug
```

### ❌ 常见误解：
```
1. "我授权了地址，为什么还不能查询？"
   → 授权是为了提交估值，不是查询

2. "为什么 Property ID 1 不能查？"
   → 因为那不是你的物业

3. "是不是合约有问题？"
   → 不是，合约正常工作
```

---

**现在按照上面的步骤重新测试！** 🎮✨

**关键：一定要使用你自己注册的 Property ID！**
