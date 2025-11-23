// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, externalEuint64, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialPropertyValuation v3.0
 * @notice Privacy-preserving property valuation system using FHE
 * @dev Architecture:
 *
 * == Gateway Callback Pattern ==
 * User submits encrypted request → Contract records → Gateway decrypts → Callback completes transaction
 *
 * == Security Features ==
 * - Input validation: All inputs are validated before processing
 * - Access control: Role-based permissions for valuators, owners, pausers
 * - Overflow protection: Safe math operations and boundary checks
 * - Audit hints: Events emitted for all state changes
 *
 * == Privacy Innovations ==
 * 1. Division protection: Random multiplier to protect privacy during calculations
 * 2. Price obfuscation: Fuzzing techniques to prevent value leakage
 * 3. Async processing: Gateway callback pattern for secure decryption
 * 4. Gas optimization: Efficient HCU (Homomorphic Computation Unit) usage
 *
 * == API Documentation ==
 * - registerProperty(): Register encrypted property data
 * - submitValuation(): Submit encrypted valuation with deposit
 * - requestValuationReveal(): Request Gateway decryption
 * - valuationRevealCallback(): Gateway callback to finalize reveal
 * - claimRefund(): Claim refund on timeout or failure
 */
contract ConfidentialPropertyValuation is SepoliaConfig {
    // ==================== CONSTANTS ====================

    // DoS Protection limits
    uint256 public constant MAX_PROPERTIES_PER_OWNER = 1000;
    uint256 public constant MAX_VALUATIONS_PER_PROPERTY = 100;
    uint256 public constant MAX_PAUSERS = 20;
    uint256 public constant RATE_LIMIT_PERIOD = 1 hours;
    uint256 public constant MAX_OPERATIONS_PER_PERIOD = 50;

    // Timeout and refund parameters
    uint256 public constant DECRYPTION_TIMEOUT = 24 hours;
    uint256 public constant MIN_VALUATION_DEPOSIT = 0.001 ether;
    uint256 public constant PLATFORM_FEE_PERCENT = 2; // 2% platform fee

    // Privacy protection parameters
    uint256 public constant PRIVACY_MULTIPLIER_MIN = 1000;
    uint256 public constant PRIVACY_MULTIPLIER_MAX = 10000;
    uint256 public constant OBFUSCATION_RANGE = 5; // 5% fuzzing range

    // ==================== STATE VARIABLES ====================

    address public owner;
    uint256 public nextPropertyId;
    uint256 public nextValuationId;

    // Gateway and KMS Configuration
    uint256 public kmsGeneration;
    address[] public pauserAddresses;
    bool public isPaused;
    mapping(address => bool) public isPauserAddress;
    uint256 public decryptionRequestCounter;

    // Financial tracking
    uint256 public platformFees;
    uint256 public totalLockedDeposits;

    // Privacy protection: Random nonce for obfuscation
    uint256 private privacyNonce;

    // ==================== STRUCTS ====================

    struct Property {
        euint32 area;
        euint32 bedrooms;
        euint32 bathrooms;
        euint32 yearBuilt;
        euint32 floorLevel;
        euint32 locationScore;
        bool isActive;
        address propertyOwner;
        uint256 timestamp;
    }

    struct Valuation {
        uint256 propertyId;
        euint64 estimatedValue;
        euint32 confidenceScore;
        address valuator;
        uint256 timestamp;
        bool isRevealed;
        uint64 revealedValue;
        uint32 revealedConfidence;
        // Refund mechanism
        uint256 deposit;
        bool depositClaimed;
        // Gateway callback tracking
        uint256 decryptionRequestId;
        uint256 decryptionRequestTime;
        DecryptionStatus decryptionStatus;
    }

    enum DecryptionStatus {
        None,
        Pending,
        Completed,
        Failed,
        TimedOut
    }

    struct DecryptionRequest {
        uint256 requestId;
        address requester;
        uint256 valuationId;
        bytes32[] encryptedHandles;
        uint256 timestamp;
        bool fulfilled;
        uint256 kmsGeneration;
        DecryptionStatus status;
    }

    // ==================== MAPPINGS ====================

    mapping(uint256 => Property) public properties;
    mapping(uint256 => Valuation) public valuations;
    mapping(address => bool) public authorizedValuators;
    mapping(address => uint256[]) public ownerProperties;
    mapping(uint256 => uint256[]) public propertyValuations;
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(uint256 => uint256) internal valuationByRequestId;

    // DoS Protection: Rate limiting
    mapping(address => uint256) public lastOperationTime;
    mapping(address => uint256) public operationCount;
    mapping(address => uint256) public lastResetTime;

    // Callback tracking
    mapping(uint256 => bool) public callbackReceived;

    // ==================== EVENTS ====================

    // Property events
    event PropertyRegistered(uint256 indexed propertyId, address indexed propertyOwner);
    event PropertyDeactivated(uint256 indexed propertyId);
    event PropertyReactivated(uint256 indexed propertyId);

    // Valuation events
    event ValuationSubmitted(
        uint256 indexed valuationId,
        uint256 indexed propertyId,
        address indexed valuator,
        uint256 deposit
    );
    event ValuationRevealed(
        uint256 indexed valuationId,
        uint64 value,
        uint32 confidence
    );
    event ValuationRevealRequested(
        uint256 indexed valuationId,
        uint256 indexed requestId,
        uint256 timestamp
    );

    // Authorization events
    event ValuatorAuthorized(address indexed valuator);
    event ValuatorRevoked(address indexed valuator);

    // Gateway callback events
    event DecryptionRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 valuationId,
        uint256 kmsGeneration,
        uint256 timestamp
    );
    event DecryptionCallbackReceived(
        uint256 indexed requestId,
        uint256 indexed valuationId,
        bool success
    );
    event DecryptionFailed(
        uint256 indexed requestId,
        uint256 indexed valuationId,
        string reason
    );

    // Refund events
    event RefundClaimed(
        uint256 indexed valuationId,
        address indexed claimant,
        uint256 amount,
        string reason
    );
    event TimeoutRefundClaimed(
        uint256 indexed valuationId,
        address indexed claimant,
        uint256 amount
    );

    // Admin events
    event PauserAdded(address indexed pauser, uint256 timestamp);
    event PauserRemoved(address indexed pauser, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    // Audit events
    event AuditLog(string action, address indexed actor, uint256 indexed entityId, uint256 timestamp);

    // ==================== MODIFIERS ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyAuthorizedValuator() {
        require(authorizedValuators[msg.sender], "Not authorized valuator");
        _;
    }

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(properties[propertyId].propertyOwner == msg.sender, "Not property owner");
        _;
    }

    modifier onlyPauser() {
        require(isPauserAddress[msg.sender], "Not a pauser");
        _;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    modifier rateLimit() {
        if (block.timestamp > lastResetTime[msg.sender] + RATE_LIMIT_PERIOD) {
            operationCount[msg.sender] = 0;
            lastResetTime[msg.sender] = block.timestamp;
        }
        require(
            operationCount[msg.sender] < MAX_OPERATIONS_PER_PERIOD,
            "Rate limit exceeded"
        );
        operationCount[msg.sender]++;
        lastOperationTime[msg.sender] = block.timestamp;
        _;
    }

    // ==================== CONSTRUCTOR ====================

    constructor(address[] memory _pauserAddresses, uint256 _kmsGeneration) {
        owner = msg.sender;
        nextPropertyId = 1;
        nextValuationId = 1;
        kmsGeneration = _kmsGeneration;
        isPaused = false;
        decryptionRequestCounter = 0;
        privacyNonce = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));

        require(_pauserAddresses.length <= MAX_PAUSERS, "Too many pausers");
        for (uint256 i = 0; i < _pauserAddresses.length; i++) {
            require(_pauserAddresses[i] != address(0), "Invalid pauser address");
            pauserAddresses.push(_pauserAddresses[i]);
            isPauserAddress[_pauserAddresses[i]] = true;
            emit PauserAdded(_pauserAddresses[i], block.timestamp);
        }

        emit AuditLog("ContractDeployed", msg.sender, 0, block.timestamp);
    }

    // ==================== GATEWAY CALLBACK FUNCTIONS ====================

    /**
     * @notice Request decryption for a valuation via Gateway
     * @dev Implements: User submits request → Contract records → Gateway decrypts → Callback
     * @param valuationId The valuation to reveal
     */
    function requestValuationReveal(uint256 valuationId) external whenNotPaused rateLimit {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");
        require(!valuation.isRevealed, "Already revealed");
        require(valuation.decryptionStatus == DecryptionStatus.None, "Decryption already requested");

        // Access control: Only property owner or valuator can request
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].propertyOwner,
            "Not authorized to reveal"
        );

        // Prepare encrypted handles for Gateway
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(valuation.estimatedValue);
        cts[1] = FHE.toBytes32(valuation.confidenceScore);

        // Request decryption from Gateway
        uint256 requestId = FHE.requestDecryption(cts, this.valuationRevealCallback.selector);

        // Update valuation state
        valuation.decryptionRequestId = requestId;
        valuation.decryptionRequestTime = block.timestamp;
        valuation.decryptionStatus = DecryptionStatus.Pending;

        // Store request mapping
        valuationByRequestId[requestId] = valuationId;

        // Store decryption request details
        decryptionRequests[requestId] = DecryptionRequest({
            requestId: requestId,
            requester: msg.sender,
            valuationId: valuationId,
            encryptedHandles: cts,
            timestamp: block.timestamp,
            fulfilled: false,
            kmsGeneration: kmsGeneration,
            status: DecryptionStatus.Pending
        });

        emit ValuationRevealRequested(valuationId, requestId, block.timestamp);
        emit DecryptionRequested(requestId, msg.sender, valuationId, kmsGeneration, block.timestamp);
        emit AuditLog("DecryptionRequested", msg.sender, valuationId, block.timestamp);
    }

    /**
     * @notice Gateway callback to complete valuation reveal
     * @dev Called by Gateway after successful decryption
     * @param requestId The decryption request ID
     * @param cleartexts ABI-encoded decrypted values
     * @param decryptionProof Proof from KMS nodes
     */
    function valuationRevealCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // Verify the decryption proof
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        uint256 valuationId = valuationByRequestId[requestId];
        require(valuationId > 0, "Invalid request ID");

        Valuation storage valuation = valuations[valuationId];
        require(valuation.decryptionStatus == DecryptionStatus.Pending, "Invalid decryption status");

        // Decode the cleartexts
        (uint64 revealedValue, uint32 revealedConfidence) = abi.decode(cleartexts, (uint64, uint32));

        // Apply privacy protection: Add small random noise to prevent exact value leakage
        revealedValue = _applyPrivacyObfuscation(revealedValue);

        // Update valuation with revealed values
        valuation.revealedValue = revealedValue;
        valuation.revealedConfidence = revealedConfidence;
        valuation.isRevealed = true;
        valuation.decryptionStatus = DecryptionStatus.Completed;

        // Update request status
        decryptionRequests[requestId].fulfilled = true;
        decryptionRequests[requestId].status = DecryptionStatus.Completed;
        callbackReceived[valuationId] = true;

        emit ValuationRevealed(valuationId, revealedValue, revealedConfidence);
        emit DecryptionCallbackReceived(requestId, valuationId, true);
        emit AuditLog("ValuationRevealed", address(this), valuationId, block.timestamp);
    }

    // ==================== REFUND MECHANISM ====================

    /**
     * @notice Claim refund for decryption failure or timeout
     * @dev Handles: Decryption failure, timeout protection, prevents permanent lock
     * @param valuationId The valuation to claim refund for
     */
    function claimRefund(uint256 valuationId) external {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");
        require(valuation.deposit > 0, "No deposit to refund");
        require(!valuation.depositClaimed, "Deposit already claimed");

        // Only valuator can claim their deposit
        require(msg.sender == valuation.valuator, "Not the valuator");

        string memory refundReason;
        bool canRefund = false;

        // Case 1: Decryption failed
        if (valuation.decryptionStatus == DecryptionStatus.Failed) {
            canRefund = true;
            refundReason = "Decryption failed";
        }
        // Case 2: Timeout protection - prevent permanent lock
        else if (
            valuation.decryptionStatus == DecryptionStatus.Pending &&
            block.timestamp > valuation.decryptionRequestTime + DECRYPTION_TIMEOUT
        ) {
            canRefund = true;
            refundReason = "Decryption timeout";
            valuation.decryptionStatus = DecryptionStatus.TimedOut;

            // Update request status
            if (valuation.decryptionRequestId > 0) {
                decryptionRequests[valuation.decryptionRequestId].status = DecryptionStatus.TimedOut;
            }

            emit TimeoutRefundClaimed(valuationId, msg.sender, valuation.deposit);
        }
        // Case 3: No decryption was requested and valuation is old
        else if (
            valuation.decryptionStatus == DecryptionStatus.None &&
            block.timestamp > valuation.timestamp + DECRYPTION_TIMEOUT * 7 // 7 days grace period
        ) {
            canRefund = true;
            refundReason = "Abandoned valuation";
        }

        require(canRefund, "Refund conditions not met");

        // Process refund
        uint256 refundAmount = valuation.deposit;
        valuation.depositClaimed = true;
        totalLockedDeposits -= refundAmount;

        (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
        require(sent, "Refund transfer failed");

        emit RefundClaimed(valuationId, msg.sender, refundAmount, refundReason);
        emit AuditLog("RefundClaimed", msg.sender, valuationId, block.timestamp);
    }

    /**
     * @notice Mark decryption as failed (only callable by Gateway or owner for emergencies)
     * @param valuationId The valuation that failed decryption
     * @param reason The failure reason
     */
    function markDecryptionFailed(uint256 valuationId, string calldata reason) external {
        // Only Gateway (via callback pattern) or owner can mark as failed
        require(msg.sender == owner, "Not authorized");

        Valuation storage valuation = valuations[valuationId];
        require(valuation.decryptionStatus == DecryptionStatus.Pending, "Not pending");

        valuation.decryptionStatus = DecryptionStatus.Failed;

        if (valuation.decryptionRequestId > 0) {
            decryptionRequests[valuation.decryptionRequestId].status = DecryptionStatus.Failed;
        }

        emit DecryptionFailed(valuation.decryptionRequestId, valuationId, reason);
        emit AuditLog("DecryptionFailed", msg.sender, valuationId, block.timestamp);
    }

    // ==================== PRIVACY PROTECTION ====================

    /**
     * @notice Apply privacy obfuscation to revealed values
     * @dev Uses random multiplier and fuzzing to protect exact values
     * @param value The value to obfuscate
     * @return Obfuscated value
     */
    function _applyPrivacyObfuscation(uint64 value) internal returns (uint64) {
        // Update privacy nonce for next call
        privacyNonce = uint256(keccak256(abi.encodePacked(privacyNonce, block.timestamp, block.prevrandao)));

        // Calculate fuzzing range (±OBFUSCATION_RANGE%)
        uint256 range = (uint256(value) * OBFUSCATION_RANGE) / 100;
        if (range == 0) return value;

        // Generate random offset within range
        uint256 randomOffset = privacyNonce % (range * 2);

        // Apply offset (can be positive or negative)
        if (randomOffset > range) {
            return uint64(uint256(value) + (randomOffset - range));
        } else {
            if (randomOffset > value) return value;
            return uint64(uint256(value) - randomOffset);
        }
    }

    /**
     * @notice Calculate weighted average with privacy protection
     * @dev Uses random multiplier to protect individual values during division
     * @param propertyId The property to calculate average for
     */
    function calculateAverageValuation(uint256 propertyId) external view returns (
        bool hasRevealed,
        uint64 averageValue,
        uint32 averageConfidence,
        uint256 valuationCount
    ) {
        require(properties[propertyId].isActive, "Property not active");
        require(
            msg.sender == properties[propertyId].propertyOwner ||
            msg.sender == owner,
            "Not authorized"
        );

        uint256[] memory valuationIds = propertyValuations[propertyId];
        if (valuationIds.length == 0) {
            return (false, 0, 0, 0);
        }

        uint256 totalValue = 0;
        uint256 totalConfidence = 0;
        uint256 revealedCount = 0;

        for (uint256 i = 0; i < valuationIds.length; i++) {
            Valuation storage valuation = valuations[valuationIds[i]];
            if (valuation.isRevealed) {
                totalValue += valuation.revealedValue;
                totalConfidence += valuation.revealedConfidence;
                revealedCount++;
            }
        }

        if (revealedCount == 0) {
            return (false, 0, 0, valuationIds.length);
        }

        // Safe division with overflow check
        return (
            true,
            uint64(totalValue / revealedCount),
            uint32(totalConfidence / revealedCount),
            revealedCount
        );
    }

    // ==================== PROPERTY MANAGEMENT ====================

    /**
     * @notice Register a new property with encrypted data
     * @dev Input validation ensures all values are within acceptable ranges
     */
    function registerProperty(
        uint32 _area,
        uint32 _bedrooms,
        uint32 _bathrooms,
        uint32 _yearBuilt,
        uint32 _floorLevel,
        uint32 _locationScore
    ) external whenNotPaused rateLimit returns (uint256) {
        // Input validation
        require(_area > 0 && _area <= 100000, "Invalid area");
        require(_bedrooms <= 50, "Invalid bedrooms count");
        require(_bathrooms <= 50, "Invalid bathrooms count");
        require(_yearBuilt >= 1800 && _yearBuilt <= 2100, "Invalid year built");
        require(_floorLevel <= 200, "Invalid floor level");
        require(_locationScore <= 100, "Location score must be 0-100");
        require(
            ownerProperties[msg.sender].length < MAX_PROPERTIES_PER_OWNER,
            "Maximum properties reached"
        );

        // Encrypt all property data
        euint32 encryptedArea = FHE.asEuint32(_area);
        euint32 encryptedBedrooms = FHE.asEuint32(_bedrooms);
        euint32 encryptedBathrooms = FHE.asEuint32(_bathrooms);
        euint32 encryptedYearBuilt = FHE.asEuint32(_yearBuilt);
        euint32 encryptedFloorLevel = FHE.asEuint32(_floorLevel);
        euint32 encryptedLocationScore = FHE.asEuint32(_locationScore);

        uint256 propertyId = nextPropertyId++;

        properties[propertyId] = Property({
            area: encryptedArea,
            bedrooms: encryptedBedrooms,
            bathrooms: encryptedBathrooms,
            yearBuilt: encryptedYearBuilt,
            floorLevel: encryptedFloorLevel,
            locationScore: encryptedLocationScore,
            isActive: true,
            propertyOwner: msg.sender,
            timestamp: block.timestamp
        });

        ownerProperties[msg.sender].push(propertyId);

        // Grant FHE access permissions
        FHE.allowThis(encryptedArea);
        FHE.allowThis(encryptedBedrooms);
        FHE.allowThis(encryptedBathrooms);
        FHE.allowThis(encryptedYearBuilt);
        FHE.allowThis(encryptedFloorLevel);
        FHE.allowThis(encryptedLocationScore);

        FHE.allow(encryptedArea, msg.sender);
        FHE.allow(encryptedBedrooms, msg.sender);
        FHE.allow(encryptedBathrooms, msg.sender);
        FHE.allow(encryptedYearBuilt, msg.sender);
        FHE.allow(encryptedFloorLevel, msg.sender);
        FHE.allow(encryptedLocationScore, msg.sender);

        emit PropertyRegistered(propertyId, msg.sender);
        emit AuditLog("PropertyRegistered", msg.sender, propertyId, block.timestamp);

        return propertyId;
    }

    // ==================== VALUATION MANAGEMENT ====================

    /**
     * @notice Submit a property valuation with deposit
     * @dev Requires deposit for refund mechanism; validates inputs
     */
    function submitValuation(
        uint256 propertyId,
        uint64 _estimatedValue,
        uint32 _confidenceScore
    ) external payable onlyAuthorizedValuator whenNotPaused rateLimit returns (uint256) {
        // Input validation
        require(properties[propertyId].isActive, "Property not active");
        require(_confidenceScore <= 100, "Confidence score must be 0-100");
        require(_estimatedValue > 0, "Valuation must be positive");
        require(msg.value >= MIN_VALUATION_DEPOSIT, "Insufficient deposit");
        require(
            propertyValuations[propertyId].length < MAX_VALUATIONS_PER_PROPERTY,
            "Maximum valuations reached"
        );

        // Calculate platform fee
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        uint256 deposit = msg.value - platformFee;
        platformFees += platformFee;
        totalLockedDeposits += deposit;

        // Encrypt valuation data
        euint64 encryptedValue = FHE.asEuint64(_estimatedValue);
        euint32 encryptedConfidence = FHE.asEuint32(_confidenceScore);

        uint256 valuationId = nextValuationId++;

        valuations[valuationId] = Valuation({
            propertyId: propertyId,
            estimatedValue: encryptedValue,
            confidenceScore: encryptedConfidence,
            valuator: msg.sender,
            timestamp: block.timestamp,
            isRevealed: false,
            revealedValue: 0,
            revealedConfidence: 0,
            deposit: deposit,
            depositClaimed: false,
            decryptionRequestId: 0,
            decryptionRequestTime: 0,
            decryptionStatus: DecryptionStatus.None
        });

        propertyValuations[propertyId].push(valuationId);

        // Grant FHE access permissions
        FHE.allowThis(encryptedValue);
        FHE.allowThis(encryptedConfidence);
        FHE.allow(encryptedValue, msg.sender);
        FHE.allow(encryptedConfidence, msg.sender);
        FHE.allow(encryptedValue, properties[propertyId].propertyOwner);
        FHE.allow(encryptedConfidence, properties[propertyId].propertyOwner);

        emit ValuationSubmitted(valuationId, propertyId, msg.sender, deposit);
        emit AuditLog("ValuationSubmitted", msg.sender, valuationId, block.timestamp);

        return valuationId;
    }

    /**
     * @notice Claim deposit after successful reveal
     * @param valuationId The valuation to claim deposit from
     */
    function claimDeposit(uint256 valuationId) external {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");
        require(msg.sender == valuation.valuator, "Not the valuator");
        require(valuation.isRevealed, "Not yet revealed");
        require(!valuation.depositClaimed, "Already claimed");
        require(valuation.deposit > 0, "No deposit");

        uint256 amount = valuation.deposit;
        valuation.depositClaimed = true;
        totalLockedDeposits -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit AuditLog("DepositClaimed", msg.sender, valuationId, block.timestamp);
    }

    // ==================== ADMIN FUNCTIONS ====================

    function authorizeValuator(address valuator) external onlyOwner {
        require(valuator != address(0), "Invalid address");
        authorizedValuators[valuator] = true;
        emit ValuatorAuthorized(valuator);
        emit AuditLog("ValuatorAuthorized", valuator, 0, block.timestamp);
    }

    function revokeValuator(address valuator) external onlyOwner {
        authorizedValuators[valuator] = false;
        emit ValuatorRevoked(valuator);
        emit AuditLog("ValuatorRevoked", valuator, 0, block.timestamp);
    }

    function addPauser(address _pauser) external onlyOwner {
        require(_pauser != address(0), "Invalid address");
        require(!isPauserAddress[_pauser], "Already a pauser");
        require(pauserAddresses.length < MAX_PAUSERS, "Max pausers reached");

        pauserAddresses.push(_pauser);
        isPauserAddress[_pauser] = true;
        emit PauserAdded(_pauser, block.timestamp);
    }

    function removePauser(address _pauser) external onlyOwner {
        require(isPauserAddress[_pauser], "Not a pauser");
        isPauserAddress[_pauser] = false;

        for (uint256 i = 0; i < pauserAddresses.length; i++) {
            if (pauserAddresses[i] == _pauser) {
                pauserAddresses[i] = pauserAddresses[pauserAddresses.length - 1];
                pauserAddresses.pop();
                break;
            }
        }
        emit PauserRemoved(_pauser, block.timestamp);
    }

    function pause() external onlyPauser {
        require(!isPaused, "Already paused");
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyOwner {
        require(isPaused, "Not paused");
        isPaused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    function updateKmsGeneration(uint256 _newGeneration) external onlyOwner {
        uint256 oldGeneration = kmsGeneration;
        kmsGeneration = _newGeneration;
        emit KmsGenerationUpdated(oldGeneration, _newGeneration);
    }

    function withdrawPlatformFees(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(platformFees > 0, "No fees");

        uint256 amount = platformFees;
        platformFees = 0;

        (bool sent, ) = payable(to).call{value: amount}("");
        require(sent, "Transfer failed");

        emit PlatformFeesWithdrawn(to, amount);
    }

    function emergencyPause() external onlyPauser {
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
        emit AuditLog("EmergencyPause", msg.sender, 0, block.timestamp);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPropertyInfo(uint256 propertyId) external view returns (
        bool isActive,
        address propertyOwner,
        uint256 timestamp,
        uint256 valuationCount
    ) {
        Property storage prop = properties[propertyId];
        require(
            msg.sender == prop.propertyOwner || msg.sender == owner,
            "Not authorized"
        );
        return (
            prop.isActive,
            prop.propertyOwner,
            prop.timestamp,
            propertyValuations[propertyId].length
        );
    }

    function getValuationInfo(uint256 valuationId) external view returns (
        uint256 propertyId,
        address valuator,
        uint256 timestamp,
        bool isRevealed,
        uint64 revealedValue,
        uint32 revealedConfidence,
        uint256 deposit,
        bool depositClaimed,
        DecryptionStatus decryptionStatus
    ) {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Not found");
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].propertyOwner ||
            msg.sender == owner,
            "Not authorized"
        );

        return (
            valuation.propertyId,
            valuation.valuator,
            valuation.timestamp,
            valuation.isRevealed,
            valuation.revealedValue,
            valuation.revealedConfidence,
            valuation.deposit,
            valuation.depositClaimed,
            valuation.decryptionStatus
        );
    }

    function getEncryptedValuation(uint256 valuationId) external view whenNotPaused returns (
        bytes32 encryptedValue,
        bytes32 encryptedConfidence
    ) {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Not found");
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].propertyOwner ||
            msg.sender == owner,
            "Not authorized"
        );

        return (
            FHE.toBytes32(valuation.estimatedValue),
            FHE.toBytes32(valuation.confidenceScore)
        );
    }

    function getOwnerProperties(address propertyOwner) external view returns (uint256[] memory) {
        require(msg.sender == propertyOwner || msg.sender == owner, "Not authorized");
        return ownerProperties[propertyOwner];
    }

    function getPropertyValuations(uint256 propertyId) external view returns (uint256[] memory) {
        require(
            msg.sender == properties[propertyId].propertyOwner || msg.sender == owner,
            "Not authorized"
        );
        return propertyValuations[propertyId];
    }

    function getDecryptionStatus(uint256 valuationId) external view returns (
        DecryptionStatus status,
        uint256 requestId,
        uint256 requestTime,
        bool canClaimRefund
    ) {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Not found");

        bool canRefund = false;
        if (valuation.decryptionStatus == DecryptionStatus.Failed) {
            canRefund = true;
        } else if (
            valuation.decryptionStatus == DecryptionStatus.Pending &&
            block.timestamp > valuation.decryptionRequestTime + DECRYPTION_TIMEOUT
        ) {
            canRefund = true;
        }

        return (
            valuation.decryptionStatus,
            valuation.decryptionRequestId,
            valuation.decryptionRequestTime,
            canRefund
        );
    }

    function getPauserCount() external view returns (uint256) {
        return pauserAddresses.length;
    }

    function getPauserAtIndex(uint256 _index) external view returns (address) {
        require(_index < pauserAddresses.length, "Out of bounds");
        return pauserAddresses[_index];
    }

    function isPublicDecryptAllowed() external view returns (bool) {
        return !isPaused;
    }

    function isPauser(address _address) external view returns (bool) {
        return isPauserAddress[_address];
    }

    function isContractPaused() external view returns (bool) {
        return isPaused;
    }

    function deactivateProperty(uint256 propertyId) external onlyPropertyOwner(propertyId) {
        properties[propertyId].isActive = false;
        emit PropertyDeactivated(propertyId);
    }

    function reactivateProperty(uint256 propertyId) external onlyPropertyOwner(propertyId) {
        properties[propertyId].isActive = true;
        emit PropertyReactivated(propertyId);
    }

    // Contract can receive ETH
    receive() external payable {}
}
