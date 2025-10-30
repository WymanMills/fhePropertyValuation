const hre = require("hardhat");
require("dotenv").config();

/**
 * Verify the deployed contract on Etherscan
 *
 * Usage:
 * npx hardhat run scripts/verify.js --network sepolia
 *
 * Or with contract address as environment variable:
 * CONTRACT_ADDRESS=0x... npx hardhat run scripts/verify.js --network sepolia
 */
async function main() {
  console.log("\n========================================");
  console.log("🔍 Contract Verification Script");
  console.log("========================================\n");

  // Get contract address from environment or command line
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.MAIN_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS not found in environment variables");
    console.error("   Please set CONTRACT_ADDRESS or MAIN_CONTRACT_ADDRESS in your .env file");
    console.error("   Example: CONTRACT_ADDRESS=0x1234567890abcdef...");
    process.exit(1);
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("");

  // Get constructor arguments from environment
  const numPausers = parseInt(process.env.NUM_PAUSERS || "2");
  const pauserAddresses = [];

  console.log("🔐 Loading Constructor Arguments:");
  console.log(`   Number of pausers: ${numPausers}`);

  for (let i = 0; i < numPausers; i++) {
    const pauserKey = `PAUSER_ADDRESS_${i}`;
    const pauserAddress = process.env[pauserKey];

    if (!pauserAddress || pauserAddress === "0x0000000000000000000000000000000000000000") {
      console.error(`❌ Error: ${pauserKey} is not set or is zero address`);
      console.error(`   Please set valid pauser addresses in your .env file`);
      process.exit(1);
    }

    pauserAddresses.push(pauserAddress);
    console.log(`   ✅ Pauser ${i}: ${pauserAddress}`);
  }

  const kmsGeneration = parseInt(process.env.KMS_GENERATION || "1");
  console.log(`   KMS Generation: ${kmsGeneration}`);

  console.log("\n📝 Verifying contract on Etherscan...");
  console.log("   This may take a minute...\n");

  try {
    // Verify the contract
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        pauserAddresses,
        kmsGeneration
      ],
    });

    console.log("\n✅ Contract verified successfully!");
    console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    console.log("\n========================================\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log(`   View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
      console.log("\n========================================\n");
    } else {
      console.error("\n❌ Verification failed:");
      console.error(error.message);
      console.error("\n💡 Common issues:");
      console.error("   1. Make sure ETHERSCAN_API_KEY is set in your .env file");
      console.error("   2. Verify the contract address is correct");
      console.error("   3. Ensure constructor arguments match the deployment");
      console.error("   4. Wait a few blocks after deployment before verifying");
      console.error("\n========================================\n");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });
