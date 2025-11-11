// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EquiFundPool.sol";
import "../src/ProjectRegistry.sol";
import "../src/SybilGuard.sol";
import "../src/MockUSDC.sol";

/**
 * @title Deploy
 * @dev Deployment script for EquiFund contracts with USDC
 * @notice Deploy all contracts in correct order with proper configuration
 *
 * Usage:
 * forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --broadcast --verify
 *
 * For local testing:
 * forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast
 */
contract Deploy is Script {
    // Deployment configuration
    uint256 constant USDC_DECIMALS = 6;
    uint256 constant COOLDOWN_PERIOD = 1 hours;
    uint256 constant MINIMUM_CONTRIBUTION = 1 * 10 ** USDC_DECIMALS; // 1 USDC

    // Deployed contract addresses
    MockUSDC public usdc;
    ProjectRegistry public projectRegistry;
    SybilGuard public sybilGuard;
    EquiFundPool public equiFundPool;

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC (or use existing USDC address on mainnet)
        console.log("\n1. Deploying MockUSDC...");
        usdc = new MockUSDC();
        console.log("   MockUSDC deployed at:", address(usdc));
        console.log(
            "   Initial supply:",
            usdc.totalSupply() / 10 ** USDC_DECIMALS,
            "USDC"
        );

        // 2. Deploy ProjectRegistry
        console.log("\n2. Deploying ProjectRegistry...");
        projectRegistry = new ProjectRegistry();
        console.log(
            "   ProjectRegistry deployed at:",
            address(projectRegistry)
        );

        // 3. Deploy SybilGuard
        console.log("\n3. Deploying SybilGuard...");
        console.log("   Cooldown period:", COOLDOWN_PERIOD, "seconds");
        sybilGuard = new SybilGuard(COOLDOWN_PERIOD);
        console.log("   SybilGuard deployed at:", address(sybilGuard));

        // 4. Deploy EquiFundPool
        console.log("\n4. Deploying EquiFundPool...");
        console.log(
            "   Minimum contribution:",
            MINIMUM_CONTRIBUTION / 10 ** USDC_DECIMALS,
            "USDC"
        );
        equiFundPool = new EquiFundPool(
            address(usdc),
            address(projectRegistry),
            address(sybilGuard),
            MINIMUM_CONTRIBUTION
        );
        console.log("   EquiFundPool deployed at:", address(equiFundPool));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("MockUSDC:", address(usdc));
        console.log("ProjectRegistry:", address(projectRegistry));
        console.log("SybilGuard:", address(sybilGuard));
        console.log("EquiFundPool:", address(equiFundPool));
        console.log("==========================\n");
    }

    /**
     * @dev Deploy with existing USDC address (for mainnet)
     */
    function runWithExistingUSDC(
        address existingUSDC
    )
        external
        returns (
            address _projectRegistry,
            address _sybilGuard,
            address _equiFundPool
        )
    {
        require(existingUSDC != address(0), "Invalid USDC address");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        projectRegistry = new ProjectRegistry();
        sybilGuard = new SybilGuard(COOLDOWN_PERIOD);
        equiFundPool = new EquiFundPool(
            existingUSDC,
            address(projectRegistry),
            address(sybilGuard),
            MINIMUM_CONTRIBUTION
        );

        vm.stopBroadcast();

        return (
            address(projectRegistry),
            address(sybilGuard),
            address(equiFundPool)
        );
    }
}
