const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ConfidentialPropertyValuation - Comprehensive Test Suite", function () {
  let propertyValuation;
  let owner, valuator1, valuator2, propertyOwner1, propertyOwner2, pauser1, pauser2;

  async function deployPropertyValuationFixture() {
    const [owner, valuator1, valuator2, propertyOwner1, propertyOwner2, pauser1, pauser2] =
      await ethers.getSigners();

    const pauserAddresses = [pauser1.address, pauser2.address];
    const kmsGeneration = 1;

    const PropertyValuation = await ethers.getContractFactory("ConfidentialPropertyValuation");
    const propertyValuation = await PropertyValuation.deploy(pauserAddresses, kmsGeneration);
    await propertyValuation.waitForDeployment();

    return { propertyValuation, owner, valuator1, valuator2, propertyOwner1, propertyOwner2, pauser1, pauser2 };
  }

  describe("🚀 Deployment and Initialization", function () {
    it("should set correct owner", async function () {
      const { propertyValuation, owner } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.owner()).to.equal(owner.address);
    });

    it("should initialize property and valuation IDs starting from 1", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.nextPropertyId()).to.equal(1);
      expect(await propertyValuation.nextValuationId()).to.equal(1);
    });

    it("should initialize as unpaused state", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.isPaused()).to.equal(false);
    });

    it("should correctly initialize pauser addresses", async function () {
      const { propertyValuation, pauser1, pauser2 } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.isPauserAddress(pauser1.address)).to.equal(true);
      expect(await propertyValuation.isPauserAddress(pauser2.address)).to.equal(true);
      expect(await propertyValuation.getPauserCount()).to.equal(2);
    });

    it("should correctly set KMS generation", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.kmsGeneration()).to.equal(1);
    });

    it("should initialize decryption counter to 0", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.decryptionRequestCounter()).to.equal(0);
    });
  });

  describe("👥 Valuator Authorization Management", function () {
    it("should allow owner to authorize valuator", async function () {
      const { propertyValuation, owner, valuator1 } = await loadFixture(deployPropertyValuationFixture);
      await expect(propertyValuation.connect(owner).authorizeValuator(valuator1.address))
        .to.emit(propertyValuation, "ValuatorAuthorized")
        .withArgs(valuator1.address);

      expect(await propertyValuation.authorizedValuators(valuator1.address)).to.equal(true);
    });

    it("should allow owner to revoke valuator authorization", async function () {
      const { propertyValuation, owner, valuator1 } = await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(owner).authorizeValuator(valuator1.address);

      await expect(propertyValuation.connect(owner).revokeValuator(valuator1.address))
        .to.emit(propertyValuation, "ValuatorRevoked")
        .withArgs(valuator1.address);

      expect(await propertyValuation.authorizedValuators(valuator1.address)).to.equal(false);
    });

    it("should reject non-owner authorizing valuator", async function () {
      const { propertyValuation, valuator1, valuator2 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(valuator1).authorizeValuator(valuator2.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should allow authorizing multiple valuators", async function () {
      const { propertyValuation, owner, valuator1, valuator2 } = await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(owner).authorizeValuator(valuator1.address);
      await propertyValuation.connect(owner).authorizeValuator(valuator2.address);

      expect(await propertyValuation.authorizedValuators(valuator1.address)).to.equal(true);
      expect(await propertyValuation.authorizedValuators(valuator2.address)).to.equal(true);
    });
  });

  describe("🏠 Property Registration", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.propertyOwner1 = fixture.propertyOwner1;
      this.propertyOwner2 = fixture.propertyOwner2;
    });

    it("should successfully register property", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).registerProperty(
          100,  // area
          3,    // bedrooms
          2,    // bathrooms
          2020, // yearBuilt
          5,    // floorLevel
          85    // locationScore
        )
      ).to.emit(this.propertyValuation, "PropertyRegistered")
        .withArgs(1, this.propertyOwner1.address);
    });

    it("should increment property ID", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
      expect(await this.propertyValuation.nextPropertyId()).to.equal(2);

      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(120, 4, 2, 2021, 3, 90);
      expect(await this.propertyValuation.nextPropertyId()).to.equal(3);
    });

    it("should reject invalid location score (>100)", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 101)
      ).to.be.revertedWith("Location score must be 0-100");
    });

    it("should reject zero area", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).registerProperty(0, 3, 2, 2020, 5, 85)
      ).to.be.revertedWith("Area must be greater than 0");
    });

    it("should reject unrealistic built year", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 1799, 5, 85)
      ).to.be.revertedWith("Year built must be realistic");
    });

    it("should allow different users to register multiple properties", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(120, 4, 2, 2021, 3, 90);
      await this.propertyValuation.connect(this.propertyOwner2).registerProperty(80, 2, 1, 2019, 2, 75);

      const owner1Properties = await this.propertyValuation.connect(this.propertyOwner1)
        .getOwnerProperties(this.propertyOwner1.address);
      expect(owner1Properties.length).to.equal(2);

      const owner2Properties = await this.propertyValuation.connect(this.propertyOwner2)
        .getOwnerProperties(this.propertyOwner2.address);
      expect(owner2Properties.length).to.equal(1);
    });

    it("should correctly store property information", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);

      const propertyInfo = await this.propertyValuation.connect(this.propertyOwner1).getPropertyInfo(1);
      expect(propertyInfo.isActive).to.equal(true);
      expect(propertyInfo.valuationCount).to.equal(0);
    });

    it("should reject registration when paused", async function () {
      const { propertyValuation, pauser1, propertyOwner1 } = await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(pauser1).pause();

      await expect(
        propertyValuation.connect(propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85)
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("💰 Valuation Submission", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.owner = fixture.owner;
      this.valuator1 = fixture.valuator1;
      this.valuator2 = fixture.valuator2;
      this.propertyOwner1 = fixture.propertyOwner1;

      // Authorize valuators
      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator1.address);
      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator2.address);

      // Register property
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
    });

    it("should allow authorized valuator to submit valuation", async function () {
      await expect(
        this.propertyValuation.connect(this.valuator1).submitValuation(
          1,        // propertyId
          500000,   // estimatedValue
          90        // confidenceScore
        )
      ).to.emit(this.propertyValuation, "ValuationSubmitted")
        .withArgs(1, 1, this.valuator1.address);
    });

    it("should increment valuation ID", async function () {
      await this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90);
      expect(await this.propertyValuation.nextValuationId()).to.equal(2);

      await this.propertyValuation.connect(this.valuator2).submitValuation(1, 510000, 85);
      expect(await this.propertyValuation.nextValuationId()).to.equal(3);
    });

    it("should reject unauthorized valuator submission", async function () {
      const { propertyOwner2 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        this.propertyValuation.connect(propertyOwner2).submitValuation(1, 500000, 90)
      ).to.be.revertedWith("Not authorized valuator");
    });

    it("should reject valuation for inactive property", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).deactivateProperty(1);

      await expect(
        this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90)
      ).to.be.revertedWith("Property not active");
    });

    it("should reject invalid confidence score (>100)", async function () {
      await expect(
        this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 101)
      ).to.be.revertedWith("Confidence score must be 0-100");
    });

    it("should reject zero valuation", async function () {
      await expect(
        this.propertyValuation.connect(this.valuator1).submitValuation(1, 0, 90)
      ).to.be.revertedWith("Valuation must be positive");
    });

    it("should allow multiple valuators to value same property", async function () {
      await this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90);
      await this.propertyValuation.connect(this.valuator2).submitValuation(1, 510000, 85);
      await this.propertyValuation.connect(this.valuator1).submitValuation(1, 505000, 88);

      const valuations = await this.propertyValuation.connect(this.propertyOwner1)
        .getPropertyValuations(1);
      expect(valuations.length).to.equal(3);
    });

    it("should reject valuation submission when paused", async function () {
      const { pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await this.propertyValuation.connect(pauser1).pause();

      await expect(
        this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90)
      ).to.be.revertedWith("Contract is paused");
    });
  });

  describe("🔓 Valuation Reveal", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.owner = fixture.owner;
      this.valuator1 = fixture.valuator1;
      this.propertyOwner1 = fixture.propertyOwner1;
      this.propertyOwner2 = fixture.propertyOwner2;

      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator1.address);
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
      await this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90);
    });

    it("should allow property owner to request reveal", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).requestValuationReveal(1)
      ).to.not.be.reverted;
    });

    it("should allow valuator to request reveal", async function () {
      await expect(
        this.propertyValuation.connect(this.valuator1).requestValuationReveal(1)
      ).to.not.be.reverted;
    });

    it("should reject unauthorized user requesting reveal", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner2).requestValuationReveal(1)
      ).to.be.revertedWith("Not authorized to reveal");
    });

    it("should reject reveal for non-existent valuation", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner1).requestValuationReveal(999)
      ).to.be.revertedWith("Valuation not found");
    });
  });

  describe("🏛️ Pauser Management", function () {
    it("should allow owner to add pauser", async function () {
      const { propertyValuation, owner, valuator1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(propertyValuation.connect(owner).addPauser(valuator1.address))
        .to.emit(propertyValuation, "PauserAdded");

      expect(await propertyValuation.isPauserAddress(valuator1.address)).to.equal(true);
    });

    it("should reject adding zero address as pauser", async function () {
      const { propertyValuation, owner } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(owner).addPauser(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid pauser address");
    });

    it("should reject duplicate pauser addition", async function () {
      const { propertyValuation, owner, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(owner).addPauser(pauser1.address)
      ).to.be.revertedWith("Already a pauser");
    });

    it("should allow owner to remove pauser", async function () {
      const { propertyValuation, owner, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(propertyValuation.connect(owner).removePauser(pauser1.address))
        .to.emit(propertyValuation, "PauserRemoved");

      expect(await propertyValuation.isPauserAddress(pauser1.address)).to.equal(false);
    });

    it("should reject non-owner adding pauser", async function () {
      const { propertyValuation, valuator1, valuator2 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(valuator1).addPauser(valuator2.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("⏸️ Pause Functionality", function () {
    it("should allow pauser to pause contract", async function () {
      const { propertyValuation, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(propertyValuation.connect(pauser1).pause())
        .to.emit(propertyValuation, "ContractPaused");

      expect(await propertyValuation.isPaused()).to.equal(true);
    });

    it("should allow owner to unpause", async function () {
      const { propertyValuation, owner, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(pauser1).pause();

      await expect(propertyValuation.connect(owner).unpause())
        .to.emit(propertyValuation, "ContractUnpaused");

      expect(await propertyValuation.isPaused()).to.equal(false);
    });

    it("should reject non-pauser pausing contract", async function () {
      const { propertyValuation, valuator1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(valuator1).pause()
      ).to.be.revertedWith("Not a pauser");
    });

    it("should reject duplicate pause", async function () {
      const { propertyValuation, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(pauser1).pause();

      await expect(
        propertyValuation.connect(pauser1).pause()
      ).to.be.revertedWith("Already paused");
    });

    it("should reject unpausing non-paused contract", async function () {
      const { propertyValuation, owner } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(owner).unpause()
      ).to.be.revertedWith("Not paused");
    });
  });

  describe("🔑 KMS Management", function () {
    it("should allow owner to update KMS generation", async function () {
      const { propertyValuation, owner } = await loadFixture(deployPropertyValuationFixture);

      await expect(propertyValuation.connect(owner).updateKmsGeneration(2))
        .to.emit(propertyValuation, "KmsGenerationUpdated")
        .withArgs(1, 2);

      expect(await propertyValuation.kmsGeneration()).to.equal(2);
    });

    it("should reject non-owner updating KMS generation", async function () {
      const { propertyValuation, valuator1 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(valuator1).updateKmsGeneration(2)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("🏠 Property Management", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.propertyOwner1 = fixture.propertyOwner1;
      this.propertyOwner2 = fixture.propertyOwner2;

      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
    });

    it("should allow property owner to deactivate property", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).deactivateProperty(1);

      const propertyInfo = await this.propertyValuation.connect(this.propertyOwner1).getPropertyInfo(1);
      expect(propertyInfo.isActive).to.equal(false);
    });

    it("should allow property owner to reactivate property", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).deactivateProperty(1);
      await this.propertyValuation.connect(this.propertyOwner1).reactivateProperty(1);

      const propertyInfo = await this.propertyValuation.connect(this.propertyOwner1).getPropertyInfo(1);
      expect(propertyInfo.isActive).to.equal(true);
    });

    it("should reject non-owner deactivating property", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner2).deactivateProperty(1)
      ).to.be.revertedWith("Not property owner");
    });

    it("should reject non-owner viewing property info", async function () {
      await expect(
        this.propertyValuation.connect(this.propertyOwner2).getPropertyInfo(1)
      ).to.be.revertedWith("Not property owner");
    });
  });

  describe("📊 Average Valuation Calculation", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.owner = fixture.owner;
      this.valuator1 = fixture.valuator1;
      this.valuator2 = fixture.valuator2;
      this.propertyOwner1 = fixture.propertyOwner1;

      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator1.address);
      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator2.address);
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
    });

    it("should return correct result for property without valuations", async function () {
      const result = await this.propertyValuation.connect(this.propertyOwner1)
        .calculateAverageValuation(1);

      expect(result.hasRevealed).to.equal(false);
      expect(result.valuationCount).to.equal(0);
    });

    it("should reject unauthorized user calculating average", async function () {
      const { propertyOwner2 } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        this.propertyValuation.connect(propertyOwner2).calculateAverageValuation(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject calculating average for inactive property", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).deactivateProperty(1);

      await expect(
        this.propertyValuation.connect(this.propertyOwner1).calculateAverageValuation(1)
      ).to.be.revertedWith("Property not active");
    });
  });

  describe("📋 View Functions", function () {
    it("should return correct pauser count", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);
      expect(await propertyValuation.getPauserCount()).to.equal(2);
    });

    it("should return pauser address at index", async function () {
      const { propertyValuation, pauser1, pauser2 } = await loadFixture(deployPropertyValuationFixture);

      expect(await propertyValuation.getPauserAtIndex(0)).to.equal(pauser1.address);
      expect(await propertyValuation.getPauserAtIndex(1)).to.equal(pauser2.address);
    });

    it("should reject out-of-bounds pauser index", async function () {
      const { propertyValuation } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.getPauserAtIndex(10)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("should correctly return contract pause status", async function () {
      const { propertyValuation, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      expect(await propertyValuation.isContractPaused()).to.equal(false);

      await propertyValuation.connect(pauser1).pause();

      expect(await propertyValuation.isContractPaused()).to.equal(true);
    });

    it("should correctly verify pauser address", async function () {
      const { propertyValuation, pauser1, valuator1 } = await loadFixture(deployPropertyValuationFixture);

      expect(await propertyValuation.isPauser(pauser1.address)).to.equal(true);
      expect(await propertyValuation.isPauser(valuator1.address)).to.equal(false);
    });

    it("should correctly return public decrypt allowed status", async function () {
      const { propertyValuation, pauser1 } = await loadFixture(deployPropertyValuationFixture);

      expect(await propertyValuation.isPublicDecryptAllowed()).to.equal(true);

      await propertyValuation.connect(pauser1).pause();

      expect(await propertyValuation.isPublicDecryptAllowed()).to.equal(false);
    });
  });

  describe("⛽ Gas Optimization Tests", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployPropertyValuationFixture);
      this.propertyValuation = fixture.propertyValuation;
      this.owner = fixture.owner;
      this.valuator1 = fixture.valuator1;
      this.propertyOwner1 = fixture.propertyOwner1;

      await this.propertyValuation.connect(this.owner).authorizeValuator(this.valuator1.address);
    });

    it("property registration gas cost should be reasonable", async function () {
      const tx = await this.propertyValuation.connect(this.propertyOwner1)
        .registerProperty(100, 3, 2, 2020, 5, 85);
      const receipt = await tx.wait();

      console.log(`   Property Registration Gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(1000000);
    });

    it("valuation submission gas cost should be reasonable", async function () {
      await this.propertyValuation.connect(this.propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);

      const tx = await this.propertyValuation.connect(this.valuator1).submitValuation(1, 500000, 90);
      const receipt = await tx.wait();

      console.log(`   Valuation Submission Gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(800000);
    });

    it("add pauser gas cost should be reasonable", async function () {
      const { valuator2 } = await loadFixture(deployPropertyValuationFixture);

      const tx = await this.propertyValuation.connect(this.owner).addPauser(valuator2.address);
      const receipt = await tx.wait();

      console.log(`   Add Pauser Gas: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });

  describe("🔄 Edge Cases and Security", function () {
    it("should handle zero address check", async function () {
      const { propertyValuation, owner } = await loadFixture(deployPropertyValuationFixture);

      await expect(
        propertyValuation.connect(owner).addPauser(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid pauser address");
    });

    it("should maintain state consistency across multiple operations", async function () {
      const { propertyValuation, owner, valuator1, valuator2, propertyOwner1 } =
        await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(owner).authorizeValuator(valuator1.address);
      await propertyValuation.connect(owner).authorizeValuator(valuator2.address);

      await propertyValuation.connect(propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85);
      await propertyValuation.connect(propertyOwner1).registerProperty(120, 4, 2, 2021, 3, 90);

      await propertyValuation.connect(valuator1).submitValuation(1, 500000, 90);
      await propertyValuation.connect(valuator2).submitValuation(1, 510000, 85);
      await propertyValuation.connect(valuator1).submitValuation(2, 600000, 88);

      expect(await propertyValuation.nextPropertyId()).to.equal(3);
      expect(await propertyValuation.nextValuationId()).to.equal(4);

      const property1Valuations = await propertyValuation.connect(propertyOwner1)
        .getPropertyValuations(1);
      expect(property1Valuations.length).to.equal(2);

      const property2Valuations = await propertyValuation.connect(propertyOwner1)
        .getPropertyValuations(2);
      expect(property2Valuations.length).to.equal(1);
    });

    it("should correctly handle emergency pause", async function () {
      const { propertyValuation, pauser1, propertyOwner1 } =
        await loadFixture(deployPropertyValuationFixture);

      await propertyValuation.connect(pauser1).emergencyPause();

      expect(await propertyValuation.isPaused()).to.equal(true);

      await expect(
        propertyValuation.connect(propertyOwner1).registerProperty(100, 3, 2, 2020, 5, 85)
      ).to.be.revertedWith("Contract is paused");
    });
  });
});
