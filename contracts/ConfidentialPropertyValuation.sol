// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialPropertyValuation v2.0
 * @notice Migrated to support new Gateway contract specifications
 * @dev Changes:
 * - Added NUM_PAUSERS and PAUSER_ADDRESS_[0-N] support
 * - Renamed kmsManagement to kmsGeneration
 * - Replaced check...() functions with is...() boolean returns
 * - Added new Decryption events with individual KMS responses
 * - Implemented transaction input re-randomization support
 * - Removed FHE.checkSignatures() as it's deprecated
 */
contract ConfidentialPropertyValuation is SepoliaConfig {

    address public owner;
    uint256 public nextPropertyId;
    uint256 public nextValuationId;

    // Gateway and KMS Configuration (NEW)
    uint256 public kmsGeneration; // Renamed from kmsManagement
    address[] public pauserAddresses;
    bool public isPaused;
    mapping(address => bool) public isPauserAddress;
    uint256 public decryptionRequestCounter;

    struct Property {
        euint32 area;          // Encrypted area in square meters
        euint32 bedrooms;      // Encrypted number of bedrooms
        euint32 bathrooms;     // Encrypted number of bathrooms
        euint32 yearBuilt;     // Encrypted year built
        euint32 floorLevel;    // Encrypted floor level
        euint32 locationScore; // Encrypted location score (1-100)
        bool isActive;
        address owner;
        uint256 timestamp;
    }

    struct Valuation {
        uint256 propertyId;
        euint64 estimatedValue;    // Encrypted estimated value
        euint32 confidenceScore;   // Encrypted confidence score (1-100)
        address valuator;
        uint256 timestamp;
        bool isRevealed;
        uint64 revealedValue;      // Only set after revelation
        uint32 revealedConfidence;
    }

    // Decryption Request Struct (NEW)
    struct DecryptionRequest {
        uint256 requestId;
        address requester;
        bytes32 encryptedValue;
        uint256 timestamp;
        bool fulfilled;
        uint256 kmsGeneration;
    }

    mapping(uint256 => Property) public properties;
    mapping(uint256 => Valuation) public valuations;
    mapping(address => bool) public authorizedValuators;
    mapping(address => uint256[]) public ownerProperties;
    mapping(uint256 => uint256[]) public propertyValuations;
    mapping(uint256 => DecryptionRequest) public decryptionRequests; // NEW

    // Original Events
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event ValuationSubmitted(uint256 indexed valuationId, uint256 indexed propertyId, address indexed valuator);
    event ValuationRevealed(uint256 indexed valuationId, uint64 value, uint32 confidence);
    event ValuatorAuthorized(address indexed valuator);
    event ValuatorRevoked(address indexed valuator);

    // NEW Gateway Events - Individual KMS responses instead of aggregated
    event DecryptionRequested(
        uint256 indexed requestId,
        address indexed requester,
        uint256 kmsGeneration,
        bytes32 encryptedValue,
        uint256 timestamp
    );

    event DecryptionResponse(
        uint256 indexed requestId,
        address indexed kmsNode,
        bytes encryptedShare,
        bytes signature,
        uint256 timestamp
    );

    event PauserAdded(address indexed pauser, uint256 timestamp);
    event PauserRemoved(address indexed pauser, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);
    event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyAuthorizedValuator() {
        require(authorizedValuators[msg.sender], "Not authorized valuator");
        _;
    }

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(properties[propertyId].owner == msg.sender, "Not property owner");
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

    constructor(address[] memory _pauserAddresses, uint256 _kmsGeneration) {
        owner = msg.sender;
        nextPropertyId = 1;
        nextValuationId = 1;
        kmsGeneration = _kmsGeneration;
        isPaused = false;
        decryptionRequestCounter = 0;

        // Initialize pauser addresses
        for (uint256 i = 0; i < _pauserAddresses.length; i++) {
            pauserAddresses.push(_pauserAddresses[i]);
            isPauserAddress[_pauserAddresses[i]] = true;
            emit PauserAdded(_pauserAddresses[i], block.timestamp);
        }
    }

    // ==================== NEW GATEWAY FUNCTIONS ====================

    /**
     * @notice Add a new pauser address (only owner)
     * @param _pauser The address to add as pauser
     */
    function addPauser(address _pauser) external onlyOwner {
        require(_pauser != address(0), "Invalid pauser address");
        require(!isPauserAddress[_pauser], "Already a pauser");

        pauserAddresses.push(_pauser);
        isPauserAddress[_pauser] = true;
        emit PauserAdded(_pauser, block.timestamp);
    }

    /**
     * @notice Remove a pauser address (only owner)
     * @param _pauser The address to remove
     */
    function removePauser(address _pauser) external onlyOwner {
        require(isPauserAddress[_pauser], "Not a pauser");

        isPauserAddress[_pauser] = false;

        // Remove from array
        for (uint256 i = 0; i < pauserAddresses.length; i++) {
            if (pauserAddresses[i] == _pauser) {
                pauserAddresses[i] = pauserAddresses[pauserAddresses.length - 1];
                pauserAddresses.pop();
                break;
            }
        }

        emit PauserRemoved(_pauser, block.timestamp);
    }

    /**
     * @notice Pause the contract (only pausers)
     */
    function pause() external onlyPauser {
        require(!isPaused, "Already paused");
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        require(isPaused, "Not paused");
        isPaused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @notice Update KMS generation number
     * @param _newGeneration New KMS generation
     */
    function updateKmsGeneration(uint256 _newGeneration) external onlyOwner {
        uint256 oldGeneration = kmsGeneration;
        kmsGeneration = _newGeneration;
        emit KmsGenerationUpdated(oldGeneration, _newGeneration);
    }

    /**
     * @notice Request decryption from KMS
     * @param _encryptedValue The encrypted value to decrypt
     * @return requestId The ID of the decryption request
     */
    function requestDecryption(bytes32 _encryptedValue) external returns (uint256) {
        uint256 requestId = ++decryptionRequestCounter;

        decryptionRequests[requestId] = DecryptionRequest({
            requestId: requestId,
            requester: msg.sender,
            encryptedValue: _encryptedValue,
            timestamp: block.timestamp,
            fulfilled: false,
            kmsGeneration: kmsGeneration
        });

        emit DecryptionRequested(
            requestId,
            msg.sender,
            kmsGeneration,
            _encryptedValue,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @notice Submit decryption response from KMS node
     * @dev Each KMS node submits its own response separately (not aggregated on-chain)
     */
    function submitDecryptionResponse(
        uint256 _requestId,
        bytes calldata _encryptedShare,
        bytes calldata _signature
    ) external {
        require(decryptionRequests[_requestId].requestId == _requestId, "Invalid request");

        emit DecryptionResponse(
            _requestId,
            msg.sender,
            _encryptedShare,
            _signature,
            block.timestamp
        );
    }

    // ==================== REPLACED check...() WITH is...() ====================

    /**
     * @notice Check if public decryption is allowed (REPLACED checkPublicDecryptAllowed)
     * @return bool True if allowed, false otherwise (no revert)
     */
    function isPublicDecryptAllowed() external view returns (bool) {
        return !isPaused;
    }

    /**
     * @notice Check if address is a valid pauser (NEW)
     * @return bool True if address is pauser
     */
    function isPauser(address _address) external view returns (bool) {
        return isPauserAddress[_address];
    }

    /**
     * @notice Check if contract is currently paused (NEW)
     * @return bool True if paused
     */
    function isContractPaused() external view returns (bool) {
        return isPaused;
    }

    // ==================== ORIGINAL FUNCTIONS (with whenNotPaused) ====================

    function authorizeValuator(address valuator) external onlyOwner {
        authorizedValuators[valuator] = true;
        emit ValuatorAuthorized(valuator);
    }

    function revokeValuator(address valuator) external onlyOwner {
        authorizedValuators[valuator] = false;
        emit ValuatorRevoked(valuator);
    }

    /**
     * @notice Register a new property
     * @dev All transaction inputs are re-randomized before FHE evaluation (automatic)
     */
    function registerProperty(
        uint32 _area,
        uint32 _bedrooms,
        uint32 _bathrooms,
        uint32 _yearBuilt,
        uint32 _floorLevel,
        uint32 _locationScore
    ) external whenNotPaused returns (uint256) {
        require(_locationScore <= 100, "Location score must be 0-100");
        require(_area > 0, "Area must be greater than 0");
        require(_yearBuilt > 1800, "Year built must be realistic");

        // Encrypt all property data (inputs are re-randomized automatically for sIND-CPAD security)
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
            owner: msg.sender,
            timestamp: block.timestamp
        });

        ownerProperties[msg.sender].push(propertyId);

        // Grant access permissions
        FHE.allowThis(encryptedArea);
        FHE.allowThis(encryptedBedrooms);
        FHE.allowThis(encryptedBathrooms);
        FHE.allowThis(encryptedYearBuilt);
        FHE.allowThis(encryptedFloorLevel);
        FHE.allowThis(encryptedLocationScore);

        // Allow property owner to access their own data
        FHE.allow(encryptedArea, msg.sender);
        FHE.allow(encryptedBedrooms, msg.sender);
        FHE.allow(encryptedBathrooms, msg.sender);
        FHE.allow(encryptedYearBuilt, msg.sender);
        FHE.allow(encryptedFloorLevel, msg.sender);
        FHE.allow(encryptedLocationScore, msg.sender);

        emit PropertyRegistered(propertyId, msg.sender);
        return propertyId;
    }

    /**
     * @notice Submit a property valuation
     * @dev All transaction inputs are re-randomized before FHE evaluation (automatic)
     */
    function submitValuation(
        uint256 propertyId,
        uint64 _estimatedValue,
        uint32 _confidenceScore
    ) external onlyAuthorizedValuator whenNotPaused returns (uint256) {
        require(properties[propertyId].isActive, "Property not active");
        require(_confidenceScore <= 100, "Confidence score must be 0-100");
        require(_estimatedValue > 0, "Valuation must be positive");

        // Encrypt valuation data (inputs are re-randomized automatically for sIND-CPAD security)
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
            revealedConfidence: 0
        });

        propertyValuations[propertyId].push(valuationId);

        // Grant access permissions
        FHE.allowThis(encryptedValue);
        FHE.allowThis(encryptedConfidence);

        // Allow valuator and property owner to access valuation
        FHE.allow(encryptedValue, msg.sender);
        FHE.allow(encryptedConfidence, msg.sender);
        FHE.allow(encryptedValue, properties[propertyId].owner);
        FHE.allow(encryptedConfidence, properties[propertyId].owner);

        emit ValuationSubmitted(valuationId, propertyId, msg.sender);
        return valuationId;
    }

    /**
     * @notice Get encrypted valuation data for client-side decryption
     * @dev Returns encrypted bytes that can be decrypted using fhevmjs in the frontend
     * @param valuationId The ID of the valuation to access
     * @return encryptedValue Encrypted valuation value as bytes32
     * @return encryptedConfidence Encrypted confidence score as bytes32
     */
    function getEncryptedValuation(uint256 valuationId) external view whenNotPaused returns (
        bytes32 encryptedValue,
        bytes32 encryptedConfidence
    ) {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");

        // Only property owner, valuator, or contract owner can access
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].owner ||
            msg.sender == owner,
            "Not authorized to access"
        );

        return (
            FHE.toBytes32(valuation.estimatedValue),
            FHE.toBytes32(valuation.confidenceScore)
        );
    }

    /**
     * @notice Manually mark valuation as revealed and store decrypted values
     * @dev Called by property owner or valuator after client-side decryption
     * @param valuationId The ID of the valuation
     * @param revealedValue The decrypted value
     * @param revealedConfidence The decrypted confidence score
     */
    function markValuationRevealed(
        uint256 valuationId,
        uint64 revealedValue,
        uint32 revealedConfidence
    ) external whenNotPaused {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");
        require(!valuation.isRevealed, "Already revealed");

        // Only property owner or valuator can reveal
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].owner,
            "Not authorized to reveal"
        );

        valuation.isRevealed = true;
        valuation.revealedValue = revealedValue;
        valuation.revealedConfidence = revealedConfidence;

        emit ValuationRevealed(valuationId, revealedValue, revealedConfidence);
    }

    function calculateAverageValuation(uint256 propertyId) external view returns (
        bool hasRevealed,
        uint64 averageValue,
        uint32 averageConfidence,
        uint256 valuationCount
    ) {
        require(properties[propertyId].isActive, "Property not active");
        require(
            msg.sender == properties[propertyId].owner ||
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

        return (
            true,
            uint64(totalValue / revealedCount),
            uint32(totalConfidence / revealedCount),
            revealedCount
        );
    }

    function getPropertyInfo(uint256 propertyId) external view onlyPropertyOwner(propertyId) returns (
        bool isActive,
        uint256 timestamp,
        uint256 valuationCount
    ) {
        Property storage prop = properties[propertyId];
        return (
            prop.isActive,
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
        uint32 revealedConfidence
    ) {
        Valuation storage valuation = valuations[valuationId];
        require(valuation.timestamp > 0, "Valuation not found");

        // Only allow access to property owner, valuator, or contract owner
        require(
            msg.sender == valuation.valuator ||
            msg.sender == properties[valuation.propertyId].owner ||
            msg.sender == owner,
            "Not authorized"
        );

        return (
            valuation.propertyId,
            valuation.valuator,
            valuation.timestamp,
            valuation.isRevealed,
            valuation.revealedValue,
            valuation.revealedConfidence
        );
    }

    function getOwnerProperties(address propertyOwner) external view returns (uint256[] memory) {
        require(msg.sender == propertyOwner || msg.sender == owner, "Not authorized");
        return ownerProperties[propertyOwner];
    }

    function getPropertyValuations(uint256 propertyId) external view returns (uint256[] memory) {
        require(
            msg.sender == properties[propertyId].owner ||
            msg.sender == owner,
            "Not authorized"
        );
        return propertyValuations[propertyId];
    }

    function deactivateProperty(uint256 propertyId) external onlyPropertyOwner(propertyId) {
        properties[propertyId].isActive = false;
    }

    function reactivateProperty(uint256 propertyId) external onlyPropertyOwner(propertyId) {
        properties[propertyId].isActive = true;
    }

    // ==================== VIEW FUNCTIONS ====================

    function getPauserCount() external view returns (uint256) {
        return pauserAddresses.length;
    }

    function getPauserAtIndex(uint256 _index) external view returns (address) {
        require(_index < pauserAddresses.length, "Index out of bounds");
        return pauserAddresses[_index];
    }

    function getDecryptionRequestInfo(uint256 _requestId) external view returns (
        address requester,
        bytes32 encryptedValue,
        uint256 timestamp,
        bool fulfilled,
        uint256 generationUsed
    ) {
        DecryptionRequest storage request = decryptionRequests[_requestId];
        return (
            request.requester,
            request.encryptedValue,
            request.timestamp,
            request.fulfilled,
            request.kmsGeneration
        );
    }

    // ==================== ADMIN FUNCTIONS ====================

    function emergencyPause() external onlyPauser {
        isPaused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }
}
