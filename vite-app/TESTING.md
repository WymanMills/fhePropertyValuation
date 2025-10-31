# Testing Documentation

## Overview

This project includes a comprehensive test suite with **49 test cases** covering all aspects of the Confidential Property Valuation System smart contract.

## Test Coverage

### Test Statistics
- **Total Test Cases**: 49
- **Test Categories**: 9
- **Coverage Goal**: >80% code coverage
- **Testing Framework**: Hardhat + Mocha + Chai

### Test Categories

1. **Deployment and Initialization** (5 tests)
   - Contract deployment verification
   - Owner initialization
   - Initial state checks

2. **Property Registration** (11 tests)
   - Successful registration
   - Event emission
   - Data validation
   - Edge cases (zero values, max values)
   - Error handling

3. **Valuator Authorization** (8 tests)
   - Authorization by owner
   - Revocation functionality
   - Access control
   - Multiple valuators
   - Error handling

4. **Valuation Submission** (8 tests)
   - Successful submission
   - Data storage
   - Authorization checks
   - Value validation
   - Multiple valuations

5. **Average Valuation Calculation** (4 tests)
   - Empty valuations
   - Single valuation
   - Multiple valuations
   - Accuracy verification

6. **View Functions** (3 tests)
   - Owner properties lookup
   - Counter functions
   - Empty state handling

7. **Edge Cases and Security** (4 tests)
   - Maximum value handling
   - Owner separation
   - Invalid property IDs
   - Data integrity

8. **Gas Optimization** (3 tests)
   - Property registration gas usage
   - Valuation submission gas usage
   - Authorization gas usage

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Run All Tests

```bash
# Run Hardhat tests
npm run test:hardhat

# Run with verbose output
npx hardhat test

# Run specific test file
npx hardhat test test/ConfidentialPropertyValuation.test.ts
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:hardhat:coverage

# View coverage report
open coverage/index.html
```

### Gas Reports

```bash
# Enable gas reporting
REPORT_GAS=true npm run test:hardhat
```

## Test Structure

### Standard Test Pattern

```typescript
describe("Feature Name", function () {
  let signers: Signers;
  let contract: ConfidentialPropertyValuation;
  let contractAddress: string;

  before(async function () {
    // Setup signers
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      charlie: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Deploy fresh contract for each test
    ({ contract, contractAddress } = await deployFixture());
  });

  it("should do something", async function () {
    // Test logic
    expect(result).to.equal(expected);
  });
});
```

## Test Cases Breakdown

### 1. Deployment and Initialization (5 tests)

| Test | Description |
|------|-------------|
| Deploy successfully | Verifies contract deployment |
| Set deployer as owner | Confirms owner is set correctly |
| Initialize with zero properties | Checks initial property count |
| Initialize with zero valuations | Checks initial valuation count |
| No authorized valuators initially | Verifies no valuators at start |

### 2. Property Registration (11 tests)

| Test | Description |
|------|-------------|
| Register property successfully | Valid property registration |
| Increment property counter | Counter increases correctly |
| Return correct property ID | Proper ID assignment |
| Store property details correctly | All fields saved accurately |
| Add property to owner's list | Owner tracking works |
| Reject zero area | Validation for area field |
| Reject invalid location score (zero) | Score must be 1-100 |
| Reject invalid location score (>100) | Score must be 1-100 |
| Allow multiple properties from same owner | No ownership limit |
| Handle minimum valid values | Edge case for minimum values |
| Handle maximum valid location score | Edge case for maximum score |

### 3. Valuator Authorization (8 tests)

| Test | Description |
|------|-------------|
| Authorize valuator by owner | Owner can authorize |
| Reject authorization from non-owner | Access control works |
| Reject zero address authorization | Address validation |
| Reject duplicate authorization | Prevent double authorization |
| Revoke valuator authorization | Revocation functionality |
| Reject revocation from non-owner | Access control for revocation |
| Reject revocation of non-authorized | Validation check |
| Allow multiple valuators | Multiple valuators supported |

### 4. Valuation Submission (8 tests)

| Test | Description |
|------|-------------|
| Submit valuation successfully | Valid valuation submission |
| Increment valuation counter | Counter increases |
| Store valuation details correctly | All fields saved |
| Reject from unauthorized valuator | Access control works |
| Reject for non-existent property | Property validation |
| Reject with zero value | Value must be > 0 |
| Reject with invalid confidence (zero) | Score must be 1-100 |
| Reject with invalid confidence (>100) | Score must be 1-100 |
| Allow multiple valuations | Multiple valuations supported |

### 5. Average Valuation Calculation (4 tests)

| Test | Description |
|------|-------------|
| Return false for no valuations | Handles empty case |
| Calculate average with single valuation | Single valuation math |
| Calculate average with multiple valuations | Multiple valuations math |
| Handle three valuations correctly | Extended averaging |

### 6. View Functions (3 tests)

| Test | Description |
|------|-------------|
| Return empty array for no properties | Empty state handling |
| Return correct property count | Counter accuracy |
| Return correct valuation count | Counter accuracy |

### 7. Edge Cases and Security (4 tests)

| Test | Description |
|------|-------------|
| Handle maximum uint32 values | Max value support |
| Handle maximum uint64 value | Max value support |
| Maintain separate property lists | Owner isolation |
| Not allow property ID 0 | Invalid ID handling |

### 8. Gas Optimization (3 tests)

| Test | Description |
|------|-------------|
| Register property efficiently | < 200k gas |
| Submit valuation efficiently | < 150k gas |
| Authorize valuator efficiently | < 100k gas |

## Test Assertions

### Common Assertions Used

```typescript
// Equality
expect(value).to.equal(expected);
expect(address).to.be.properAddress;

// Boolean
expect(value).to.be.true;
expect(value).to.be.false;

// Events
await expect(tx)
  .to.emit(contract, "EventName")
  .withArgs(arg1, arg2);

// Reverts
await expect(
  contract.function()
).to.be.revertedWith("Error message");

// Comparisons
expect(value).to.be.gt(0);  // greater than
expect(value).to.be.lt(100); // less than
expect(array.length).to.equal(5);
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm install
      - run: npm run test:hardhat
      - run: npm run test:hardhat:coverage
```

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | >80% | TBD |
| Branches | >75% | TBD |
| Functions | >80% | TBD |
| Lines | >80% | TBD |

## Best Practices

### 1. Test Isolation
- Each test uses a fresh contract instance
- No shared state between tests
- Independent test execution

### 2. Descriptive Names
- Test names clearly describe what is being tested
- Use "should" statements for clarity
- Group related tests in describe blocks

### 3. Comprehensive Coverage
- Test happy paths
- Test error conditions
- Test edge cases
- Test gas efficiency

### 4. Clear Assertions
- One logical assertion per test
- Use specific error messages
- Verify event emissions

### 5. Proper Setup
- Use before/beforeEach hooks
- Clean deployment fixtures
- Well-defined test data

## Debugging Tests

### Run Single Test

```bash
npx hardhat test --grep "should register a property successfully"
```

### Enable Stack Traces

```bash
npx hardhat test --stack-traces
```

### Show Gas Usage

```bash
REPORT_GAS=true npx hardhat test
```

## Future Enhancements

- [ ] Add integration tests with frontend
- [ ] Add performance benchmarks
- [ ] Add fuzz testing with Echidna
- [ ] Add formal verification with Certora
- [ ] Add Sepolia testnet tests
- [ ] Add stress tests with large datasets

## Test Maintenance

- Review and update tests when contract changes
- Maintain >80% code coverage
- Update documentation with new test patterns
- Regular gas optimization checks

## Resources

- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [Ethereum Testing Best Practices](https://ethereum.org/en/developers/docs/smart-contracts/testing/)
