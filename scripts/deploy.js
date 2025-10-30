const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("\n========================================");
  console.log("🏠 Confidential Property Valuation v2.0");
  console.log("========================================\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Parse pauser addresses from environment
  const numPausers = parseInt(process.env.NUM_PAUSERS || "2");
  const pauserAddresses = [];

  console.log("🔐 Loading Pauser Addresses:");
  console.log(`   Total pausers to configure: ${numPausers}\n`);

  for (let i = 0; i < numPausers; i++) {
    const pauserKey = `PAUSER_ADDRESS_${i}`;
    const pauserAddress = process.env[pauserKey];

    if (!pauserAddress || pauserAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️  Warning: ${pauserKey} is not set or is zero address`);
      console.log(`   Using deployer address as fallback for pauser ${i}`);
      pauserAddresses.push(deployer.address);
    } else {
      pauserAddresses.push(pauserAddress);
      console.log(`   ✅ Pauser ${i}: ${pauserAddress}`);
    }
  }

  // KMS Generation (default to 1 if not set)
  const kmsGeneration = parseInt(process.env.KMS_GENERATION || "1");
  console.log(`\n🔑 KMS Generation: ${kmsGeneration}`);

  console.log("\n📝 Deploying ConfidentialPropertyValuation contract...");
  console.log("   This may take a few minutes...\n");

  // Deploy contract
  const ConfidentialPropertyValuation = await hre.ethers.getContractFactory("ConfidentialPropertyValuation");

  const contract = await ConfidentialPropertyValuation.deploy(
    pauserAddresses,
    kmsGeneration
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log(`   Address: ${contractAddress}`);

  // Get deployment transaction
  const deployTx = contract.deploymentTransaction();
  console.log(`   Transaction Hash: ${deployTx.hash}`);
  console.log(`   Block Number: ${deployTx.blockNumber}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await contract.owner();
  const nextPropertyId = await contract.nextPropertyId();
  const nextValuationId = await contract.nextValuationId();
  const isPaused = await contract.isPaused();
  const pauserCount = await contract.getPauserCount();

  console.log(`   Owner: ${owner}`);
  console.log(`   Next Property ID: ${nextPropertyId}`);
  console.log(`   Next Valuation ID: ${nextValuationId}`);
  console.log(`   Contract Paused: ${isPaused}`);
  console.log(`   Pauser Count: ${pauserCount}`);

  // Display pauser addresses
  console.log(`\n👥 Configured Pausers:`);
  for (let i = 0; i < pauserCount; i++) {
    const pauser = await contract.getPauserAtIndex(i);
    const isValid = await contract.isPauser(pauser);
    console.log(`   ${i}. ${pauser} ${isValid ? '✅' : '❌'}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    transactionHash: deployTx.hash,
    blockNumber: deployTx.blockNumber,
    timestamp: new Date().toISOString(),
    pausers: pauserAddresses,
    kmsGeneration: kmsGeneration,
    owner: owner
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✨ Deployment completed successfully!");
  console.log("\n📌 Next Steps:");
  console.log("   1. Update your .env file with the contract address");
  console.log("   2. Verify the contract on Etherscan (optional)");
  console.log("   3. Authorize valuators using authorizeValuator()");
  console.log("   4. Update frontend with new contract address");

  console.log("\n💡 Contract Address to add to .env:");
  console.log(`MAIN_CONTRACT_ADDRESS=${contractAddress}`);

  console.log("\n========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
