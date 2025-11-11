// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EquiFundPool.sol";
import "../src/ProjectRegistry.sol";
import "../src/SybilGuard.sol";
import "../src/MockUSDC.sol";

/**
 * @title MockSetup
 * @dev Script to deploy contracts and set up mock data for testing with USDC
 * @notice Creates sample projects, funding round, and test contributions
 *
 * Usage:
 * forge script script/MockSetup.s.sol:MockSetup --fork-url http://localhost:8545 --broadcast
 */
contract MockSetup is Script {
    // Configuration
    uint256 constant USDC_DECIMALS = 6;
    uint256 constant COOLDOWN_PERIOD = 1 hours;
    uint256 constant MINIMUM_CONTRIBUTION = 1 * 10 ** USDC_DECIMALS; // 1 USDC
    uint256 constant ROUND_DURATION = 7 days;
    uint256 constant MATCHING_POOL = 100_000 * 10 ** USDC_DECIMALS; // 100,000 USDC

    // Contracts
    MockUSDC public usdc;
    ProjectRegistry public projectRegistry;
    SybilGuard public sybilGuard;
    EquiFundPool public equiFundPool;

    // Mock projects
    address public project1;
    address public project2;
    address public project3;
    address public project4;

    // Mock donors
    address public donor1;
    address public donor2;
    address public donor3;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Setting up mock environment with USDC...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy contracts
        deployContracts();

        // 2. Create mock project addresses
        createMockProjects();

        // 3. Register projects
        registerProjects();

        // 4. Create mock donors and mint USDC
        createMockDonorsAndMintTokens();

        // 5. Add matching funds
        addMatchingFunds();

        // 6. Create funding round
        createRound();

        vm.stopBroadcast();

        logSummary();
    }

    function deployContracts() internal {
        console.log("\n=== Deploying Contracts ===");

        usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        projectRegistry = new ProjectRegistry();
        console.log("ProjectRegistry:", address(projectRegistry));

        sybilGuard = new SybilGuard(COOLDOWN_PERIOD);
        console.log("SybilGuard:", address(sybilGuard));

        equiFundPool = new EquiFundPool(
            address(usdc),
            address(projectRegistry),
            address(sybilGuard),
            MINIMUM_CONTRIBUTION
        );
        console.log("EquiFundPool:", address(equiFundPool));
    }

    function createMockProjects() internal {
        console.log("\n=== Creating Mock Projects ===");

        // In production, these would be real project addresses
        // For testing, we create new addresses
        project1 = makeAddr("ClimateAction");
        project2 = makeAddr("EducationForAll");
        project3 = makeAddr("OpenSourceTools");
        project4 = makeAddr("HealthcareAccess");

        console.log("Project 1 (ClimateAction):", project1);
        console.log("Project 2 (EducationForAll):", project2);
        console.log("Project 3 (OpenSourceTools):", project3);
        console.log("Project 4 (HealthcareAccess):", project4);
    }

    function registerProjects() internal {
        console.log("\n=== Registering Projects ===");

        projectRegistry.registerProject(
            project1,
            "Climate Action Fund",
            "Supporting renewable energy and reforestation projects globally",
            "ipfs://QmClimateActionMetadata"
        );
        console.log("Registered: Climate Action Fund");

        projectRegistry.registerProject(
            project2,
            "Education For All",
            "Providing free educational resources to underserved communities",
            "ipfs://QmEducationMetadata"
        );
        console.log("Registered: Education For All");

        projectRegistry.registerProject(
            project3,
            "Open Source Tools",
            "Building free and open-source software for public good",
            "ipfs://QmOpenSourceMetadata"
        );
        console.log("Registered: Open Source Tools");

        projectRegistry.registerProject(
            project4,
            "Healthcare Access",
            "Expanding healthcare access in rural and remote areas",
            "ipfs://QmHealthcareMetadata"
        );
        console.log("Registered: Healthcare Access");
    }

    function createMockDonorsAndMintTokens() internal {
        console.log("\n=== Creating Mock Donors & Minting USDC ===");

        donor1 = makeAddr("Alice");
        donor2 = makeAddr("Bob");
        donor3 = makeAddr("Charlie");

        // Mint USDC to donors
        uint256 donorAmount = 100_000 * 10 ** USDC_DECIMALS; // 100,000 USDC each

        usdc.mint(donor1, donorAmount);
        usdc.mint(donor2, donorAmount);
        usdc.mint(donor3, donorAmount);

        console.log("Donor 1 (Alice):", donor1);
        console.log(
            "  USDC Balance:",
            usdc.balanceOf(donor1) / 10 ** USDC_DECIMALS,
            "USDC"
        );

        console.log("Donor 2 (Bob):", donor2);
        console.log(
            "  USDC Balance:",
            usdc.balanceOf(donor2) / 10 ** USDC_DECIMALS,
            "USDC"
        );

        console.log("Donor 3 (Charlie):", donor3);
        console.log(
            "  USDC Balance:",
            usdc.balanceOf(donor3) / 10 ** USDC_DECIMALS,
            "USDC"
        );
    }

    function addMatchingFunds() internal {
        console.log("\n=== Adding Matching Funds ===");
        console.log("Amount:", MATCHING_POOL / 10 ** USDC_DECIMALS, "USDC");

        // Approve pool to spend USDC
        usdc.approve(address(equiFundPool), MATCHING_POOL);

        // Add matching funds
        equiFundPool.addMatchingFunds(MATCHING_POOL);

        console.log(
            "Matching pool balance:",
            equiFundPool.matchingPoolBalance() / 10 ** USDC_DECIMALS,
            "USDC"
        );
    }

    function createRound() internal {
        console.log("\n=== Creating Funding Round ===");
        console.log("Duration:", ROUND_DURATION / 1 days, "days");

        equiFundPool.createRound(ROUND_DURATION);

        console.log("Round ID:", equiFundPool.currentRoundId());
        console.log("Round active:", equiFundPool.isRoundActive());
    }

    function logSummary() internal view {
        console.log("\n=================================");
        console.log("Mock Setup Complete!");
        console.log("=================================");
        console.log("\nContract Addresses:");
        console.log("  MockUSDC:", address(usdc));
        console.log("  ProjectRegistry:", address(projectRegistry));
        console.log("  SybilGuard:", address(sybilGuard));
        console.log("  EquiFundPool:", address(equiFundPool));

        console.log("\nProjects:");
        console.log("  1. Climate Action Fund:", project1);
        console.log("  2. Education For All:", project2);
        console.log("  3. Open Source Tools:", project3);
        console.log("  4. Healthcare Access:", project4);

        console.log("\nMock Donors:");
        console.log("  1. Alice:", donor1);
        console.log(
            "     Balance:",
            usdc.balanceOf(donor1) / 10 ** USDC_DECIMALS,
            "USDC"
        );
        console.log("  2. Bob:", donor2);
        console.log(
            "     Balance:",
            usdc.balanceOf(donor2) / 10 ** USDC_DECIMALS,
            "USDC"
        );
        console.log("  3. Charlie:", donor3);
        console.log(
            "     Balance:",
            usdc.balanceOf(donor3) / 10 ** USDC_DECIMALS,
            "USDC"
        );

        console.log("\nRound Status:");
        console.log("  Current Round ID:", equiFundPool.currentRoundId());
        console.log("  Is Active:", equiFundPool.isRoundActive());
        console.log(
            "  Matching Pool:",
            equiFundPool.matchingPoolBalance() / 10 ** USDC_DECIMALS,
            "USDC"
        );

        console.log("\nConfiguration:");
        console.log("  Cooldown Period:", COOLDOWN_PERIOD, "seconds");
        console.log(
            "  Minimum Contribution:",
            MINIMUM_CONTRIBUTION / 10 ** USDC_DECIMALS,
            "USDC"
        );
        console.log("  Round Duration:", ROUND_DURATION / 1 days, "days");

        console.log("\n=================================\n");

        console.log("Next Steps:");
        console.log(
            "1. Donors need to approve EquiFundPool to spend their USDC:"
        );
        console.log("   usdc.approve(equiFundPool, amount)");
        console.log("2. Donors can contribute:");
        console.log("   equiFundPool.contribute(projectAddress, amount)");
        console.log("3. After round ends, finalize:");
        console.log("   equiFundPool.finalizeRound()");
        console.log("4. Projects withdraw matching:");
        console.log("   equiFundPool.withdrawMatching(roundId)");
    }

    /**
     * @dev Helper to get all deployed addresses for frontend integration
     */
    function getDeployedAddresses()
        external
        view
        returns (
            address _usdc,
            address _projectRegistry,
            address _sybilGuard,
            address _equiFundPool,
            address[] memory _projects,
            address[] memory _donors
        )
    {
        address[] memory projects = new address[](4);
        projects[0] = project1;
        projects[1] = project2;
        projects[2] = project3;
        projects[3] = project4;

        address[] memory donors = new address[](3);
        donors[0] = donor1;
        donors[1] = donor2;
        donors[2] = donor3;

        return (
            address(usdc),
            address(projectRegistry),
            address(sybilGuard),
            address(equiFundPool),
            projects,
            donors
        );
    }
}
