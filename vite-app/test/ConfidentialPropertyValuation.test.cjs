const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Confidential Property Valuation System", function () {
  let signers;
  let contract;
  let contractAddress;

  async function deployFixture() {
    const factory = await ethers.getContractFactory("ConfidentialPropertyValuation");
    const deployedContract = await factory.deploy();
    await deployedContract.waitForDeployment();
    const address = await deployedContract.getAddress();

    return { contract: deployedContract, contractAddress: address };
  }

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Deployment and Initialization", function () {
    it("should deploy successfully", async function () {
      expect(contractAddress).to.be.properAddress;
    });

    it("should set the deployer as owner", async function () {
      const owner = await contract.owner();
      expect(owner).to.equal(signers.deployer.address);
    });

    it("should initialize with zero properties", async function () {
      const count = await contract.getPropertyCount();
      expect(count).to.equal(0);
    });

    it("should initialize with zero valuations", async function () {
      const count = await contract.getValuationCount();
      expect(count).to.equal(0);
    });

    it("should have no authorized valuators initially", async function () {
      const isAuthorized = await contract.authorizedValuators(signers.alice.address);
      expect(isAuthorized).to.be.false;
    });
  });

  describe("Property Registration", function () {
    const validProperty = {
      area: 120,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2010,
      floorLevel: 5,
      locationScore: 85,
    };

    it("should register a property successfully", async function () {
      const tx = await contract
        .connect(signers.alice)
        .registerProperty(
          validProperty.area,
          validProperty.bedrooms,
          validProperty.bathrooms,
          validProperty.yearBuilt,
          validProperty.floorLevel,
          validProperty.locationScore
        );

      await expect(tx)
        .to.emit(contract, "PropertyRegistered")
        .withArgs(1, signers.alice.address);
    });

    it("should increment property counter", async function () {
      await contract.connect(signers.alice).registerProperty(
        validProperty.area,
        validProperty.bedrooms,
        validProperty.bathrooms,
        validProperty.yearBuilt,
        validProperty.floorLevel,
        validProperty.locationScore
      );

      const count = await contract.getPropertyCount();
      expect(count).to.equal(1);
    });

    it("should return correct property ID", async function () {
      const tx = await contract
        .connect(signers.alice)
        .registerProperty(
          validProperty.area,
          validProperty.bedrooms,
          validProperty.bathrooms,
          validProperty.yearBuilt,
          validProperty.floorLevel,
          validProperty.locationScore
        );

      const receipt = await tx.wait();
      const propertyId = await contract.getPropertyCount();
      expect(propertyId).to.equal(1);
    });

    it("should store property details correctly", async function () {
      await contract.connect(signers.alice).registerProperty(
        validProperty.area,
        validProperty.bedrooms,
        validProperty.bathrooms,
        validProperty.yearBuilt,
        validProperty.floorLevel,
        validProperty.locationScore
      );

      const property = await contract.properties(1);
      expect(property.area).to.equal(validProperty.area);
      expect(property.bedrooms).to.equal(validProperty.bedrooms);
      expect(property.bathrooms).to.equal(validProperty.bathrooms);
      expect(property.yearBuilt).to.equal(validProperty.yearBuilt);
      expect(property.floorLevel).to.equal(validProperty.floorLevel);
      expect(property.locationScore).to.equal(validProperty.locationScore);
      expect(property.owner).to.equal(signers.alice.address);
      expect(property.active).to.be.true;
    });

    it("should add property to owner's list", async function () {
      await contract.connect(signers.alice).registerProperty(
        validProperty.area,
        validProperty.bedrooms,
        validProperty.bathrooms,
        validProperty.yearBuilt,
        validProperty.floorLevel,
        validProperty.locationScore
      );

      const properties = await contract.getOwnerProperties(signers.alice.address);
      expect(properties.length).to.equal(1);
      expect(properties[0]).to.equal(1);
    });

    it("should reject property with zero area", async function () {
      await expect(
        contract.connect(signers.alice).registerProperty(
          0, // zero area
          validProperty.bedrooms,
          validProperty.bathrooms,
          validProperty.yearBuilt,
          validProperty.floorLevel,
          validProperty.locationScore
        )
      ).to.be.revertedWith("Area must be greater than zero");
    });

    it("should reject property with invalid location score (zero)", async function () {
      await expect(
        contract.connect(signers.alice).registerProperty(
          validProperty.area,
          validProperty.bedrooms,
          validProperty.bathrooms,
          validProperty.yearBuilt,
          validProperty.floorLevel,
          0 // invalid score
        )
      ).to.be.revertedWith("Invalid location score");
    });

    it("should reject property with invalid location score (>100)", async function () {
      await expect(
        contract.connect(signers.alice).registerProperty(
          validProperty.area,
          validProperty.bedrooms,
          validProperty.bathrooms,
          validProperty.yearBuilt,
          validProperty.floorLevel,
          101 // invalid score
        )
      ).to.be.revertedWith("Invalid location score");
    });

    it("should allow multiple properties from same owner", async function () {
      await contract.connect(signers.alice).registerProperty(
        validProperty.area,
        validProperty.bedrooms,
        validProperty.bathrooms,
        validProperty.yearBuilt,
        validProperty.floorLevel,
        validProperty.locationScore
      );

      await contract.connect(signers.alice).registerProperty(
        150,
        4,
        3,
        2015,
        8,
        90
      );

      const properties = await contract.getOwnerProperties(signers.alice.address);
      expect(properties.length).to.equal(2);
    });

    it("should handle minimum valid values", async function () {
      await contract.connect(signers.alice).registerProperty(
        1, // minimum area
        0, // zero bedrooms
        0, // zero bathrooms
        0, // year 0
        0, // ground floor
        1  // minimum location score
      );

      const property = await contract.properties(1);
      expect(property.area).to.equal(1);
      expect(property.locationScore).to.equal(1);
    });

    it("should handle maximum valid location score", async function () {
      await contract.connect(signers.alice).registerProperty(
        validProperty.area,
        validProperty.bedrooms,
        validProperty.bathrooms,
        validProperty.yearBuilt,
        validProperty.floorLevel,
        100 // maximum valid score
      );

      const property = await contract.properties(1);
      expect(property.locationScore).to.equal(100);
    });
  });

  describe("Valuator Authorization", function () {
    it("should authorize a valuator by owner", async function () {
      const tx = await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);

      await expect(tx)
        .to.emit(contract, "ValuatorAuthorized")
        .withArgs(signers.alice.address);

      const isAuthorized = await contract.authorizedValuators(signers.alice.address);
      expect(isAuthorized).to.be.true;
    });

    it("should reject authorization from non-owner", async function () {
      await expect(
        contract.connect(signers.alice).authorizeValuator(signers.bob.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should reject authorization of zero address", async function () {
      await expect(
        contract.connect(signers.deployer).authorizeValuator(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("should reject duplicate authorization", async function () {
      await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);

      await expect(
        contract.connect(signers.deployer).authorizeValuator(signers.alice.address)
      ).to.be.revertedWith("Already authorized");
    });

    it("should revoke valuator authorization", async function () {
      await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);

      const tx = await contract.connect(signers.deployer).revokeValuator(signers.alice.address);

      await expect(tx)
        .to.emit(contract, "ValuatorRevoked")
        .withArgs(signers.alice.address);

      const isAuthorized = await contract.authorizedValuators(signers.alice.address);
      expect(isAuthorized).to.be.false;
    });

    it("should reject revocation from non-owner", async function () {
      await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);

      await expect(
        contract.connect(signers.bob).revokeValuator(signers.alice.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("should reject revocation of non-authorized valuator", async function () {
      await expect(
        contract.connect(signers.deployer).revokeValuator(signers.alice.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should allow multiple valuators", async function () {
      await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);

      expect(await contract.authorizedValuators(signers.alice.address)).to.be.true;
      expect(await contract.authorizedValuators(signers.bob.address)).to.be.true;
    });
  });

  describe("Valuation Submission", function () {
    beforeEach(async function () {
      // Register a property
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      // Authorize valuator
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);
    });

    it("should submit valuation successfully", async function () {
      const tx = await contract.connect(signers.bob).submitValuation(
        1, // propertyId
        500000, // estimated value
        90 // confidence score
      );

      await expect(tx)
        .to.emit(contract, "ValuationSubmitted")
        .withArgs(1, 1, signers.bob.address);
    });

    it("should increment valuation counter", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);

      const count = await contract.getValuationCount();
      expect(count).to.equal(1);
    });

    it("should store valuation details correctly", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);

      const valuation = await contract.valuations(1);
      expect(valuation.propertyId).to.equal(1);
      expect(valuation.valuator).to.equal(signers.bob.address);
      expect(valuation.estimatedValue).to.equal(500000);
      expect(valuation.confidenceScore).to.equal(90);
      expect(valuation.timestamp).to.be.gt(0);
    });

    it("should reject valuation from unauthorized valuator", async function () {
      await expect(
        contract.connect(signers.charlie).submitValuation(1, 500000, 90)
      ).to.be.revertedWith("Not authorized valuator");
    });

    it("should reject valuation for non-existent property", async function () {
      await expect(
        contract.connect(signers.bob).submitValuation(999, 500000, 90)
      ).to.be.revertedWith("Property not active");
    });

    it("should reject valuation with zero value", async function () {
      await expect(
        contract.connect(signers.bob).submitValuation(1, 0, 90)
      ).to.be.revertedWith("Valuation must be greater than zero");
    });

    it("should reject valuation with invalid confidence score (zero)", async function () {
      await expect(
        contract.connect(signers.bob).submitValuation(1, 500000, 0)
      ).to.be.revertedWith("Invalid confidence score");
    });

    it("should reject valuation with invalid confidence score (>100)", async function () {
      await expect(
        contract.connect(signers.bob).submitValuation(1, 500000, 101)
      ).to.be.revertedWith("Invalid confidence score");
    });

    it("should allow multiple valuations for same property", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);

      // Authorize another valuator
      await contract.connect(signers.deployer).authorizeValuator(signers.charlie.address);
      await contract.connect(signers.charlie).submitValuation(1, 520000, 85);

      const count = await contract.getValuationCount();
      expect(count).to.equal(2);
    });
  });

  describe("Average Valuation Calculation", function () {
    beforeEach(async function () {
      // Register a property
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      // Authorize valuators
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);
      await contract.connect(signers.deployer).authorizeValuator(signers.charlie.address);
    });

    it("should return false for property with no valuations", async function () {
      const result = await contract.calculateAverageValuation(1);

      expect(result.hasRevealed).to.be.false;
      expect(result.averageValue).to.equal(0);
      expect(result.averageConfidence).to.equal(0);
      expect(result.valuationCount).to.equal(0);
    });

    it("should calculate average with single valuation", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);

      const result = await contract.calculateAverageValuation(1);

      expect(result.hasRevealed).to.be.true;
      expect(result.averageValue).to.equal(500000);
      expect(result.averageConfidence).to.equal(90);
      expect(result.valuationCount).to.equal(1);
    });

    it("should calculate average with multiple valuations", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);
      await contract.connect(signers.charlie).submitValuation(1, 600000, 80);

      const result = await contract.calculateAverageValuation(1);

      expect(result.hasRevealed).to.be.true;
      expect(result.averageValue).to.equal(550000); // (500000 + 600000) / 2
      expect(result.averageConfidence).to.equal(85); // (90 + 80) / 2
      expect(result.valuationCount).to.equal(2);
    });

    it("should handle three valuations correctly", async function () {
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);
      await contract.connect(signers.charlie).submitValuation(1, 600000, 80);

      // Register and authorize third property and valuator
      await contract.connect(signers.alice).registerProperty(150, 4, 3, 2015, 8, 90);
      await contract.connect(signers.deployer).authorizeValuator(signers.deployer.address);
      await contract.connect(signers.deployer).submitValuation(1, 540000, 95);

      const result = await contract.calculateAverageValuation(1);

      expect(result.hasRevealed).to.be.true;
      expect(result.averageValue).to.equal(546666); // (500000 + 600000 + 540000) / 3
      expect(result.averageConfidence).to.equal(88); // (90 + 80 + 95) / 3
      expect(result.valuationCount).to.equal(3);
    });
  });

  describe("View Functions", function () {
    it("should return empty array for owner with no properties", async function () {
      const properties = await contract.getOwnerProperties(signers.alice.address);
      expect(properties.length).to.equal(0);
    });

    it("should return correct property count", async function () {
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      await contract.connect(signers.bob).registerProperty(150, 4, 3, 2015, 8, 90);

      const count = await contract.getPropertyCount();
      expect(count).to.equal(2);
    });

    it("should return correct valuation count", async function () {
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);
      await contract.connect(signers.bob).submitValuation(1, 500000, 90);

      const count = await contract.getValuationCount();
      expect(count).to.equal(1);
    });
  });

  describe("Edge Cases and Security", function () {
    it("should handle maximum uint32 values for property fields", async function () {
      const maxUint32 = 4294967295; // 2^32 - 1

      await contract.connect(signers.alice).registerProperty(
        maxUint32, // area
        maxUint32, // bedrooms
        maxUint32, // bathrooms
        maxUint32, // yearBuilt
        maxUint32, // floorLevel
        100 // locationScore (capped at 100)
      );

      const property = await contract.properties(1);
      expect(property.area).to.equal(maxUint32);
    });

    it("should handle maximum uint64 value for valuation", async function () {
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);

      const maxUint64Value = "18446744073709551615"; // 2^64 - 1

      await contract.connect(signers.bob).submitValuation(1, maxUint64Value, 90);

      const valuation = await contract.valuations(1);
      expect(valuation.estimatedValue).to.equal(maxUint64Value);
    });

    it("should maintain separate property lists for different owners", async function () {
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      await contract.connect(signers.bob).registerProperty(150, 4, 3, 2015, 8, 90);

      const aliceProperties = await contract.getOwnerProperties(signers.alice.address);
      const bobProperties = await contract.getOwnerProperties(signers.bob.address);

      expect(aliceProperties.length).to.equal(1);
      expect(bobProperties.length).to.equal(1);
      expect(aliceProperties[0]).to.not.equal(bobProperties[0]);
    });

    it("should not allow property ID 0", async function () {
      const result = await contract.calculateAverageValuation(0);
      expect(result.hasRevealed).to.be.false;
    });
  });

  describe("Gas Optimization", function () {
    it("should register property efficiently", async function () {
      const tx = await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      const receipt = await tx.wait();

      // Property registration should use less than 200k gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("should submit valuation efficiently", async function () {
      await contract.connect(signers.alice).registerProperty(120, 3, 2, 2010, 5, 85);
      await contract.connect(signers.deployer).authorizeValuator(signers.bob.address);

      const tx = await contract.connect(signers.bob).submitValuation(1, 500000, 90);
      const receipt = await tx.wait();

      // Valuation submission should use less than 200k gas
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("should authorize valuator efficiently", async function () {
      const tx = await contract.connect(signers.deployer).authorizeValuator(signers.alice.address);
      const receipt = await tx.wait();

      // Authorization should use less than 100k gas
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });
});
