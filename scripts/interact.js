const hre = require("hardhat");
require("dotenv").config();

/**
 * Interactive script to interact with the deployed contract
 *
 * Usage:
 * npx hardhat run scripts/interact.js --network sepolia
 */

async function main() {
  console.log("\n========================================");
  console.log("🔗 Contract Interaction Script");
  console.log("========================================\n");

  // Get contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.MAIN_CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS not found");
    console.error("   Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log("🌐 Network:", hre.network.name);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("👤 Interacting from:", signer.address);

  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get contract instance
  const Contract = await hre.ethers.getContractFactory("ConfidentialPropertyValuation");
  const contract = Contract.attach(contractAddress);

  console.log("📊 Reading Contract State\n");
  console.log("─".repeat(50));

  try {
    // Read basic contract info
    const owner = await contract.owner();
    const nextPropertyId = await contract.nextPropertyId();
    const nextValuationId = await contract.nextValuationId();
    const isPaused = await contract.isPaused();
    const kmsGeneration = await contract.kmsGeneration();
    const pauserCount = await contract.getPauserCount();

    console.log("Contract Information:");
    console.log(`  Owner: ${owner}`);
    console.log(`  Next Property ID: ${nextPropertyId}`);
    console.log(`  Next Valuation ID: ${nextValuationId}`);
    console.log(`  Is Paused: ${isPaused}`);
    console.log(`  KMS Generation: ${kmsGeneration}`);
    console.log(`  Pauser Count: ${pauserCount}\n`);

    // Display pausers
    if (pauserCount > 0) {
      console.log("Configured Pausers:");
      for (let i = 0; i < pauserCount; i++) {
        const pauser = await contract.getPauserAtIndex(i);
        const isValid = await contract.isPauser(pauser);
        console.log(`  ${i + 1}. ${pauser} ${isValid ? '✅' : '❌'}`);
      }
      console.log("");
    }

    // Check if current signer is authorized valuator
    const isValuator = await contract.authorizedValuators(signer.address);
    console.log(`Current Account Status:`);
    console.log(`  Is Owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`);
    console.log(`  Is Authorized Valuator: ${isValuator}`);
    console.log(`  Is Pauser: ${await contract.isPauser(signer.address)}\n`);

    // Get user's properties
    try {
      const properties = await contract.getOwnerProperties(signer.address);
      console.log(`Properties Owned by Current Account: ${properties.length}`);

      if (properties.length > 0) {
        console.log("  Property IDs:", properties.map(id => id.toString()).join(", "));

        // Show details for first property
        if (properties.length > 0) {
          const propertyId = properties[0];
          const propertyInfo = await contract.getPropertyInfo(propertyId);
          const valuations = await contract.getPropertyValuations(propertyId);

          console.log(`\n  Property #${propertyId} Details:`);
          console.log(`    Active: ${propertyInfo.isActive}`);
          console.log(`    Registered: ${new Date(Number(propertyInfo.timestamp) * 1000).toLocaleString()}`);
          console.log(`    Valuations: ${valuations.length}`);

          if (valuations.length > 0) {
            console.log(`    Valuation IDs: ${valuations.map(id => id.toString()).join(", ")}`);
          }
        }
      }
    } catch (error) {
      console.log(`Properties Owned: Unable to fetch (might not own any properties)`);
    }

    console.log("\n" + "─".repeat(50));
    console.log("\n✅ Contract state retrieved successfully!\n");

    // Example interactions menu
    console.log("💡 Available Interactions:\n");
    console.log("To authorize a valuator (owner only):");
    console.log('  await contract.authorizeValuator("0xVALUATOR_ADDRESS");\n');

    console.log("To register a property:");
    console.log('  await contract.registerProperty(');
    console.log('    100,  // area in sqm');
    console.log('    3,    // bedrooms');
    console.log('    2,    // bathrooms');
    console.log('    2020, // year built');
    console.log('    5,    // floor level');
    console.log('    85    // location score (0-100)');
    console.log('  );\n');

    console.log("To submit a valuation (valuators only):");
    console.log('  await contract.submitValuation(');
    console.log('    1,        // propertyId');
    console.log('    500000,   // estimated value');
    console.log('    90        // confidence score (0-100)');
    console.log('  );\n');

    console.log("To get encrypted valuation data:");
    console.log('  const data = await contract.getEncryptedValuation(valuationId);\n');

    console.log("To mark valuation as revealed:");
    console.log('  await contract.markValuationRevealed(valuationId, value, confidence);\n');

    console.log("To pause the contract (pausers only):");
    console.log('  await contract.pause();\n');

    console.log("To unpause the contract (owner only):");
    console.log('  await contract.unpause();\n');

  } catch (error) {
    console.error("❌ Error reading contract state:");
    console.error(error.message);
    process.exit(1);
  }

  console.log("========================================\n");
}

// Example function to demonstrate property registration
async function registerSampleProperty(contract) {
  console.log("\n📝 Registering Sample Property...\n");

  try {
    const tx = await contract.registerProperty(
      120,  // 120 sqm
      3,    // 3 bedrooms
      2,    // 2 bathrooms
      2018, // built in 2018
      7,    // 7th floor
      80    // location score: 80/100
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Property registered successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // Find PropertyRegistered event
    const event = receipt.logs.find(
      log => log.topics[0] === contract.interface.getEvent("PropertyRegistered").topicHash
    );

    if (event) {
      const parsed = contract.interface.parseLog(event);
      console.log("Property ID:", parsed.args.propertyId.toString());
    }
  } catch (error) {
    console.error("❌ Error registering property:");
    console.error(error.message);
  }
}

// Example function to authorize a valuator
async function authorizeSampleValuator(contract, valuatorAddress) {
  console.log(`\n🔐 Authorizing Valuator: ${valuatorAddress}...\n`);

  try {
    const tx = await contract.authorizeValuator(valuatorAddress);
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Valuator authorized successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("❌ Error authorizing valuator:");
    console.error(error.message);
  }
}

// Example function to submit a valuation
async function submitSampleValuation(contract, propertyId) {
  console.log(`\n💰 Submitting Valuation for Property #${propertyId}...\n`);

  try {
    const tx = await contract.submitValuation(
      propertyId,
      450000,  // estimated value
      85       // confidence score: 85/100
    );

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Valuation submitted successfully!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // Find ValuationSubmitted event
    const event = receipt.logs.find(
      log => log.topics[0] === contract.interface.getEvent("ValuationSubmitted").topicHash
    );

    if (event) {
      const parsed = contract.interface.parseLog(event);
      console.log("Valuation ID:", parsed.args.valuationId.toString());
    }
  } catch (error) {
    console.error("❌ Error submitting valuation:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });

// Export functions for use in other scripts
module.exports = {
  registerSampleProperty,
  authorizeSampleValuator,
  submitSampleValuation
};
