// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/EquiFundPool.sol";
import "../src/ProjectRegistry.sol";
import "../src/SybilGuard.sol";
import "../src/MockUSDC.sol";

contract EquiFundPoolTest is Test {
    EquiFundPool public pool;
    ProjectRegistry public registry;
    SybilGuard public sybilGuard;
    MockUSDC public usdc;
    
    address public owner = address(this);
    address public donor1 = address(0x1);
    address public donor2 = address(0x2);
    address public donor3 = address(0x3);
    address public project1 = address(0x11);
    address public project2 = address(0x12);
    address public project3 = address(0x13);
    
    uint256 constant USDC_DECIMALS = 6;
    uint256 constant MIN_CONTRIBUTION = 1 * 10**USDC_DECIMALS; // 1 USDC
    uint256 constant COOLDOWN_PERIOD = 1 hours;
    uint256 constant ROUND_DURATION = 7 days;
    
    event RoundCreated(uint256 indexed roundId, uint256 startTime, uint256 endTime, uint256 matchingPool);
    event ContributionMade(uint256 indexed roundId, address indexed donor, address indexed project, uint256 amount);
    event RoundFinalized(uint256 indexed roundId, uint256 totalMatched);
    event MatchingFundsAdded(address indexed funder, uint256 amount);
    event MatchingWithdrawn(uint256 indexed roundId, address indexed project, uint256 amount);
    
    function setUp() public {
        // Deploy USDC
        usdc = new MockUSDC();
        
        // Deploy dependencies
        registry = new ProjectRegistry();
        sybilGuard = new SybilGuard(COOLDOWN_PERIOD);
        
        // Deploy main contract
        pool = new EquiFundPool(address(usdc), address(registry), address(sybilGuard), MIN_CONTRIBUTION);
        
        // Register projects
        registry.registerProject(project1, "Project 1", "Description 1", "ipfs://1");
        registry.registerProject(project2, "Project 2", "Description 2", "ipfs://2");
        registry.registerProject(project3, "Project 3", "Description 3", "ipfs://3");
        
        // Mint USDC to test accounts
        usdc.mint(donor1, 100_000 * 10**USDC_DECIMALS);
        usdc.mint(donor2, 100_000 * 10**USDC_DECIMALS);
        usdc.mint(donor3, 100_000 * 10**USDC_DECIMALS);
        usdc.mint(owner, 1_000_000 * 10**USDC_DECIMALS);
        
        // Approve pool to spend USDC
        vm.prank(donor1);
        usdc.approve(address(pool), type(uint256).max);
        
        vm.prank(donor2);
        usdc.approve(address(pool), type(uint256).max);
        
        vm.prank(donor3);
        usdc.approve(address(pool), type(uint256).max);
        
        usdc.approve(address(pool), type(uint256).max);
    }
    
    function testConstructor() public view {
        assertEq(pool.owner(), owner);
        assertEq(address(pool.usdc()), address(usdc));
        assertEq(address(pool.projectRegistry()), address(registry));
        assertEq(address(pool.sybilGuard()), address(sybilGuard));
        assertEq(pool.minimumContribution(), MIN_CONTRIBUTION);
        assertEq(pool.currentRoundId(), 0);
    }
    
    function testConstructorRevertsZeroUSDC() public {
        vm.expectRevert("EquiFundPool: zero USDC address");
        new EquiFundPool(address(0), address(registry), address(sybilGuard), MIN_CONTRIBUTION);
    }
    
    function testConstructorRevertsZeroRegistry() public {
        vm.expectRevert("EquiFundPool: zero registry address");
        new EquiFundPool(address(usdc), address(0), address(sybilGuard), MIN_CONTRIBUTION);
    }
    
    function testConstructorRevertsZeroGuard() public {
        vm.expectRevert("EquiFundPool: zero guard address");
        new EquiFundPool(address(usdc), address(registry), address(0), MIN_CONTRIBUTION);
    }
    
    function testAddMatchingFunds() public {
        uint256 amount = 10_000 * 10**USDC_DECIMALS;
        
        vm.expectEmit(true, false, false, true);
        emit MatchingFundsAdded(owner, amount);
        
        pool.addMatchingFunds(amount);
        
        assertEq(pool.matchingPoolBalance(), amount);
        assertEq(usdc.balanceOf(address(pool)), amount);
    }
    
    function testAddMatchingFundsRevertsZeroAmount() public {
        vm.expectRevert("EquiFundPool: zero amount");
        pool.addMatchingFunds(0);
    }
    
    function testCreateRound() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        
        vm.expectEmit(true, false, false, false);
        emit RoundCreated(1, block.timestamp, block.timestamp + ROUND_DURATION, 10_000 * 10**USDC_DECIMALS);
        
        pool.createRound(ROUND_DURATION);
        
        assertEq(pool.currentRoundId(), 1);
        assertEq(pool.matchingPoolBalance(), 0);
        assertTrue(pool.isRoundActive());
        
        (
            uint256 startTime,
            uint256 endTime,
            uint256 matchingPoolAmount,
            uint256 totalContributions,
            uint256 totalContributors,
            bool finalized
        ) = pool.getRoundStats(1);
        
        assertEq(startTime, block.timestamp);
        assertEq(endTime, block.timestamp + ROUND_DURATION);
        assertEq(matchingPoolAmount, 10_000 * 10**USDC_DECIMALS);
        assertEq(totalContributions, 0);
        assertEq(totalContributors, 0);
        assertFalse(finalized);
    }
    
    function testCreateRoundRevertsZeroDuration() public {
        vm.expectRevert("EquiFundPool: invalid duration");
        pool.createRound(0);
    }
    
    function testCreateRoundRevertsCurrentNotFinalized() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.expectRevert("EquiFundPool: current round not finalized");
        pool.createRound(ROUND_DURATION);
    }
    
    function testCreateRoundOnlyOwner() public {
        vm.prank(donor1);
        vm.expectRevert();
        pool.createRound(ROUND_DURATION);
    }
    
    function testContribute() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        uint256 contributionAmount = 1_000 * 10**USDC_DECIMALS;
        uint256 projectBalanceBefore = usdc.balanceOf(project1);
        uint256 donor1BalanceBefore = usdc.balanceOf(donor1);
        
        vm.expectEmit(true, true, true, true);
        emit ContributionMade(1, donor1, project1, contributionAmount);
        
        vm.prank(donor1);
        pool.contribute(project1, contributionAmount);
        
        assertEq(pool.contributions(1, donor1, project1), contributionAmount);
        assertEq(pool.projectTotalContributions(1, project1), contributionAmount);
        assertEq(usdc.balanceOf(project1), projectBalanceBefore + contributionAmount);
        assertEq(usdc.balanceOf(donor1), donor1BalanceBefore - contributionAmount);
        assertTrue(pool.hasDonorContributed(1, donor1));
        
        (,,, uint256 totalContributions, uint256 totalContributors,) = pool.getRoundStats(1);
        assertEq(totalContributions, contributionAmount);
        assertEq(totalContributors, 1);
    }
    
    function testContributeRevertsNoActiveRound() public {
        vm.prank(donor1);
        vm.expectRevert("EquiFundPool: no active round");
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
    }
    
    function testContributeRevertsRoundNotActive() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        // Warp past round end
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        
        vm.prank(donor1);
        vm.expectRevert("EquiFundPool: round not active");
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
    }
    
    function testContributeRevertsBelowMinimum() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        vm.expectRevert("EquiFundPool: below minimum");
        pool.contribute(project1, MIN_CONTRIBUTION - 1);
    }
    
    function testContributeRevertsProjectNotActive() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        // Deactivate project
        registry.toggleProjectStatus(project1);
        
        vm.prank(donor1);
        vm.expectRevert("EquiFundPool: project not active");
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
    }
    
    function testContributeRevertsSybilGuard() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        // First contribution succeeds
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        // Second contribution within cooldown fails
        vm.prank(donor1);
        vm.expectRevert("EquiFundPool: not eligible");
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
    }
    
    function testContributeMultipleDonors() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor2);
        pool.contribute(project1, 2_000 * 10**USDC_DECIMALS);
        
        assertEq(pool.projectTotalContributions(1, project1), 3_000 * 10**USDC_DECIMALS);
        
        (,,, uint256 totalContributions, uint256 totalContributors,) = pool.getRoundStats(1);
        assertEq(totalContributions, 3_000 * 10**USDC_DECIMALS);
        assertEq(totalContributors, 2);
    }
    
    function testContributeMultipleProjects() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor2);
        pool.contribute(project2, 1_000 * 10**USDC_DECIMALS);
        
        assertEq(pool.projectTotalContributions(1, project1), 1_000 * 10**USDC_DECIMALS);
        assertEq(pool.projectTotalContributions(1, project2), 1_000 * 10**USDC_DECIMALS);
        
        address[] memory roundProjects = pool.getRoundProjects(1);
        assertEq(roundProjects.length, 2);
    }
    
    function testFinalizeRound() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        // Multiple donors contribute
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        vm.prank(donor1);
        pool.contribute(project2, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor2);
        pool.contribute(project1, 2_000 * 10**USDC_DECIMALS);
        
        // End round
        vm.warp(block.timestamp + ROUND_DURATION);
        
        vm.expectEmit(true, false, false, false);
        emit RoundFinalized(1, 10_000 * 10**USDC_DECIMALS);
        
        pool.finalizeRound();
        
        (,,,,,bool finalized) = pool.getRoundStats(1);
        assertTrue(finalized);
        
        // Check matching amounts were calculated
        uint256 match1 = pool.getProjectMatchAmount(1, project1);
        uint256 match2 = pool.getProjectMatchAmount(1, project2);
        
        assertGt(match1, 0);
        assertGt(match2, 0);
        assertEq(match1 + match2, 10_000 * 10**USDC_DECIMALS);
    }
    
    function testFinalizeRoundRevertsNoRound() public {
        vm.expectRevert("EquiFundPool: no round to finalize");
        pool.finalizeRound();
    }
    
    function testFinalizeRoundRevertsNotEnded() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.expectRevert("EquiFundPool: round not ended");
        pool.finalizeRound();
    }
    
    function testFinalizeRoundRevertsAlreadyFinalized() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        vm.expectRevert("EquiFundPool: already finalized");
        pool.finalizeRound();
    }
    
    function testFinalizeRoundNoContributions() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        
        vm.expectEmit(true, false, false, true);
        emit RoundFinalized(1, 0);
        
        pool.finalizeRound();
        
        (,,,,,bool finalized) = pool.getRoundStats(1);
        assertTrue(finalized);
    }
    
    function testWithdrawMatching() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor2);
        pool.contribute(project2, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        uint256 matchAmount = pool.getProjectMatchAmount(1, project1);
        uint256 balanceBefore = usdc.balanceOf(project1);
        
        vm.expectEmit(true, true, false, true);
        emit MatchingWithdrawn(1, project1, matchAmount);
        
        vm.prank(project1);
        pool.withdrawMatching(1);
        
        assertEq(usdc.balanceOf(project1), balanceBefore + matchAmount);
        assertTrue(pool.hasProjectWithdrawn(1, project1));
    }
    
    function testWithdrawMatchingRevertsNotFinalized() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(project1);
        vm.expectRevert("EquiFundPool: round not finalized");
        pool.withdrawMatching(1);
    }
    
    function testWithdrawMatchingRevertsAlreadyWithdrawn() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        vm.prank(project1);
        pool.withdrawMatching(1);
        
        vm.prank(project1);
        vm.expectRevert("EquiFundPool: already withdrawn");
        pool.withdrawMatching(1);
    }
    
    function testWithdrawMatchingRevertsNoMatching() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        // Project3 didn't receive contributions
        vm.prank(project3);
        vm.expectRevert("EquiFundPool: no matching funds");
        pool.withdrawMatching(1);
    }
    
    function testUpdateMinimumContribution() public {
        uint256 newMin = 10 * 10**USDC_DECIMALS;
        
        pool.updateMinimumContribution(newMin);
        
        assertEq(pool.minimumContribution(), newMin);
    }
    
    function testUpdateMinimumContributionOnlyOwner() public {
        vm.prank(donor1);
        vm.expectRevert();
        pool.updateMinimumContribution(10 * 10**USDC_DECIMALS);
    }
    
    function testPause() public {
        pool.pause();
        assertTrue(pool.paused());
    }
    
    function testPauseOnlyOwner() public {
        vm.prank(donor1);
        vm.expectRevert();
        pool.pause();
    }
    
    function testUnpause() public {
        pool.pause();
        pool.unpause();
        assertFalse(pool.paused());
    }
    
    function testContributeRevertsPaused() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        pool.pause();
        
        vm.prank(donor1);
        vm.expectRevert();
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
    }
    
    function testEmergencyWithdraw() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.pause();
        
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        pool.emergencyWithdraw();
        
        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + 10_000 * 10**USDC_DECIMALS);
    }
    
    function testEmergencyWithdrawRevertsNotPaused() public {
        vm.expectRevert();
        pool.emergencyWithdraw();
    }
    
    function testEmergencyWithdrawOnlyOwner() public {
        pool.pause();
        
        vm.prank(donor1);
        vm.expectRevert();
        pool.emergencyWithdraw();
    }
    
    function testGetTimeRemaining() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        assertEq(pool.getTimeRemaining(), ROUND_DURATION);
        
        vm.warp(block.timestamp + ROUND_DURATION / 2);
        assertEq(pool.getTimeRemaining(), ROUND_DURATION / 2);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        assertEq(pool.getTimeRemaining(), 0);
    }
    
    function testGetContractBalance() public {
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        assertEq(pool.getContractBalance(), 10_000 * 10**USDC_DECIMALS);
    }
    
    function testCompleteRoundCycle() public {
        // 1. Add matching funds
        pool.addMatchingFunds(100_000 * 10**USDC_DECIMALS);
        
        // 2. Create round
        pool.createRound(ROUND_DURATION);
        
        // 3. Multiple contributions
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor2);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.prank(donor3);
        pool.contribute(project2, 4_000 * 10**USDC_DECIMALS);
        
        // 4. End and finalize round
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        // 5. Projects withdraw
        uint256 match1 = pool.getProjectMatchAmount(1, project1);
        uint256 match2 = pool.getProjectMatchAmount(1, project2);
        
        vm.prank(project1);
        pool.withdrawMatching(1);
        
        vm.prank(project2);
        pool.withdrawMatching(1);
        
        // Verify total distribution
        assertEq(match1 + match2, 100_000 * 10**USDC_DECIMALS);
        
        // Both projects should receive some matching
        assertGt(match1, 0);
        assertGt(match2, 0);
        
        // Note: MVP uses simplified QF calculation (sqrt of total)
        // In full implementation with per-donor tracking, project1 would get more
    }
    
    function testMultipleRounds() public {
        // Round 1
        pool.addMatchingFunds(10_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        vm.prank(donor1);
        pool.contribute(project1, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        // Round 2
        pool.addMatchingFunds(20_000 * 10**USDC_DECIMALS);
        pool.createRound(ROUND_DURATION);
        
        assertEq(pool.currentRoundId(), 2);
        
        vm.prank(donor1);
        pool.contribute(project2, 1_000 * 10**USDC_DECIMALS);
        
        vm.warp(block.timestamp + ROUND_DURATION);
        pool.finalizeRound();
        
        // Verify both rounds finalized
        (,,,,,bool round1Finalized) = pool.getRoundStats(1);
        (,,,,,bool round2Finalized) = pool.getRoundStats(2);
        
        assertTrue(round1Finalized);
        assertTrue(round2Finalized);
    }
}
