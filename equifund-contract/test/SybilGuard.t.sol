// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SybilGuard.sol";

contract SybilGuardTest is Test {
    SybilGuard public sybilGuard;
    
    address public owner = address(this);
    address public donor1 = address(0x1);
    address public donor2 = address(0x2);
    
    uint256 constant COOLDOWN_PERIOD = 1 hours;
    
    event ContributionRecorded(address indexed donor, uint256 timestamp);
    event CooldownUpdated(uint256 oldPeriod, uint256 newPeriod);
    event VerificationStatusChanged(address indexed addr, bool isVerified);
    
    function setUp() public {
        sybilGuard = new SybilGuard(COOLDOWN_PERIOD);
    }
    
    function testConstructor() public view {
        assertEq(sybilGuard.cooldownPeriod(), COOLDOWN_PERIOD);
        assertEq(sybilGuard.owner(), owner);
    }
    
    function testConstructorRevertsZeroCooldown() public {
        vm.expectRevert("SybilGuard: cooldown must be positive");
        new SybilGuard(0);
    }
    
    function testCheckEligibilityFirstTime() public view {
        assertTrue(sybilGuard.checkEligibility(donor1));
    }
    
    function testRecordContribution() public {
        vm.expectEmit(true, false, false, true);
        emit ContributionRecorded(donor1, block.timestamp);
        
        sybilGuard.recordContribution(donor1);
        
        assertEq(sybilGuard.lastContributionTime(donor1), block.timestamp);
    }
    
    function testCheckEligibilityAfterContribution() public {
        sybilGuard.recordContribution(donor1);
        
        // Should not be eligible immediately
        assertFalse(sybilGuard.checkEligibility(donor1));
        
        // Should be eligible after cooldown
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        assertTrue(sybilGuard.checkEligibility(donor1));
    }
    
    function testRecordContributionRevertsInCooldown() public {
        sybilGuard.recordContribution(donor1);
        
        vm.expectRevert("SybilGuard: cooldown period not elapsed");
        sybilGuard.recordContribution(donor1);
    }
    
    function testRecordContributionAfterCooldown() public {
        sybilGuard.recordContribution(donor1);
        
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        
        sybilGuard.recordContribution(donor1);
        assertEq(sybilGuard.lastContributionTime(donor1), block.timestamp);
    }
    
    function testAddVerifiedAddress() public {
        vm.expectEmit(true, false, false, true);
        emit VerificationStatusChanged(donor1, true);
        
        sybilGuard.addVerifiedAddress(donor1);
        
        assertTrue(sybilGuard.verifiedAddresses(donor1));
        assertTrue(sybilGuard.isVerified(donor1));
    }
    
    function testAddVerifiedAddressRevertsZeroAddress() public {
        vm.expectRevert("SybilGuard: zero address");
        sybilGuard.addVerifiedAddress(address(0));
    }
    
    function testAddVerifiedAddressRevertsAlreadyVerified() public {
        sybilGuard.addVerifiedAddress(donor1);
        
        vm.expectRevert("SybilGuard: already verified");
        sybilGuard.addVerifiedAddress(donor1);
    }
    
    function testAddVerifiedAddressOnlyOwner() public {
        vm.prank(donor1);
        vm.expectRevert();
        sybilGuard.addVerifiedAddress(donor2);
    }
    
    function testVerifiedAddressBypassesCooldown() public {
        sybilGuard.addVerifiedAddress(donor1);
        
        sybilGuard.recordContribution(donor1);
        
        // Should still be eligible immediately (no cooldown)
        assertTrue(sybilGuard.checkEligibility(donor1));
        
        // Should be able to contribute again immediately
        sybilGuard.recordContribution(donor1);
    }
    
    function testRemoveVerifiedAddress() public {
        sybilGuard.addVerifiedAddress(donor1);
        
        vm.expectEmit(true, false, false, true);
        emit VerificationStatusChanged(donor1, false);
        
        sybilGuard.removeVerifiedAddress(donor1);
        
        assertFalse(sybilGuard.verifiedAddresses(donor1));
        assertFalse(sybilGuard.isVerified(donor1));
    }
    
    function testRemoveVerifiedAddressRevertsNotVerified() public {
        vm.expectRevert("SybilGuard: not verified");
        sybilGuard.removeVerifiedAddress(donor1);
    }
    
    function testRemoveVerifiedAddressOnlyOwner() public {
        sybilGuard.addVerifiedAddress(donor1);
        
        vm.prank(donor2);
        vm.expectRevert();
        sybilGuard.removeVerifiedAddress(donor1);
    }
    
    function testUpdateCooldown() public {
        uint256 newCooldown = 2 hours;
        
        vm.expectEmit(false, false, false, true);
        emit CooldownUpdated(COOLDOWN_PERIOD, newCooldown);
        
        sybilGuard.updateCooldown(newCooldown);
        
        assertEq(sybilGuard.cooldownPeriod(), newCooldown);
    }
    
    function testUpdateCooldownRevertsZero() public {
        vm.expectRevert("SybilGuard: cooldown must be positive");
        sybilGuard.updateCooldown(0);
    }
    
    function testUpdateCooldownOnlyOwner() public {
        vm.prank(donor1);
        vm.expectRevert();
        sybilGuard.updateCooldown(2 hours);
    }
    
    function testBatchAddVerifiedAddresses() public {
        address[] memory donors = new address[](3);
        donors[0] = address(0x1);
        donors[1] = address(0x2);
        donors[2] = address(0x3);
        
        sybilGuard.batchAddVerifiedAddresses(donors);
        
        assertTrue(sybilGuard.isVerified(donors[0]));
        assertTrue(sybilGuard.isVerified(donors[1]));
        assertTrue(sybilGuard.isVerified(donors[2]));
    }
    
    function testBatchAddVerifiedAddressesSkipsInvalid() public {
        address[] memory donors = new address[](4);
        donors[0] = address(0x1);
        donors[1] = address(0); // Zero address
        donors[2] = address(0x2);
        donors[3] = address(0x1); // Duplicate
        
        sybilGuard.batchAddVerifiedAddresses(donors);
        
        assertTrue(sybilGuard.isVerified(donors[0]));
        assertFalse(sybilGuard.isVerified(donors[1]));
        assertTrue(sybilGuard.isVerified(donors[2]));
    }
    
    function testCanContribute() public {
        // First time should be able to contribute
        assertTrue(sybilGuard.canContribute(donor1));
        
        sybilGuard.recordContribution(donor1);
        
        // During cooldown should not be able to contribute
        assertFalse(sybilGuard.canContribute(donor1));
        
        // After cooldown should be able to contribute
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        assertTrue(sybilGuard.canContribute(donor1));
    }
    
    function testTimeUntilNextContribution() public {
        // First time should be 0
        assertEq(sybilGuard.timeUntilNextContribution(donor1), 0);
        
        sybilGuard.recordContribution(donor1);
        
        // Should show remaining time
        assertEq(sybilGuard.timeUntilNextContribution(donor1), COOLDOWN_PERIOD);
        
        // Halfway through cooldown
        vm.warp(block.timestamp + COOLDOWN_PERIOD / 2);
        assertEq(sybilGuard.timeUntilNextContribution(donor1), COOLDOWN_PERIOD / 2);
        
        // After cooldown
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        assertEq(sybilGuard.timeUntilNextContribution(donor1), 0);
    }
    
    function testTimeUntilNextContributionVerified() public {
        sybilGuard.addVerifiedAddress(donor1);
        sybilGuard.recordContribution(donor1);
        
        // Verified addresses always return 0
        assertEq(sybilGuard.timeUntilNextContribution(donor1), 0);
    }
    
    function testGetCooldownPeriod() public view {
        assertEq(sybilGuard.getCooldownPeriod(), COOLDOWN_PERIOD);
    }
    
    function testGetLastContributionTime() public {
        assertEq(sybilGuard.getLastContributionTime(donor1), 0);
        
        uint256 contributionTime = block.timestamp;
        sybilGuard.recordContribution(donor1);
        
        assertEq(sybilGuard.getLastContributionTime(donor1), contributionTime);
    }
    
    function testMultipleDonorsIndependent() public {
        sybilGuard.recordContribution(donor1);
        
        // Donor2 should still be eligible
        assertTrue(sybilGuard.checkEligibility(donor2));
        
        sybilGuard.recordContribution(donor2);
        
        // Both in cooldown
        assertFalse(sybilGuard.checkEligibility(donor1));
        assertFalse(sybilGuard.checkEligibility(donor2));
        
        // After cooldown, both eligible
        vm.warp(block.timestamp + COOLDOWN_PERIOD);
        assertTrue(sybilGuard.checkEligibility(donor1));
        assertTrue(sybilGuard.checkEligibility(donor2));
    }
}

