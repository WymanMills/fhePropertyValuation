# CI/CD Setup Documentation

This project includes a comprehensive CI/CD pipeline using GitHub Actions for automated testing, code quality checks, and coverage reporting.

## Overview

The CI/CD pipeline is configured to run automatically on:
- Every push to `main` or `develop` branches
- All pull requests targeting `main` or `develop` branches
- Multiple Node.js versions (18.x, 20.x) for cross-version compatibility

## Features

### 1. Automated Testing
- Runs full test suite using Hardhat
- Tests across multiple Node.js versions (18.x, 20.x)
- Generates coverage reports

### 2. Code Quality Checks
- **Prettier**: Code formatting validation
- **Solhint**: Solidity linting with comprehensive rules
- Checks run automatically but don't block CI (warnings only)

### 3. Code Coverage
- Generates coverage reports using `hardhat coverage`
- Uploads coverage to Codecov
- Coverage reports available in PR comments

## Configuration Files

### GitHub Actions Workflow
- **Location**: `.github/workflows/test.yml`
- **Triggers**: Push to main/develop, Pull Requests
- **Node versions**: 18.x, 20.x

### Code Quality Tools

#### Solhint Configuration
- **Location**: `.solhint.json`
- **Ignore file**: `.solhintignore`
- **Features**:
  - Extends solhint:recommended
  - Code complexity checks (max 8)
  - Compiler version enforcement (>=0.8.4)
  - Function visibility rules
  - Max line length (120 chars)
  - Gas optimization warnings
  - Security best practices

#### Prettier Configuration
- **Location**: `.prettierrc`
- **Ignore file**: `.prettierignore`
- **Features**:
  - Solidity-specific formatting via `prettier-plugin-solidity`
  - 120 character line width
  - 4-space tabs for Solidity files
  - 2-space tabs for JavaScript files

#### Codecov Configuration
- **Location**: `codecov.yml`
- **Features**:
  - Coverage precision: 2 decimals
  - Target range: 70-100%
  - Auto-target with 1% threshold
  - Comment layout: reach, diff, flags, tree

## Available NPM Scripts

### Testing
```bash
npm test                 # Run all tests
npm run test:gas        # Run tests with gas reporting
npm run coverage        # Generate coverage report
```

### Code Quality
```bash
npm run lint            # Run Solhint on contracts
npm run lint:sol        # Run Solhint specifically
npm run format          # Format all files with Prettier
npm run format:check    # Check formatting without modifying
```

### Compilation
```bash
npm run compile         # Compile contracts
npm run clean           # Clean artifacts
```

## Setup Instructions

### 1. Local Development
All dependencies are already installed. To verify your setup:

```bash
# Install dependencies (if needed)
npm install --legacy-peer-deps

# Run linting
npm run lint

# Check formatting
npm run format:check

# Run tests
npm test
```

### 2. GitHub Actions Setup
The workflow is already configured. To enable Codecov:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Copy the Codecov token
4. Add it as a GitHub secret named `CODECOV_TOKEN`:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov token

### 3. Branch Protection (Recommended)
Configure branch protection rules for `main` and `develop`:
1. Go to Settings → Branches
2. Add branch protection rule
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Select the "Test" workflow

## Workflow Steps

The CI/CD pipeline executes the following steps:

1. **Checkout code** - Pulls latest code from repository
2. **Setup Node.js** - Installs specified Node.js version with npm cache
3. **Install dependencies** - Runs `npm ci --legacy-peer-deps`
4. **Check formatting** - Validates code formatting (non-blocking)
5. **Run Solhint** - Checks Solidity code quality (non-blocking)
6. **Compile contracts** - Ensures contracts compile successfully
7. **Run tests** - Executes full test suite
8. **Generate coverage** - Creates coverage report
9. **Upload to Codecov** - Sends coverage data to Codecov

## Continuous Integration Best Practices

### Pre-commit Checks
Before committing code:
```bash
npm run format          # Auto-format code
npm run lint            # Check for linting issues
npm test                # Ensure tests pass
```

### Pull Request Workflow
1. Create feature branch from `develop`
2. Make changes and commit
3. Push to GitHub
4. Open Pull Request
5. Wait for CI checks to pass
6. Address any issues found by CI
7. Request review after CI passes

## Troubleshooting

### Common Issues

#### 1. Formatting Failures
```bash
# Fix formatting issues automatically
npm run format
```

#### 2. Linting Errors
```bash
# View detailed linting output
npm run lint

# Some rules can auto-fix
npx solhint "contracts/**/*.sol" --fix
```

#### 3. Test Failures
```bash
# Run tests with verbose output
npm test

# Run specific test file
npx hardhat test test/YourTest.js
```

#### 4. Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Coverage Reports

Coverage reports are generated and uploaded to Codecov. View them:
- On Codecov dashboard
- In PR comments (automatic)
- Locally: Run `npm run coverage` and open `coverage/index.html`

## Maintenance

### Updating Dependencies
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update --legacy-peer-deps
```

### Updating CI Configuration
Edit `.github/workflows/test.yml` to:
- Add/remove Node.js versions
- Modify test commands
- Adjust timeout settings
- Configure different triggers

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Codecov Documentation](https://docs.codecov.com/)
