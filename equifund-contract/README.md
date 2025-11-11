# EquiFund - Quadratic Funding Smart Contracts (USDC)

EquiFund is a decentralized quadratic funding platform that democratizes public goods funding by amplifying the impact of small donors and promoting community-driven allocation of resources.

## 📋 Overview

This repository contains the smart contract implementation for EquiFund's MVP, built with Solidity 0.8.20 and tested using Foundry. **All funding uses USDC tokens (6 decimals).**

### Key Features

- **USDC-Based Funding**: All contributions and matching pools use USDC stablecoin
- **Quadratic Funding**: Implements QF formula to match contributions based on community support
- **Project Registry**: Whitelist system for eligible projects
- **Sybil Resistance**: Time-based cooldown mechanism to prevent spam
- **Secure Matching Pool**: Admin-managed matching funds distribution
- **Complete Getter Functions**: Comprehensive read functions for frontend integration

## 🏗️ Architecture

### Core Contracts

#### 1. EquiFundPool.sol

Main contract managing funding rounds and matching pool distribution using USDC.

**Key Functions:**

- `createRound(uint256 duration)` - Admin creates new funding round
- `contribute(address project, uint256 amount)` - Donors contribute USDC to projects
- `finalizeRound()` - Calculate and distribute matching funds
- `addMatchingFunds(uint256 amount)` - Add USDC to matching pool
- `withdrawMatching(uint256 roundId)` - Projects claim matched USDC

**Getter Functions:**

- `getRoundDetails(uint256 roundId)` - Get round information
- `getProjectContributions(uint256 roundId, address project)` - Project's total contributions
- `getDonorContribution(uint256 roundId, address donor, address project)` - Specific donation amount
- `getProjectMatchAmount(uint256 roundId, address project)` - Matching amount for project
- `getCurrentRound()` - Current active round ID
- `isRoundActive()` - Check if round is active
- `getTimeRemaining()` - Time left in current round
- `getRoundProjects(uint256 roundId)` - All projects in a round

#### 2. ProjectRegistry.sol

Manages whitelist of eligible projects.

**Key Functions:**

- `registerProject(address, string, string, string)` - Add new project
- `updateProject(address, string, string, string)` - Update project info
- `toggleProjectStatus(address)` - Activate/deactivate project
- `removeProject(address)` - Remove project

**Getter Functions:**

- `getProject(address)` - Full project details
- `isProjectActive(address)` - Check active status
- `getAllProjects()` - All registered projects
- `getActiveProjects()` - Only active projects
- `getProjectCount()` - Total project count

#### 3. SybilGuard.sol

Basic Sybil resistance using cooldown periods.

**Key Functions:**

- `checkEligibility(address)` - Can address contribute?
- `recordContribution(address)` - Log contribution
- `addVerifiedAddress(address)` - Whitelist trusted address
- `updateCooldown(uint256)` - Adjust cooldown period

**Getter Functions:**

- `canContribute(address)` - Check eligibility
- `timeUntilNextContribution(address)` - Time until next allowed contribution
- `isVerified(address)` - Check if address is whitelisted
- `getCooldownPeriod()` - Current cooldown duration

#### 4. QuadraticMath.sol

Library for quadratic funding calculations.

**Key Functions:**

- `calculateMatch(uint256, Contribution[][])` - Calculate all project matches
- `calculateProjectMatch(uint256, uint256, uint256)` - Individual project match
- `sqrt(uint256)` - Babylonian square root method
- `sumSquareRoots(uint256[])` - Sum of square roots helper
- `validateMatchingCalculation(uint256, uint256[])` - Validation helper

#### 5. MockUSDC.sol

Mock USDC token for testing and development.

**Key Functions:**

- `mint(address to, uint256 amount)` - Mint USDC (owner only)
- `faucet()` - Claim 1000 USDC for testing
- `batchMint(address[], uint256[])` - Mint to multiple addresses

## 🚀 Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd equifund-contract

# Install dependencies
forge install

# Build contracts
forge build
```

### Running Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test file
forge test --match-path test/EquiFundPool.t.sol

# Run with gas report
forge test --gas-report
```

### Test Coverage

```bash
forge coverage
```

Current test suite includes:

- **111 total tests** ✅
- QuadraticMath: 17 tests
- SybilGuard: 26 tests
- ProjectRegistry: 28 tests
- EquiFundPool: 40 tests

All tests passing ✅

## 📦 Deployment

### Local Deployment

```bash
# Start local Anvil node
anvil

# Deploy contracts (with MockUSDC)
forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast --private-key <PRIVATE_KEY>
```

### Testnet/Mainnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=<your-private-key>
export RPC_URL=<your-rpc-url>

# Deploy
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --verify
```

### Deploy with Existing USDC (Mainnet)

For production deployment on networks with existing USDC:

```solidity
// Use runWithExistingUSDC function
forge script script/Deploy.s.sol:Deploy \
  --sig "runWithExistingUSDC(address)" <USDC_ADDRESS> \
  --rpc-url $RPC_URL \
  --broadcast
```

**USDC Addresses:**

- Ethereum Mainnet: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Celo Mainnet: `0xef4229c8c3250C675F21BCefa42f58EfbfF6002a`
- Celo Alfajores: `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`

### Mock Setup (For Testing)

```bash
# Deploy with sample data
forge script script/MockSetup.s.sol:MockSetup --fork-url http://localhost:8545 --broadcast --private-key <PRIVATE_KEY>
```

This creates:

- MockUSDC token
- 4 sample projects (Climate Action, Education, Open Source, Healthcare)
- 3 mock donors (Alice, Bob, Charlie) with 100,000 USDC each
- Initial matching pool (100,000 USDC)
- Active funding round (7 days)

## 🔧 Configuration

Default settings (can be modified in deployment scripts):

```solidity
COOLDOWN_PERIOD = 1 hours         // Time between contributions
MINIMUM_CONTRIBUTION = 1 USDC     // 1 * 10**6 (USDC has 6 decimals)
ROUND_DURATION = 7 days           // Default round length
```

## 💰 USDC Integration

### For Donors

```solidity
// 1. Approve EquiFundPool to spend your USDC
usdc.approve(equiFundPoolAddress, amount);

// 2. Contribute to a project
equiFundPool.contribute(projectAddress, 1000 * 10**6); // 1000 USDC

// 3. Check contribution
uint256 amount = equiFundPool.getDonorContribution(roundId, donorAddress, projectAddress);
```

### For Project Owners

```solidity
// 1. Wait for round to end and be finalized

// 2. Check matching amount
uint256 matchAmount = equiFundPool.getProjectMatchAmount(roundId, projectAddress);

// 3. Withdraw matching funds (USDC transferred to project)
equiFundPool.withdrawMatching(roundId);
```

### For Admins

```solidity
// 1. Approve and add matching funds
usdc.approve(equiFundPoolAddress, 100_000 * 10**6);
equiFundPool.addMatchingFunds(100_000 * 10**6); // 100,000 USDC

// 2. Create funding round
equiFundPool.createRound(7 days);

// 3. After round ends, finalize
equiFundPool.finalizeRound();
```

## 📊 Quadratic Funding Formula

For each project, the matching amount is calculated as:

```
project_match = (Σ√contribution_i)²

Total distribution:
project_i_match = (project_i_sum² / Σ all_projects_sum²) × matching_pool
```

This formula favors projects with many small donors over those with few large donors, democratizing fund allocation.

## 🔐 Security Features

- **ReentrancyGuard**: Protection against reentrancy attacks
- **SafeERC20**: Safe token transfers
- **Pausable**: Emergency stop mechanism
- **Ownable**: Access control for admin functions
- **Checks-Effects-Interactions**: Secure payment patterns
- **Input Validation**: Comprehensive parameter checks

## 🚧 MVP Limitations

1. **Simplified Sybil Resistance**: Uses basic cooldown (not BrightID/Gitcoin Passport)
2. **Single Token**: USDC only (no multi-token support yet)
3. **Manual Rounds**: Admin must create rounds manually
4. **Simplified QF Calculation**: Uses total contribution square root (MVP approach)
5. **No Dispute Mechanism**: No appeals or challenge system yet

## 📄 Contract Addresses

After deployment, addresses will be saved to `deployment-addresses.json`:

```json
{
  "network": 31337,
  "deployer": "0x...",
  "usdc": "0x...",
  "projectRegistry": "0x...",
  "sybilGuard": "0x...",
  "equiFundPool": "0x..."
}
```

## 🧪 Example Usage Flow

### Complete Round Cycle

```solidity
// === Setup Phase (Admin) ===
// 1. Deploy contracts
// 2. Approve USDC spending
usdc.approve(equiFundPool, 100_000 * 10**6);
// 3. Add matching funds
equiFundPool.addMatchingFunds(100_000 * 10**6);
// 4. Create round
equiFundPool.createRound(7 days);

// === Contribution Phase (Donors) ===
// Donor 1
usdc.approve(equiFundPool, 1_000 * 10**6);
equiFundPool.contribute(projectA, 1_000 * 10**6);

// Donor 2
usdc.approve(equiFundPool, 1_000 * 10**6);
equiFundPool.contribute(projectA, 1_000 * 10**6);

// Donor 3
usdc.approve(equiFundPool, 4_000 * 10**6);
equiFundPool.contribute(projectB, 4_000 * 10**6);

// === Finalization Phase ===
// Wait for round to end...
equiFundPool.finalizeRound();

// === Withdrawal Phase (Projects) ===
// Project A withdraws matching
equiFundPool.withdrawMatching(1); // Receives ~66,666 USDC match
// Project B withdraws matching
equiFundPool.withdrawMatching(1); // Receives ~33,333 USDC match
```

## 📚 Additional Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Quadratic Funding Explained](https://wtfisqf.com/)
- [Gitcoin's QF Grants](https://www.gitcoin.co/quadraticfunding)
- [USDC Documentation](https://www.circle.com/en/usdc)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🔮 Future Improvements

- [ ] Integration with Gitcoin Passport for Sybil resistance
- [ ] Multi-token support (DAI, cUSD, etc.)
- [ ] Automated round scheduling
- [ ] Project verification system
- [ ] Dispute resolution mechanism
- [ ] Multi-round analytics
- [ ] Governance token
- [ ] Layer 2 deployment for lower gas costs
- [ ] Per-donor QF calculation (more accurate than MVP)

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for the public goods ecosystem | Powered by USDC
