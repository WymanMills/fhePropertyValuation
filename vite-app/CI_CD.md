# CI/CD Pipeline Documentation

## Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions to ensure code quality, automated testing, and continuous integration for the Confidential Property Valuation System.

## Workflow Configuration

### Location
- `.github/workflows/test.yml`

### Trigger Events

The CI/CD pipeline runs automatically on:
- **Push to branches**: `main`, `develop`
- **Pull requests**: targeting `main` or `develop` branches

## Pipeline Jobs

### 1. Test Suite

**Purpose**: Run comprehensive test coverage across multiple Node.js versions

**Matrix Strategy**:
- Node.js 18.x
- Node.js 20.x

**Steps**:
1. Checkout code
2. Setup Node.js with npm caching
3. Install dependencies with `npm ci`
4. Compile Solidity contracts
5. Run Hardhat test suite
6. Generate coverage reports
7. Upload coverage to Codecov
8. Archive coverage artifacts (30-day retention)

**Coverage Integration**:
- Codecov integration with token authentication
- Coverage reports available for each Node version
- Hardhat-specific coverage flags

### 2. Code Quality Checks (Lint)

**Purpose**: Ensure code quality and adherence to coding standards

**Runs on**: Node.js 20.x (latest LTS)

**Checks**:
1. **ESLint**: TypeScript/JavaScript linting
2. **Solhint**: Solidity smart contract linting
3. **TypeScript**: Type checking with `tsc --noEmit`

**Configuration**:
- All checks use `continue-on-error: true` to not block the pipeline
- Reports are generated for review

### 3. Gas Usage Report

**Purpose**: Monitor and track smart contract gas consumption

**Runs on**: Node.js 20.x

**Process**:
1. Run Hardhat tests with gas reporting enabled
2. Generate `gas-report.txt`
3. Upload as artifact (30-day retention)

**Environment Variable**:
- `REPORT_GAS=true` enables detailed gas tracking

### 4. Build Application

**Purpose**: Verify the application builds successfully

**Runs on**: Node.js 20.x

**Dependencies**: Requires successful completion of `test` and `lint` jobs

**Steps**:
1. Install dependencies
2. Build production bundle with Vite
3. Upload `dist/` artifacts (30-day retention)

## Configuration Files

### 1. `.github/workflows/test.yml`

Main GitHub Actions workflow configuration with 4 jobs:
- Test Suite (matrix: Node 18.x, 20.x)
- Code Quality Checks
- Gas Usage Report
- Build Application

### 2. `.solhint.json`

Solidity linting configuration:

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "compiler-version": ["error", "^0.8.0"],
    "max-line-length": ["warn", 120],
    "function-max-lines": ["warn", 50],
    "code-complexity": ["warn", 8],
    "gas-custom-errors": "off",
    "private-vars-leading-underscore": "off"
  }
}
```

**Key Rules**:
- Enforces Solidity ^0.8.0
- Maximum line length: 120 characters
- Maximum function lines: 50
- Code complexity threshold: 8
- Gas optimization checks disabled for flexibility

### 3. `codecov.yml`

Code coverage reporting configuration:

```yaml
coverage:
  range: "70...100"
  status:
    project:
      target: auto
      threshold: 1%
```

**Settings**:
- Coverage range: 70-100%
- Auto-adjust targets based on previous coverage
- 1% threshold for changes
- Ignores test files, scripts, and build artifacts

## GitHub Secrets Required

### CODECOV_TOKEN

**Setup Instructions**:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your GitHub repository
3. Copy the repository token
4. Add to GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov token
   - Click "Add secret"

## Running Locally

### Run All Tests
```bash
npm run test:hardhat
```

### Run Tests with Coverage
```bash
npm run test:hardhat:coverage
```

### Run Linting
```bash
# ESLint
npm run lint

# Solhint
npm run lint:sol

# Type checking
npm run type-check
```

### Generate Gas Report
```bash
REPORT_GAS=true npm run test:hardhat
```

### Build Application
```bash
npm run build
```

## Workflow Artifacts

All workflow runs generate downloadable artifacts:

### Coverage Reports
- **Name**: `coverage-report-node-{version}`
- **Contents**: HTML coverage reports, lcov files
- **Retention**: 30 days

### Gas Reports
- **Name**: `gas-report`
- **Contents**: `gas-report.txt` with detailed gas usage
- **Retention**: 30 days

### Build Artifacts
- **Name**: `build-dist`
- **Contents**: Production build in `dist/` directory
- **Retention**: 30 days

## Viewing Results

### GitHub Actions UI

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select a workflow run
4. View job status and logs
5. Download artifacts from the summary page

### Codecov Dashboard

1. Visit [codecov.io](https://codecov.io)
2. Navigate to your repository
3. View coverage trends, file-by-file breakdown
4. Compare coverage between commits

## Status Badges

Add these badges to your README.md:

### CI/CD Status
```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI/CD%20Pipeline/badge.svg)
```

### Code Coverage
```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO)
```

## Troubleshooting

### Tests Failing

1. Run tests locally: `npm run test:hardhat`
2. Check test output for specific failures
3. Verify contract compilation: `npm run compile`
4. Check dependencies: `npm ci`

### Coverage Upload Issues

1. Verify `CODECOV_TOKEN` is set in repository secrets
2. Check Codecov dashboard for upload errors
3. Ensure `coverage/lcov.info` is generated locally

### Linting Errors

1. Run linters locally: `npm run lint` and `npm run lint:sol`
2. Fix issues with: `npm run lint:fix`
3. Check `.solhint.json` configuration

### Build Failures

1. Run build locally: `npm run build`
2. Check TypeScript errors: `npm run type-check`
3. Verify all dependencies installed: `npm ci`

## Best Practices

### 1. Branch Protection

Configure branch protection rules for `main` and `develop`:
- Require status checks to pass before merging
- Require pull request reviews
- Enable "Require branches to be up to date"

### 2. Pull Request Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create pull request
4. CI/CD runs automatically
5. Review test results and coverage
6. Address any issues
7. Merge after approval and passing checks

### 3. Coverage Maintenance

- Monitor coverage trends
- Add tests for new features
- Maintain minimum 70% coverage
- Review uncovered lines in Codecov

### 4. Gas Optimization

- Review gas reports regularly
- Optimize high-usage functions
- Compare gas usage across commits
- Set gas budgets for critical functions

## Continuous Improvement

### Planned Enhancements

- [ ] Add automated deployment to testnet
- [ ] Implement automated security scanning
- [ ] Add performance benchmarking
- [ ] Set up automated dependency updates
- [ ] Add contract verification on Etherscan
- [ ] Implement staging environment deployment
- [ ] Add Slack/Discord notifications
- [ ] Set up automated changelog generation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com)
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)

## Support

For issues related to:
- **CI/CD Pipeline**: Check GitHub Actions logs
- **Code Coverage**: Visit Codecov dashboard
- **Test Failures**: Review test output in Actions
- **Build Issues**: Check build logs and artifacts

## License

MIT License - See LICENSE file for details
