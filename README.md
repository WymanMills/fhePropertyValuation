# Confidential Property Valuation System

A privacy-preserving real estate valuation platform built on the Zama fhEVM blockchain, enabling secure property assessments without revealing sensitive property information.

## 🏠 Core Concept

The **Confidential Property Valuation System** revolutionizes real estate appraisal by leveraging Fully Homomorphic Encryption (FHE) to protect sensitive property data while enabling accurate valuations. Property owners can register their properties with encrypted details, and authorized valuators can submit confidential assessments without compromising privacy.

### Key Features

- **Privacy-First Architecture**: All property details (area, bedrooms, location scores) are encrypted on-chain
- **Confidential Valuations**: Property assessments are performed on encrypted data
- **Authorized Valuator Network**: Only certified appraisers can submit valuations
- **Selective Disclosure**: Property owners control when valuation results are revealed
- **Aggregated Insights**: Calculate average valuations while maintaining individual privacy

## 🔐 How It Works

1. **Property Registration**: Owners submit encrypted property characteristics including area, bedrooms, bathrooms, year built, floor level, and location score
2. **Confidential Assessment**: Authorized valuators submit encrypted valuation estimates and confidence scores
3. **Privacy-Preserving Calculations**: The system performs computations on encrypted data without revealing underlying information
4. **Controlled Revelation**: Property owners can request decryption of specific valuations when needed
5. **Aggregated Analytics**: Calculate average property values across multiple encrypted assessments

## 🎯 Use Cases

- **Private Property Assessments**: Get professional valuations without exposing property details to the public
- **Competitive Analysis**: Compare property values while maintaining confidentiality
- **Insurance Evaluations**: Secure property assessments for insurance purposes
- **Investment Research**: Analyze real estate markets with privacy protection
- **Tax Assessments**: Confidential property evaluations for tax purposes

## 🛡️ Privacy Benefits

- **No Data Leakage**: Property characteristics remain encrypted throughout the entire process
- **Selective Transparency**: Choose what information to reveal and when
- **Valuator Privacy**: Appraisers can submit assessments without revealing their methodologies
- **Competitive Protection**: Prevent competitors from accessing sensitive market data
- **Regulatory Compliance**: Meet privacy requirements while maintaining audit capabilities

## 📋 Smart Contract Features

### Property Management
- Register properties with encrypted characteristics
- Activate/deactivate property listings
- View property information (owners only)
- Track property valuation history

### Valuation System
- Submit confidential property assessments
- Request valuation reveals with cryptographic verification
- Calculate aggregated valuation statistics
- Manage valuator authorization and permissions

### Access Control
- Property owner exclusive access to their data
- Authorized valuator network management
- Granular permission system for data access
- Secure reveal mechanism with signature verification

## 🌐 Live Application

**Website**: [https://confidential-property-valuation.vercel.app/](https://confidential-property-valuation.vercel.app/)

Experience the privacy-preserving property valuation system in action. The interface allows property owners to register their assets and view confidential assessments from certified valuators.

## 📂 Contract Address

The smart contract is deployed on the Zama fhEVM testnet. Contract verification and interaction details are available through the application interface.

## 🎥 Demonstration

### Video Demo
The repository includes a comprehensive video demonstration (`demo.mp4`) showcasing:
- Property registration process
- Valuator authorization workflow
- Confidential valuation submission
- Privacy-preserving reveal mechanism
- User interface navigation



## 🔧 Technical Stack

- **Blockchain**: Zama fhEVM (Fully Homomorphic Encryption Virtual Machine)
- **Smart Contracts**: Solidity with FHE encryption libraries
- **Frontend**: Modern web interface with Web3 integration
- **Encryption**: Zama's FHE implementation for confidential computing
- **Network**: Sepolia testnet configuration

## 📈 Future Enhancements

- **Multi-Property Portfolios**: Manage large property collections
- **Advanced Analytics**: Market trend analysis on encrypted data
- **Automated Valuations**: AI-powered assessment algorithms
- **Cross-Chain Integration**: Expand to additional blockchain networks
- **Mobile Application**: Native mobile app for property management

## 🏆 Innovation Impact

This system addresses critical privacy concerns in real estate by enabling:
- Confidential market analysis without exposing individual property data
- Secure collaboration between property owners and valuators
- Privacy-compliant real estate transactions
- Protection against data mining and competitive intelligence gathering
- Enhanced trust in digital property assessment processes

## ⚠️ Important Technical Note: KMS Gateway Requirement

### Current Deployment Limitation

The contract deployed at `0xbc70aFE54495D028586f7E77c257359F1FDf6483` uses `FHE.requestDecryption()` for the valuation reveal functionality. This requires:

1. **Configured Gateway Contract**: A deployed fhEVM Gateway smart contract
2. **Active KMS Nodes**: Key Management System nodes for handling decryption requests
3. **Coprocessor Infrastructure**: Backend FHE computation infrastructure

**These components are not currently configured**, which means:
- ✅ Property registration works normally (data is encrypted on-chain)
- ✅ Valuation submission works normally (valuations are encrypted)
- ✅ Authorization and access control work normally
- ❌ `requestValuationReveal()` will fail with "execution reverted" error
- ⚠️  Average valuation calculation requires revealed valuations

### Why This Happens

The error `cannot estimate gas; transaction may fail or may require manual gas limit` occurs because:

```solidity
// Current deployed contract code (simplified)
function requestValuationReveal(uint256 valuationId) external {
    // ... authorization checks ...

    // This call requires Gateway + KMS infrastructure
    FHE.requestDecryption(cts, this.processValuationReveal.selector, valuationId);
    // ❌ Fails if Gateway is not configured
}
```

### Updated Contract Solution

The contract source code has been updated to support client-side decryption:

```solidity
// New approach - works without KMS Gateway
function getEncryptedValuation(uint256 valuationId)
    external view returns (bytes32 encryptedValue, bytes32 encryptedConfidence)
{
    // Returns encrypted bytes for fhevmjs decryption
}

function markValuationRevealed(
    uint256 valuationId,
    uint64 revealedValue,
    uint32 revealedConfidence
) external {
    // Manually mark as revealed after client-side decryption
}
```

**Note**: The updated contract cannot be redeployed due to insufficient Sepolia testnet funds.

### Workarounds for Testing

1. **Test Core Functionality**: Property registration, valuation submission, and authorization all work correctly
2. **Skip Reveal Testing**: The reveal function requires full KMS infrastructure
3. **Use Updated Code**: The contract source in this repository shows the working solution
4. **Future Deployment**: When testnet funds are available, redeploy with the updated code

### For Production Deployment

To enable valuation reveals in production:

**Option A: Configure KMS Gateway**
```env
GATEWAY_CONTRACT_ADDRESS=0x...
KMS_VERIFIER_ADDRESS=0x...
KMS_SIGNER_ADDRESS=0x...
COPRO_ADDRESS=0x...
```

**Option B: Use Updated Contract** (Recommended)
- Deploy the updated contract that uses `getEncryptedValuation()` + `markValuationRevealed()`
- Integrate fhevmjs for client-side decryption
- No Gateway infrastructure required

## 📄 License

This project is licensed under the MIT License - promoting open innovation in privacy-preserving real estate technology.

## 🤝 Contributing

We welcome contributions to enhance the privacy and functionality of the platform. Please review our contribution guidelines and submit pull requests for improvements.

## 🔗 Repository

**GitHub**: [https://github.com/WymanMills/fhePropertyValuation](https://github.com/WymanMills/fhePropertyValuation)

---

*Protecting property privacy while enabling transparent valuations through cutting-edge cryptographic technology.*