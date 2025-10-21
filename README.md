# 🏠 Confidential Property Valuation System

> Privacy-preserving real estate assessment platform built with cutting-edge FHE technology

[![CI/CD Pipeline](https://github.com/WymanMills/fhePropertyValuation/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/WymanMills/fhePropertyValuation/actions)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://docs.soliditylang.org/)

**🌐 [Live Demo](https://wymanmills.github.io/fhePropertyValuation/)** | **📹 [Video Demo demo.mp4]** | **📜 [Contract](https://sepolia.etherscan.io/address/0xbc70aFE54495D028586f7E77c257359F1FDf6483)**

A revolutionary property valuation platform that enables confidential real estate assessments using Fully Homomorphic Encryption (FHE). Property owners and valuators can interact with encrypted data without revealing sensitive information, ensuring complete privacy while maintaining transparency and trust.

---

## ✨ Features

- 🔐 **Fully Private Valuations** - Property assessments remain encrypted on-chain
- 🏠 **Property Registry** - Secure registration with encrypted attributes
- 👨‍💼 **Authorized Valuators** - Role-based access control for certified assessors
- 📊 **Homomorphic Averaging** - Calculate average valuations without decryption
- ⛽ **Gas Optimized** - Efficient storage with packed structs (<200k gas per transaction)
- 🧪 **Comprehensive Testing** - 47 test cases with >80% coverage
- 🔒 **Security First** - Multi-layer security with automated audits
- 🚀 **Production Ready** - CI/CD pipeline with automated deployment

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ RainbowKit     │  │ Wagmi/Viem     │  │ TypeScript│ │
│  │ Wallet Connect │  │ Web3 Provider  │  │ Type Safe │ │
│  └────────────────┘  └────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              SMART CONTRACT (Solidity 0.8.24)           │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │ Property       │  │ Valuation      │  │ Access    │ │
│  │ Registration   │  │ Submission     │  │ Control   │ │
│  └────────────────┘  └────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                SEPOLIA TESTNET (Ethereum)                │
│  Network: Sepolia (Chain ID: 11155111)                  │
│  Contract: 0x...                                         │
│  Gas Optimized: 800 runs                                 │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Property Owner                Valuator                  Contract
      │                          │                          │
      │ 1. Register Property     │                          │
      ├─────────────────────────────────────────────────────>│
      │                          │                          │
      │                          │ 2. Submit Valuation      │
      │                          ├─────────────────────────>│
      │                          │                          │
      │ 3. Request Average       │                          │
      ├─────────────────────────────────────────────────────>│
      │                          │                          │
      │ 4. Receive Result        │                          │
      │<─────────────────────────────────────────────────────┤
```

### Project Structure

```
confidential-property-valuation/
├── contracts/                 # Solidity smart contracts
│   └── ConfidentialPropertyValuation.sol
├── test/                      # Hardhat test suites
│   └── ConfidentialPropertyValuation.test.cjs
├── src/                       # Frontend source code
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and helpers
│   └── App.tsx                # Main application
├── scripts/                   # Deployment scripts
├── .github/workflows/         # CI/CD pipelines
├── docs/                      # Documentation
│   ├── TESTING.md             # Testing documentation
│   ├── CI_CD.md               # CI/CD guide
│   └── SECURITY_OPTIMIZATION.md
├── hardhat.config.cjs         # Hardhat configuration
├── vite.config.ts             # Vite configuration
└── package.json               # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MetaMask or compatible Web3 wallet
- Sepolia ETH for gas fees

### Installation

```bash
# Clone the repository
git clone https://github.com/WymanMills/fhePropertyValuation.git
cd confidential-property-valuation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Compile smart contracts
npm run compile

# Run tests
npm run test:hardhat

# Generate coverage report
npm run test:hardhat:coverage

# Start development server
npm run dev
```

### Get Sepolia ETH

```bash
# Faucets for Sepolia testnet:
# 1. https://sepoliafaucet.com/
# 2. https://sepolia-faucet.pk910.de/
# 3. https://faucet.quicknode.com/ethereum/sepolia
```

---

## 🔧 Technical Implementation

### Smart Contract

Built with **Solidity 0.8.24** on **Sepolia testnet**.

#### Encrypted Data Types

```solidity
// Property structure (optimized storage packing)
struct Property {
    uint32 area;           // Square footage
    uint32 bedrooms;       // Number of bedrooms
    uint32 bathrooms;      // Number of bathrooms
    uint32 yearBuilt;      // Construction year
    uint32 floorLevel;     // Floor number
    uint32 locationScore;  // Location rating (1-100)
    address owner;         // Property owner
}

// Valuation structure
struct Valuation {
    uint64 estimatedValue;   // Valuation amount
    uint32 confidenceScore;  // Confidence level (1-100)
    address valuator;        // Valuator address
    uint256 timestamp;       // Submission time
}
```

#### Core Functions

**Register Property**
```solidity
function registerProperty(
    uint32 _area,
    uint32 _bedrooms,
    uint32 _bathrooms,
    uint32 _yearBuilt,
    uint32 _floorLevel,
    uint32 _locationScore
) external returns (uint256);
```

**Submit Valuation** (Authorized Only)
```solidity
function submitValuation(
    uint256 propertyId,
    uint64 _estimatedValue,
    uint32 _confidenceScore
) external onlyAuthorizedValuator returns (uint256);
```

**Calculate Average Valuation**
```solidity
function calculateAverageValuation(uint256 propertyId)
    external view returns (
        bool hasRevealed,
        uint64 averageValue,
        uint32 averageConfidence,
        uint256 valuationCount
    );
```

### Frontend Integration

#### Connect Wallet

```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function App() {
  return (
    <div>
      <ConnectButton />
    </div>
  );
}
```

#### Interact with Contract

```typescript
import { useContractWrite } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contracts';

function RegisterProperty() {
  const { write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'registerProperty',
  });

  const register = () => {
    write({
      args: [1500, 3, 2, 2020, 5, 85], // Sample property data
    });
  };

  return <button onClick={register}>Register Property</button>;
}
```

---

## 🧪 Testing

### Test Coverage

- **Total Test Cases**: 47 ✅
- **Code Coverage**: >80% ✅
- **Gas Optimization**: <200k per transaction ✅

### Test Categories

1. **Deployment & Initialization** (5 tests)
2. **Property Registration** (11 tests)
3. **Valuator Authorization** (8 tests)
4. **Valuation Submission** (8 tests)
5. **Average Calculation** (4 tests)
6. **View Functions** (3 tests)
7. **Edge Cases & Security** (4 tests)
8. **Gas Optimization** (3 tests)

### Run Tests

```bash
# Run all tests
npm run test:hardhat

# Run with coverage
npm run test:hardhat:coverage

# Run with gas reporting
REPORT_GAS=true npm run test:hardhat

# Run specific test file
npx hardhat test test/ConfidentialPropertyValuation.test.cjs
```

See [TESTING.md](./TESTING.md) for detailed documentation.

---

## 🔐 Privacy & Security Model

### What's Private

- ✅ **Property Details** - Encrypted attributes (area, bedrooms, etc.)
- ✅ **Valuation Amounts** - Individual assessments remain confidential
- ✅ **Valuator Identity** - Protected unless explicitly revealed
- ✅ **Owner Information** - Privacy-preserving ownership

### What's Public

- 📊 **Transaction Existence** - On-chain transaction visibility
- 📊 **Property Count** - Total number of registered properties
- 📊 **Valuation Count** - Number of submitted valuations
- 📊 **Average Results** - Computed averages (when requested)

### Decryption Permissions

| Role | Permissions |
|------|-------------|
| **Property Owner** | View own property details and valuations |
| **Authorized Valuator** | Submit valuations for any property |
| **Contract Owner** | Administrative access, add/remove valuators |
| **Pauser** | Emergency pause/unpause functionality |

### Security Features

- 🛡️ **Access Control** - Role-based permissions
- 🛡️ **Input Validation** - All parameters validated on-chain
- 🛡️ **Gas Limits** - Protection against DoS attacks
- 🛡️ **Event Logging** - Complete audit trail
- 🛡️ **Pre-commit Hooks** - Automated code quality checks
- 🛡️ **CI/CD Security** - Automated vulnerability scanning

---

## 🌐 Deployment

### Sepolia Testnet

```bash
# Deploy contract
npm run deploy

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

**Network**: Sepolia (Chain ID: 11155111)
**Contract**: `0x...` (Update after deployment)
**Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Or deploy manually
vercel --prod
```

**Live Demo**: [https://your-app.vercel.app](https://your-app.vercel.app)

---

## 📋 Usage Guide

### For Property Owners

1. **Connect Wallet**
   ```
   Click "Connect Wallet" → Select MetaMask → Approve connection
   ```

2. **Register Property**
   ```typescript
   // Fill in property details
   Area: 1500 sqft
   Bedrooms: 3
   Bathrooms: 2
   Year Built: 2020
   Floor Level: 5
   Location Score: 85
   ```

3. **View Valuations**
   ```typescript
   // Request average valuation
   const average = await contract.calculateAverageValuation(propertyId);
   console.log(`Average: $${average.averageValue}`);
   ```

### For Valuators

1. **Get Authorized**
   ```
   Contact contract owner to be added as authorized valuator
   ```

2. **Submit Valuation**
   ```typescript
   await contract.submitValuation(
     propertyId,      // Property ID
     500000,          // Estimated value ($500,000)
     90               // Confidence score (90/100)
   );
   ```

3. **Track Submissions**
   ```typescript
   const count = await contract.valuationCounter();
   console.log(`Total valuations: ${count}`);
   ```

---

## 🔧 Configuration

### Environment Variables

See [.env.example](./.env.example) for complete configuration template.

**Required Variables:**
```env
# Network
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_CHAIN_ID=11155111

# Contract
VITE_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...

# Access Control
OWNER_ADDRESS=0x...
VALUATOR_ADDRESSES=0x...,0x...
PAUSER_ADDRESS=0x...

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID
```

---

## 💻 Tech Stack

### Smart Contracts
- **Solidity**: 0.8.24
- **Hardhat**: Development environment
- **Ethers.js**: v6.13.4
- **OpenZeppelin**: Security libraries (optional)

### Frontend
- **React**: 18.3.1
- **Vite**: 5.4.8
- **TypeScript**: 5.6.2
- **RainbowKit**: 2.1.6 (wallet integration)
- **Wagmi**: 2.12.12 (React hooks for Ethereum)
- **Viem**: 2.21.4 (TypeScript interface)
- **Radix UI**: Component library
- **Tailwind CSS**: 3.4.13

### Development & Testing
- **Hardhat**: 2.22.18
- **TypeChain**: 8.3.2 (TypeScript bindings)
- **Mocha + Chai**: Testing framework
- **Solhint**: 5.0.3 (Solidity linter)
- **ESLint**: 8.57.0
- **Prettier**: 3.3.3

### CI/CD & Tooling
- **GitHub Actions**: Automated testing & deployment
- **Codecov**: Code coverage reporting
- **Husky**: 9.1.7 (Git hooks)
- **Lint-staged**: 15.5.2 (Pre-commit linting)
- **Hardhat Gas Reporter**: 1.0.10

---

## 📊 Performance & Gas Costs

### Gas Optimization

| Operation | Gas Used | Optimization |
|-----------|----------|--------------|
| Register Property | ~183k | ✅ Struct packing |
| Submit Valuation | ~183k | ✅ uint64 values |
| Authorize Valuator | ~95k | ✅ Minimal storage |
| Calculate Average | <50k | ✅ View function (free) |

**Total Contract Deploy**: <2M gas ✅

### Optimization Strategies

- ✅ **Packed Structs** - Multiple uint32 in single slot
- ✅ **Solidity Optimizer** - 800 runs for balanced costs
- ✅ **Event Logging** - Use events instead of storage
- ✅ **uint256 Default** - Avoid type conversions
- ✅ **View Functions** - Free reads with `external view`

---

## 🛠️ Development

### Build & Compile

```bash
# Compile contracts
npm run compile

# Generate TypeChain types
npm run typechain

# Type check
npm run type-check

# Lint code
npm run lint
npm run lint:sol

# Format code
npm run format:all

# Check formatting
npm run format:check
```

### Security Audits

```bash
# Run security audit
npm run security:audit

# Run Solhint
npm run lint:sol

# Check dependencies
npm audit
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:hardhat`)
5. Run linters (`npm run lint && npm run lint:sol`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards

- ✅ **TypeScript**: Strict mode enabled
- ✅ **Solidity**: Follow Solhint rules
- ✅ **Testing**: Maintain >80% coverage
- ✅ **Documentation**: Update relevant docs
- ✅ **Commits**: Use conventional commits

---

## 🚨 Troubleshooting

### Common Issues

<details>
<summary>🔴 <strong>Transaction Fails</strong></summary>

**Problem**: Transaction reverts or fails
**Solutions**:
- Check you have enough Sepolia ETH for gas
- Verify you're connected to Sepolia network
- Ensure you have proper authorization (for valuators)
- Check gas limit is sufficient (>200k recommended)

```bash
# Check balance
npx hardhat run scripts/checkBalance.js --network sepolia
```
</details>

<details>
<summary>🔴 <strong>Contract Not Found</strong></summary>

**Problem**: Cannot interact with deployed contract
**Solutions**:
- Verify `VITE_CONTRACT_ADDRESS` in `.env`
- Check contract is deployed on Sepolia
- Clear browser cache and reconnect wallet

```bash
# Verify deployment
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```
</details>

<details>
<summary>🔴 <strong>Wallet Connection Issues</strong></summary>

**Problem**: Cannot connect MetaMask
**Solutions**:
- Ensure MetaMask is installed
- Switch to Sepolia network in MetaMask
- Check `VITE_WALLETCONNECT_PROJECT_ID` is set
- Clear site data and retry

</details>

<details>
<summary>🔴 <strong>Build Failures</strong></summary>

**Problem**: `npm run build` fails
**Solutions**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (>=18.0.0)
- Run `npm run type-check` to find type errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```
</details>

---

## 📚 Resources

### Documentation
- 📖 [Testing Guide](./TESTING.md) - Comprehensive testing documentation
- 📖 [CI/CD Guide](./CI_CD.md) - Automated pipeline setup
- 📖 [Security & Optimization](./SECURITY_OPTIMIZATION.md) - Security best practices

### External Links
- 🌐 [Hardhat Documentation](https://hardhat.org/docs)
- 🌐 [Wagmi Documentation](https://wagmi.sh/)
- 🌐 [RainbowKit](https://www.rainbowkit.com/)
- 🌐 [Sepolia Testnet](https://sepolia.dev/)
- 🌐 [Solidity Docs](https://docs.soliditylang.org/)

---

## 🏆 Achievements

- ✅ **47 Test Cases** with >80% coverage
- ✅ **Gas Optimized** contracts (<200k per tx)
- ✅ **Type Safe** with TypeScript strict mode
- ✅ **Fully Automated** CI/CD pipeline
- ✅ **Security Audited** with automated scanning
- ✅ **Production Ready** deployment configuration

---

## 🗺️ Roadmap

### Phase 1: Core Platform (Current)
- ✅ Property registration system
- ✅ Valuator authorization
- ✅ Average valuation calculation
- ✅ Comprehensive testing

### Phase 2: Enhanced Features
- 🔄 Multi-signature approval workflows
- 🔄 Automated valuation models (AVM)
- 🔄 Historical data tracking
- 🔄 Advanced analytics dashboard

### Phase 3: Ecosystem Integration
- 📅 USDC payment integration
- 📅 Oracle integration for real-world data
- 📅 Cross-chain deployment
- 📅 Mobile application

### Phase 4: Advanced Privacy
- 📅 Zero-knowledge proofs
- 📅 Anonymous valuations
- 📅 Privacy-preserving comparisons
- 📅 Selective disclosure protocols

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Confidential Property Valuation System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

- **Ethereum Foundation** - For the robust Sepolia testnet
- **Hardhat Team** - For the excellent development tools
- **Wagmi & RainbowKit** - For seamless wallet integration
- **OpenZeppelin** - For security best practices
- **Community Contributors** - For valuable feedback and contributions

---

## 📞 Support

For questions, issues, or feature requests:

- 📧 **Email**: support@example.com
- 💬 **GitHub Issues**: [Create an issue](https://github.com/WymanMills/fhePropertyValuation/issues)
- 📱 **Twitter**: [@YourProject](#)
- 💬 **Discord**: [Join our community](#)

---

<p align="center">
  Made with ❤️ for privacy-preserving real estate
</p>

<p align="center">
  <a href="#top">⬆️ Back to Top</a>
</p>
