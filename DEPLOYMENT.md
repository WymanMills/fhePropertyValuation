# Deployment Guide

Complete guide for deploying and interacting with the Confidential Property Valuation System.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Verification](#verification)
- [Interaction](#interaction)
- [Testing](#testing)
- [Network Information](#network-information)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18+ recommended)
- npm or yarn
- Git
- A wallet with Sepolia testnet ETH

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ConfidentialPropertyValuation-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and configure the following variables:

```env
# Required for deployment
PRIVATE_KEY=your_private_key_without_0x
RPC_URL=https://sepolia.infura.io/v3/your_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Pauser configuration
NUM_PAUSERS=2
PAUSER_ADDRESS_0=0x_first_pauser_address
PAUSER_ADDRESS_1=0x_second_pauser_address

# KMS configuration
KMS_GENERATION=1
```

**Important Notes:**
- Never commit your `.env` file to version control
- Keep your private key secure
- Use testnet accounts for testing

### 4. Verify Setup

Compile the contracts to verify everything is configured correctly:

```bash
npm run compile
```

## Development Workflow

### Compile Contracts

```bash
npm run compile
```

### Clean Build Artifacts

```bash
npm run clean
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Run coverage
npm run coverage
```

### Lint Solidity Code

```bash
npm run lint
```

### Start Local Hardhat Node

```bash
npm run node
```

In a separate terminal, deploy to localhost:

```bash
npm run deploy:localhost
```

## Deployment

### Deploy to Sepolia Testnet

1. **Ensure you have testnet ETH** in your deployment wallet

2. **Run the deployment script:**

```bash
npm run deploy
```

3. **Save the contract address** from the deployment output:

```
✅ Contract deployed successfully!
   Address: 0x1234567890abcdef...
```

4. **Update your `.env` file:**

```env
CONTRACT_ADDRESS=0x1234567890abcdef...
```

### Deploy to Localhost

For local testing:

1. Start a local Hardhat node:
```bash
npm run node
```

2. In another terminal, deploy:
```bash
npm run deploy:localhost
```

### Deployment Output

The deployment script provides:
- Contract address
- Transaction hash
- Block number
- Configured pausers
- Initial contract state
- Owner address
- Next steps

## Verification

### Verify Contract on Etherscan

After deployment, verify your contract:

```bash
npm run verify
```

The script will:
- Read the contract address from your `.env` file
- Verify the contract with constructor arguments
- Provide an Etherscan link to view the verified code

**Manual Verification:**

If automatic verification fails:

```bash
npx hardhat verify --network sepolia \
  --constructor-args arguments.js \
  DEPLOYED_CONTRACT_ADDRESS
```

Create `arguments.js`:

```javascript
module.exports = [
  ["0xPauserAddress1", "0xPauserAddress2"], // pauserAddresses array
  1 // kmsGeneration
];
```

## Interaction

### Use the Interaction Script

The interaction script provides information about your deployed contract:

```bash
npm run interact
```

This displays:
- Contract owner
- Pauser addresses
- Property and valuation counts
- Contract pause status
- Available interaction examples

### Common Operations

#### 1. Authorize a Valuator

```javascript
// Using Hardhat console
const contract = await ethers.getContractAt(
  "ConfidentialPropertyValuation",
  "DEPLOYED_ADDRESS"
);
await contract.authorizeValuator("0xVALUATOR_ADDRESS");
```

#### 2. Register a Property

```javascript
await contract.registerProperty(
  100,  // area in sqm
  3,    // bedrooms
  2,    // bathrooms
  2020, // year built
  5,    // floor level
  85    // location score (0-100)
);
```

#### 3. Submit a Valuation (Valuators Only)

```javascript
await contract.submitValuation(
  1,      // propertyId
  500000, // estimated value
  90      // confidence score (0-100)
);
```

#### 4. Get Encrypted Valuation Data

```javascript
const [encValue, encConfidence] = await contract.getEncryptedValuation(1);
console.log("Encrypted Value:", encValue);
console.log("Encrypted Confidence:", encConfidence);
```

## Testing

### Run Full Test Suite

```bash
npm test
```

### Run Simulation

Test the complete workflow:

```bash
# On Sepolia
npm run simulate

# On localhost
npm run simulate:localhost
```

The simulation script:
1. Deploys a fresh contract (or uses existing)
2. Authorizes valuators
3. Registers multiple properties
4. Submits valuations
5. Tests access control
6. Tests pause functionality
7. Provides a complete summary

### Test Coverage

Generate coverage report:

```bash
npm run coverage
```

### Gas Reporting

Enable gas reporting in tests:

```bash
npm run test:gas
```

Or set in `.env`:
```env
REPORT_GAS=true
```

## Network Information

### Sepolia Testnet

- **Chain ID:** 11155111
- **RPC URL:** https://sepolia.infura.io/v3/YOUR_KEY
- **Block Explorer:** https://sepolia.etherscan.io/
- **Faucets:**
  - https://sepoliafaucet.com/
  - https://www.infura.io/faucet/sepolia

### Local Hardhat Network

- **Chain ID:** 31337
- **RPC URL:** http://127.0.0.1:8545
- **Accounts:** 20 pre-funded test accounts

## Deployment Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file with all required variables
- [ ] Compile contracts (`npm run compile`)
- [ ] Run tests to ensure everything works (`npm test`)
- [ ] Fund deployment wallet with testnet ETH
- [ ] Deploy contract (`npm run deploy`)
- [ ] Save contract address to `.env`
- [ ] Verify contract on Etherscan (`npm run verify`)
- [ ] Test contract interaction (`npm run interact`)
- [ ] Authorize initial valuators
- [ ] Update frontend with contract address
- [ ] Run simulation to verify full workflow (`npm run simulate`)

## Troubleshooting

### Common Issues

**1. Insufficient funds:**
```
Error: insufficient funds for intrinsic transaction cost
```
Solution: Get testnet ETH from a faucet

**2. Invalid private key:**
```
Error: invalid privateKey
```
Solution: Ensure PRIVATE_KEY in `.env` is correct (without 0x prefix)

**3. RPC connection failed:**
```
Error: could not detect network
```
Solution: Check your RPC_URL and network connectivity

**4. Verification failed:**
```
Error: Already Verified
```
Solution: Contract is already verified, no action needed

**5. Gas estimation failed:**
```
Error: cannot estimate gas
```
Solution: Check if contract is paused or if you have proper authorization

### Getting Help

- Check the [README.md](README.md) for project overview
- Review test files in `/test` for usage examples
- Examine deployment logs for error details
- Verify your `.env` configuration matches `env.example`

## Security Considerations

### Deployment Security

- **Never** commit your `.env` file
- **Never** share your private keys
- Use separate wallets for testnet and mainnet
- Verify contract code before deployment
- Test thoroughly on testnet before mainnet

### Operational Security

- Limit pauser addresses to trusted entities
- Regularly rotate KMS generation numbers
- Monitor contract events for suspicious activity
- Implement proper access control for valuators
- Keep emergency pause functionality available

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| Compile | `npm run compile` | Compile all contracts |
| Clean | `npm run clean` | Remove build artifacts |
| Test | `npm test` | Run test suite |
| Deploy | `npm run deploy` | Deploy to Sepolia |
| Verify | `npm run verify` | Verify on Etherscan |
| Interact | `npm run interact` | Interact with contract |
| Simulate | `npm run simulate` | Run full workflow simulation |
| Node | `npm run node` | Start local Hardhat node |

## Next Steps

After successful deployment:

1. **Authorize Valuators:** Add trusted valuators using `authorizeValuator()`
2. **Configure Frontend:** Update frontend with deployed contract address
3. **Test Functionality:** Use simulation script to verify all features
4. **Monitor Events:** Set up event monitoring for contract activity
5. **Documentation:** Document any custom configuration or modifications

---

For more information, see:
- [Project README](README.md)
- [Smart Contract Documentation](contracts/README.md)
- [Test Documentation](test/README.md)
