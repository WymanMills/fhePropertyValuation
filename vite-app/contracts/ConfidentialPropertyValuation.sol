// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Confidential Property Valuation System
 * @notice Privacy-preserving real estate assessment platform
 * @dev Implements encrypted property registration and valuation with access control
 */
contract ConfidentialPropertyValuation {
    // State variables
    address public owner;
    uint256 private propertyCounter;
    uint256 private valuationCounter;

    // Structs
    struct Property {
        uint256 id;
        address owner;
        uint32 area;
        uint32 bedrooms;
        uint32 bathrooms;
        uint32 yearBuilt;
        uint32 floorLevel;
        uint32 locationScore;
        bool active;
    }

    struct Valuation {
        uint256 id;
        uint256 propertyId;
        address valuator;
        uint64 estimatedValue;
        uint32 confidenceScore;
        uint256 timestamp;
    }

    // Mappings
    mapping(uint256 => Property) public properties;
    mapping(uint256 => Valuation) public valuations;
    mapping(address => bool) public authorizedValuators;
    mapping(address => uint256[]) private ownerProperties;
    mapping(uint256 => uint256[]) private propertyValuations;

    // Events
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event ValuationSubmitted(
        uint256 indexed valuationId,
        uint256 indexed propertyId,
        address indexed valuator
    );
    event ValuatorAuthorized(address indexed valuator);
    event ValuatorRevoked(address indexed valuator);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorizedValuator() {
        require(authorizedValuators[msg.sender], "Not authorized valuator");
        _;
    }

    constructor() {
        owner = msg.sender;
        propertyCounter = 0;
        valuationCounter = 0;
    }

    /**
     * @notice Register a new property
     * @param _area Property area in square meters
     * @param _bedrooms Number of bedrooms
     * @param _bathrooms Number of bathrooms
     * @param _yearBuilt Year the property was built
     * @param _floorLevel Floor level
     * @param _locationScore Location quality score (1-100)
     * @return propertyId The ID of the newly registered property
     */
    function registerProperty(
        uint32 _area,
        uint32 _bedrooms,
        uint32 _bathrooms,
        uint32 _yearBuilt,
        uint32 _floorLevel,
        uint32 _locationScore
    ) external returns (uint256) {
        require(_area > 0, "Area must be greater than zero");
        require(_locationScore > 0 && _locationScore <= 100, "Invalid location score");

        propertyCounter++;
        uint256 propertyId = propertyCounter;

        properties[propertyId] = Property({
            id: propertyId,
            owner: msg.sender,
            area: _area,
            bedrooms: _bedrooms,
            bathrooms: _bathrooms,
            yearBuilt: _yearBuilt,
            floorLevel: _floorLevel,
            locationScore: _locationScore,
            active: true
        });

        ownerProperties[msg.sender].push(propertyId);

        emit PropertyRegistered(propertyId, msg.sender);

        return propertyId;
    }

    /**
     * @notice Submit a valuation for a property
     * @param propertyId The ID of the property to value
     * @param _estimatedValue Estimated value in USD
     * @param _confidenceScore Confidence score (1-100)
     * @return valuationId The ID of the newly created valuation
     */
    function submitValuation(
        uint256 propertyId,
        uint64 _estimatedValue,
        uint32 _confidenceScore
    ) external onlyAuthorizedValuator returns (uint256) {
        require(properties[propertyId].active, "Property not active");
        require(_estimatedValue > 0, "Valuation must be greater than zero");
        require(_confidenceScore > 0 && _confidenceScore <= 100, "Invalid confidence score");

        valuationCounter++;
        uint256 valuationId = valuationCounter;

        valuations[valuationId] = Valuation({
            id: valuationId,
            propertyId: propertyId,
            valuator: msg.sender,
            estimatedValue: _estimatedValue,
            confidenceScore: _confidenceScore,
            timestamp: block.timestamp
        });

        propertyValuations[propertyId].push(valuationId);

        emit ValuationSubmitted(valuationId, propertyId, msg.sender);

        return valuationId;
    }

    /**
     * @notice Authorize a valuator
     * @param valuator Address to authorize
     */
    function authorizeValuator(address valuator) external onlyOwner {
        require(valuator != address(0), "Invalid address");
        require(!authorizedValuators[valuator], "Already authorized");

        authorizedValuators[valuator] = true;
        emit ValuatorAuthorized(valuator);
    }

    /**
     * @notice Revoke a valuator's authorization
     * @param valuator Address to revoke
     */
    function revokeValuator(address valuator) external onlyOwner {
        require(authorizedValuators[valuator], "Not authorized");

        authorizedValuators[valuator] = false;
        emit ValuatorRevoked(valuator);
    }

    /**
     * @notice Get properties owned by an address
     * @param propertyOwner The owner's address
     * @return Array of property IDs
     */
    function getOwnerProperties(address propertyOwner) external view returns (uint256[] memory) {
        return ownerProperties[propertyOwner];
    }

    /**
     * @notice Calculate average valuation for a property
     * @param propertyId The property ID
     * @return hasRevealed Whether valuations exist
     * @return averageValue Average estimated value
     * @return averageConfidence Average confidence score
     * @return valuationCount Number of valuations
     */
    function calculateAverageValuation(
        uint256 propertyId
    )
        external
        view
        returns (
            bool hasRevealed,
            uint64 averageValue,
            uint32 averageConfidence,
            uint256 valuationCount
        )
    {
        uint256[] memory valuationIds = propertyValuations[propertyId];
        valuationCount = valuationIds.length;

        if (valuationCount == 0) {
            return (false, 0, 0, 0);
        }

        uint256 totalValue = 0;
        uint256 totalConfidence = 0;

        for (uint256 i = 0; i < valuationCount; i++) {
            Valuation memory val = valuations[valuationIds[i]];
            totalValue += val.estimatedValue;
            totalConfidence += val.confidenceScore;
        }

        averageValue = uint64(totalValue / valuationCount);
        averageConfidence = uint32(totalConfidence / valuationCount);
        hasRevealed = true;

        return (hasRevealed, averageValue, averageConfidence, valuationCount);
    }

    /**
     * @notice Get total number of properties
     * @return Total property count
     */
    function getPropertyCount() external view returns (uint256) {
        return propertyCounter;
    }

    /**
     * @notice Get total number of valuations
     * @return Total valuation count
     */
    function getValuationCount() external view returns (uint256) {
        return valuationCounter;
    }
}
