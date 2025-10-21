export const CONTRACT_ADDRESS = '0xbc70aFE54495D028586f7E77c257359F1FDf6483' as const;

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint32", "name": "_area", "type": "uint32"},
      {"internalType": "uint32", "name": "_bedrooms", "type": "uint32"},
      {"internalType": "uint32", "name": "_bathrooms", "type": "uint32"},
      {"internalType": "uint32", "name": "_yearBuilt", "type": "uint32"},
      {"internalType": "uint32", "name": "_floorLevel", "type": "uint32"},
      {"internalType": "uint32", "name": "_locationScore", "type": "uint32"}
    ],
    "name": "registerProperty",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "propertyId", "type": "uint256"},
      {"internalType": "uint64", "name": "_estimatedValue", "type": "uint64"},
      {"internalType": "uint32", "name": "_confidenceScore", "type": "uint32"}
    ],
    "name": "submitValuation",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "valuator", "type": "address"}],
    "name": "authorizeValuator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "valuator", "type": "address"}],
    "name": "revokeValuator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "propertyId", "type": "uint256"}],
    "name": "calculateAverageValuation",
    "outputs": [
      {"internalType": "bool", "name": "hasRevealed", "type": "bool"},
      {"internalType": "uint64", "name": "averageValue", "type": "uint64"},
      {"internalType": "uint32", "name": "averageConfidence", "type": "uint32"},
      {"internalType": "uint256", "name": "valuationCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "propertyOwner", "type": "address"}],
    "name": "getOwnerProperties",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "PropertyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "valuationId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "propertyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "valuator", "type": "address"}
    ],
    "name": "ValuationSubmitted",
    "type": "event"
  }
] as const;

export const SEPOLIA_CHAIN_ID = 11155111;
