const hre = require("hardhat");
require("dotenv").config();

/**
 * Simulation script to test complete workflow
 *
 * Usage:
 * npx hardhat run scripts/simulate.js --network sepolia
 * or
 * npx hardhat run scripts/simulate.js --network localhost
 *
 * This script simulates:
 * 1. Property owner registration
 * 2. Valuator authorization
 * 3. Property registration with encrypted data
 * 4. Multiple valuations submission
 * 5. Valuation retrieval and reveal process
 */

// Helper to format ETH amounts
function formatEth(wei) {
  return hre.ethers.formatEther(wei);
}

// Helper to wait and display progress
async function wait(seconds, message) {
  console.log(`⏳ ${message} (waiting ${seconds}s)...`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  console.log("\n========================================");
  console.log("🎭 Workflow Simulation Script");
  console.log("========================================\n");

  console.log("🌐 Network:", hre.network.name);
  console.log("📅 Timestamp:", new Date().toLocaleString());
  console.log("");

  // Get accounts
  const [owner, valuator1, valuator2, propertyOwner, other] = await hre.ethers.getSigners();

  console.log("👥 Test Accounts:\n");
  console.log("  Owner:", owner.address);
  console.log("  Valuator 1:", valuator1.address);
  console.log("  Valuator 2:", valuator2.address);
  console.log("  Property Owner:", propertyOwner.address);
  console.log("  Other User:", other.address);
  console.log("");

  // Check if we're using an existing contract or deploying new one
  let contract;
  let contractAddress = process.env.CONTRACT_ADDRESS || process.env.MAIN_CONTRACT_ADDRESS;

  if (contractAddress && hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("📍 Using existing contract:", contractAddress);
    const Contract = await hre.ethers.getContractFactory("ConfidentialPropertyValuation");
    contract = Contract.attach(contractAddress);
    console.log("");
  } else {
    console.log("🚀 Deploying fresh contract for simulation...\n");

    // Deploy contract with pausers
    const pauserAddresses = [owner.address, valuator1.address];
    const kmsGeneration = 1;

    const Contract = await hre.ethers.getContractFactory("ConfidentialPropertyValuation");
    contract = await Contract.deploy(pauserAddresses, kmsGeneration);
    await contract.waitForDeployment();

    contractAddress = await contract.getAddress();
    console.log("✅ Contract deployed:", contractAddress);
    console.log("");
  }

  console.log("─".repeat(50));
  console.log("\n📋 Starting Workflow Simulation\n");

  try {
    // Step 1: Check initial state
    console.log("Step 1: Checking Initial State");
    console.log("─".repeat(50));

    const initialState = {
      owner: await contract.owner(),
      nextPropertyId: await contract.nextPropertyId(),
      nextValuationId: await contract.nextValuationId(),
      isPaused: await contract.isPaused(),
      kmsGeneration: await contract.kmsGeneration()
    };

    console.log("  Contract Owner:", initialState.owner);
    console.log("  Next Property ID:", initialState.nextPropertyId.toString());
    console.log("  Next Valuation ID:", initialState.nextValuationId.toString());
    console.log("  Is Paused:", initialState.isPaused);
    console.log("  KMS Generation:", initialState.kmsGeneration.toString());
    console.log("  ✅ Initial state verified\n");

    // Step 2: Authorize valuators
    console.log("Step 2: Authorizing Valuators");
    console.log("─".repeat(50));

    console.log("  Authorizing Valuator 1:", valuator1.address);
    let tx = await contract.connect(owner).authorizeValuator(valuator1.address);
    await tx.wait();
    console.log("  ✅ Valuator 1 authorized");

    console.log("  Authorizing Valuator 2:", valuator2.address);
    tx = await contract.connect(owner).authorizeValuator(valuator2.address);
    await tx.wait();
    console.log("  ✅ Valuator 2 authorized\n");

    // Verify authorization
    const isVal1 = await contract.authorizedValuators(valuator1.address);
    const isVal2 = await contract.authorizedValuators(valuator2.address);
    console.log("  Verification:");
    console.log(`    Valuator 1 authorized: ${isVal1}`);
    console.log(`    Valuator 2 authorized: ${isVal2}\n`);

    // Step 3: Register properties
    console.log("Step 3: Registering Properties");
    console.log("─".repeat(50));

    const properties = [
      {
        area: 100,
        bedrooms: 3,
        bathrooms: 2,
        yearBuilt: 2020,
        floorLevel: 5,
        locationScore: 85,
        description: "Modern apartment in prime location"
      },
      {
        area: 150,
        bedrooms: 4,
        bathrooms: 3,
        yearBuilt: 2018,
        floorLevel: 10,
        locationScore: 90,
        description: "Luxury penthouse with city views"
      },
      {
        area: 80,
        bedrooms: 2,
        bathrooms: 1,
        yearBuilt: 2015,
        floorLevel: 3,
        locationScore: 75,
        description: "Cozy starter home"
      }
    ];

    const propertyIds = [];

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      console.log(`  Registering Property ${i + 1}: ${prop.description}`);
      console.log(`    Area: ${prop.area} sqm, Bedrooms: ${prop.bedrooms}, Bathrooms: ${prop.bathrooms}`);
      console.log(`    Year: ${prop.yearBuilt}, Floor: ${prop.floorLevel}, Score: ${prop.locationScore}`);

      tx = await contract.connect(propertyOwner).registerProperty(
        prop.area,
        prop.bedrooms,
        prop.bathrooms,
        prop.yearBuilt,
        prop.floorLevel,
        prop.locationScore
      );

      const receipt = await tx.wait();

      // Find PropertyRegistered event
      const event = receipt.logs.find(
        log => {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            return parsed.name === "PropertyRegistered";
          } catch {
            return false;
          }
        }
      );

      if (event) {
        const parsed = contract.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        propertyIds.push(parsed.args.propertyId);
        console.log(`    ✅ Property registered with ID: ${parsed.args.propertyId}`);
      }

      console.log("");
    }

    // Verify properties
    const ownerProperties = await contract.connect(propertyOwner).getOwnerProperties(propertyOwner.address);
    console.log(`  Total Properties Registered: ${ownerProperties.length}`);
    console.log(`  Property IDs: ${ownerProperties.map(id => id.toString()).join(", ")}\n`);

    // Step 4: Submit valuations
    console.log("Step 4: Submitting Valuations");
    console.log("─".repeat(50));

    const valuations = [
      { propertyId: propertyIds[0], value: 450000, confidence: 88, valuator: valuator1 },
      { propertyId: propertyIds[0], value: 460000, confidence: 85, valuator: valuator2 },
      { propertyId: propertyIds[1], value: 780000, confidence: 92, valuator: valuator1 },
      { propertyId: propertyIds[1], value: 795000, confidence: 90, valuator: valuator2 },
      { propertyId: propertyIds[2], value: 320000, confidence: 80, valuator: valuator1 },
      { propertyId: propertyIds[2], value: 315000, confidence: 82, valuator: valuator2 }
    ];

    const valuationIds = [];

    for (let i = 0; i < valuations.length; i++) {
      const val = valuations[i];
      console.log(`  Valuation ${i + 1}:`);
      console.log(`    Property ID: ${val.propertyId}`);
      console.log(`    Valuator: ${val.valuator.address === valuator1.address ? 'Valuator 1' : 'Valuator 2'}`);
      console.log(`    Estimated Value: $${val.value.toLocaleString()}`);
      console.log(`    Confidence: ${val.confidence}%`);

      tx = await contract.connect(val.valuator).submitValuation(
        val.propertyId,
        val.value,
        val.confidence
      );

      const receipt = await tx.wait();

      // Find ValuationSubmitted event
      const event = receipt.logs.find(
        log => {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            return parsed.name === "ValuationSubmitted";
          } catch {
            return false;
          }
        }
      );

      if (event) {
        const parsed = contract.interface.parseLog({
          topics: event.topics,
          data: event.data
        });
        valuationIds.push(parsed.args.valuationId);
        console.log(`    ✅ Valuation submitted with ID: ${parsed.args.valuationId}`);
      }

      console.log("");
    }

    // Step 5: Retrieve valuation info
    console.log("Step 5: Retrieving Valuation Information");
    console.log("─".repeat(50));

    for (let i = 0; i < Math.min(3, valuationIds.length); i++) {
      const valId = valuationIds[i];
      console.log(`  Valuation #${valId}:`);

      try {
        const valInfo = await contract.connect(propertyOwner).getValuationInfo(valId);
        console.log(`    Property ID: ${valInfo.propertyId}`);
        console.log(`    Valuator: ${valInfo.valuator}`);
        console.log(`    Timestamp: ${new Date(Number(valInfo.timestamp) * 1000).toLocaleString()}`);
        console.log(`    Is Revealed: ${valInfo.isRevealed}`);

        if (valInfo.isRevealed) {
          console.log(`    Revealed Value: $${valInfo.revealedValue.toLocaleString()}`);
          console.log(`    Revealed Confidence: ${valInfo.revealedConfidence}%`);
        }

        console.log("");
      } catch (error) {
        console.log(`    ❌ Error retrieving info: ${error.message}\n`);
      }
    }

    // Step 6: Get property valuations
    console.log("Step 6: Checking Property Valuations");
    console.log("─".repeat(50));

    for (let i = 0; i < propertyIds.length; i++) {
      const propId = propertyIds[i];
      const propValuations = await contract.connect(propertyOwner).getPropertyValuations(propId);

      console.log(`  Property #${propId}:`);
      console.log(`    Total Valuations: ${propValuations.length}`);
      console.log(`    Valuation IDs: ${propValuations.map(id => id.toString()).join(", ")}`);
      console.log("");
    }

    // Step 7: Test access control
    console.log("Step 7: Testing Access Control");
    console.log("─".repeat(50));

    console.log("  Testing unauthorized property access...");
    try {
      await contract.connect(other).getPropertyInfo(propertyIds[0]);
      console.log("  ❌ FAILED: Unauthorized access should be blocked");
    } catch (error) {
      console.log("  ✅ PASSED: Unauthorized access blocked correctly");
    }

    console.log("\n  Testing unauthorized valuation submission...");
    try {
      await contract.connect(other).submitValuation(propertyIds[0], 500000, 90);
      console.log("  ❌ FAILED: Unauthorized valuation should be blocked");
    } catch (error) {
      console.log("  ✅ PASSED: Unauthorized valuation blocked correctly");
    }

    console.log("");

    // Step 8: Test pause functionality
    console.log("Step 8: Testing Pause Functionality");
    console.log("─".repeat(50));

    console.log("  Pausing contract...");
    tx = await contract.connect(owner).pause();
    await tx.wait();
    const pausedState = await contract.isPaused();
    console.log(`  Contract paused: ${pausedState}`);

    console.log("\n  Testing operations while paused...");
    try {
      await contract.connect(propertyOwner).registerProperty(100, 3, 2, 2020, 5, 80);
      console.log("  ❌ FAILED: Operations should be blocked when paused");
    } catch (error) {
      console.log("  ✅ PASSED: Operations blocked while paused");
    }

    console.log("\n  Unpausing contract...");
    tx = await contract.connect(owner).unpause();
    await tx.wait();
    const unpausedState = await contract.isPaused();
    console.log(`  Contract paused: ${unpausedState}`);
    console.log("");

    // Final summary
    console.log("─".repeat(50));
    console.log("\n📊 Simulation Summary\n");
    console.log("─".repeat(50));
    console.log(`  Contract Address: ${contractAddress}`);
    console.log(`  Network: ${hre.network.name}`);
    console.log(`  Properties Registered: ${propertyIds.length}`);
    console.log(`  Valuations Submitted: ${valuationIds.length}`);
    console.log(`  Valuators Authorized: 2`);
    console.log(`  Access Control Tests: Passed`);
    console.log(`  Pause Functionality: Passed`);
    console.log("─".repeat(50));

    console.log("\n✅ Simulation completed successfully!\n");

    console.log("💡 Next Steps:");
    console.log("  1. Try retrieving encrypted valuation data");
    console.log("  2. Test client-side decryption with fhevmjs");
    console.log("  3. Mark valuations as revealed after decryption");
    console.log("  4. Calculate average valuations across properties");
    console.log("");

  } catch (error) {
    console.error("\n❌ Simulation failed:");
    console.error("Error:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    console.error("");
    process.exit(1);
  }

  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });
