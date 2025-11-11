// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/QuadraticMath.sol";

contract QuadraticMathTest is Test {
    using QuadraticMath for *;
    
    function testSqrt() public pure {
        assertEq(QuadraticMath.sqrt(0), 0);
        assertEq(QuadraticMath.sqrt(1), 1);
        assertEq(QuadraticMath.sqrt(4), 2);
        assertEq(QuadraticMath.sqrt(9), 3);
        assertEq(QuadraticMath.sqrt(16), 4);
        assertEq(QuadraticMath.sqrt(25), 5);
        assertEq(QuadraticMath.sqrt(100), 10);
        assertEq(QuadraticMath.sqrt(144), 12);
        assertEq(QuadraticMath.sqrt(1000), 31);
    }
    
    function testSqrtLargeNumbers() public pure {
        assertEq(QuadraticMath.sqrt(1e18), 1e9);
        assertEq(QuadraticMath.sqrt(4e18), 2e9);
        assertEq(QuadraticMath.sqrt(9e18), 3e9);
    }
    
    function testSumSquareRoots() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 100;
        amounts[2] = 100;
        
        uint256 sum = QuadraticMath.sumSquareRoots(amounts);
        assertEq(sum, 30); // 10 + 10 + 10
    }
    
    function testSumSquareRootsWithZeros() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 0;
        amounts[2] = 100;
        
        uint256 sum = QuadraticMath.sumSquareRoots(amounts);
        assertEq(sum, 20); // 10 + 0 + 10
    }
    
    function testCalculateProjectMatch() public {
        uint256 totalPool = 1000 ether;
        uint256 totalSumOfSquares = 100;
        uint256 projectSumOfSqrts = 10;
        
        uint256 matchAmount = QuadraticMath.calculateProjectMatch(
            totalPool,
            totalSumOfSquares,
            projectSumOfSqrts
        );
        
        // projectSquare = 10 * 10 = 100
        // match = (100 * 1000) / 100 = 1000
        assertEq(matchAmount, 1000 ether);
    }
    
    function testCalculateProjectMatchZeroPool() public {
        uint256 matchAmount = QuadraticMath.calculateProjectMatch(0, 100, 10);
        assertEq(matchAmount, 0);
    }
    
    function testCalculateProjectMatchZeroSqrts() public {
        uint256 matchAmount = QuadraticMath.calculateProjectMatch(1000 ether, 100, 0);
        assertEq(matchAmount, 0);
    }
    
    function testCalculateMatchSingleProject() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](1);
        
        projectContributions[0] = new QuadraticMath.Contribution[](2);
        projectContributions[0][0] = QuadraticMath.Contribution(address(0x1), 1 ether);
        projectContributions[0][1] = QuadraticMath.Contribution(address(0x2), 1 ether);
        
        uint256[] memory matches = QuadraticMath.calculateMatch(
            1000 ether,
            projectContributions
        );
        
        assertEq(matches.length, 1);
        assertEq(matches[0], 1000 ether); // Single project gets full pool
    }
    
    function testCalculateMatchMultipleProjects() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](2);
        
        // Project 1: 2 donors, 1 ETH each
        projectContributions[0] = new QuadraticMath.Contribution[](2);
        projectContributions[0][0] = QuadraticMath.Contribution(address(0x1), 1 ether);
        projectContributions[0][1] = QuadraticMath.Contribution(address(0x2), 1 ether);
        
        // Project 2: 1 donor, 4 ETH
        projectContributions[1] = new QuadraticMath.Contribution[](1);
        projectContributions[1][0] = QuadraticMath.Contribution(address(0x3), 4 ether);
        
        uint256[] memory matches = QuadraticMath.calculateMatch(
            1000 ether,
            projectContributions
        );
        
        assertEq(matches.length, 2);
        // Both should get some amount
        assertGt(matches[0], 0);
        assertGt(matches[1], 0);
        // Total should equal matching pool (with potential dust)
        assertLe(matches[0] + matches[1], 1000 ether);
        assertGe(matches[0] + matches[1], 1000 ether);
    }
    
    function testCalculateMatchFavorsMultipleDonors() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](2);
        
        // Project 1: 4 donors, 1 ETH each = 4 ETH total
        projectContributions[0] = new QuadraticMath.Contribution[](4);
        projectContributions[0][0] = QuadraticMath.Contribution(address(0x1), 1 ether);
        projectContributions[0][1] = QuadraticMath.Contribution(address(0x2), 1 ether);
        projectContributions[0][2] = QuadraticMath.Contribution(address(0x3), 1 ether);
        projectContributions[0][3] = QuadraticMath.Contribution(address(0x4), 1 ether);
        
        // Project 2: 1 donor, 4 ETH = 4 ETH total
        projectContributions[1] = new QuadraticMath.Contribution[](1);
        projectContributions[1][0] = QuadraticMath.Contribution(address(0x5), 4 ether);
        
        uint256[] memory matches = QuadraticMath.calculateMatch(
            1000 ether,
            projectContributions
        );
        
        // Project 1 should get MORE due to quadratic funding
        // Project 1: (1 + 1 + 1 + 1)² = 16
        // Project 2: (2)² = 4
        // Total = 20, Project 1 gets 16/20 = 80%
        assertGt(matches[0], matches[1]);
        assertApproxEqRel(matches[0], 800 ether, 0.01e18); // Within 1%
    }
    
    function testCalculateMatchNoContributions() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](2);
        
        projectContributions[0] = new QuadraticMath.Contribution[](0);
        projectContributions[1] = new QuadraticMath.Contribution[](0);
        
        uint256[] memory matches = QuadraticMath.calculateMatch(
            1000 ether,
            projectContributions
        );
        
        assertEq(matches[0], 0);
        assertEq(matches[1], 0);
    }
    
    function testNormalizeContributions() public {
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;
        
        uint256[] memory normalized = QuadraticMath.normalizeContributions(amounts);
        
        // Should maintain ratios
        assertEq(normalized[0] * 3, normalized[2]);
        assertEq(normalized[1] * 3, normalized[2] * 2);
    }
    
    function testValidateMatchingCalculation() public {
        uint256[] memory matches = new uint256[](3);
        matches[0] = 300 ether;
        matches[1] = 400 ether;
        matches[2] = 300 ether;
        
        bool valid = QuadraticMath.validateMatchingCalculation(1000 ether, matches);
        assertTrue(valid);
    }
    
    function testValidateMatchingCalculationExceedsPool() public {
        uint256[] memory matches = new uint256[](3);
        matches[0] = 400 ether;
        matches[1] = 400 ether;
        matches[2] = 300 ether;
        
        bool valid = QuadraticMath.validateMatchingCalculation(1000 ether, matches);
        assertFalse(valid);
    }
    
    function testCalculateMatchRevertsZeroPool() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](1);
        projectContributions[0] = new QuadraticMath.Contribution[](1);
        projectContributions[0][0] = QuadraticMath.Contribution(address(0x1), 1 ether);
        
        vm.expectRevert("QuadraticMath: matching pool must be positive");
        QuadraticMath.calculateMatch(0, projectContributions);
    }
    
    function testCalculateMatchRevertsNoProjects() public {
        QuadraticMath.Contribution[][] memory projectContributions = 
            new QuadraticMath.Contribution[][](0);
        
        vm.expectRevert("QuadraticMath: no projects");
        QuadraticMath.calculateMatch(1000 ether, projectContributions);
    }
    
    function testFuzzSqrt(uint256 x) public pure {
        vm.assume(x < type(uint128).max);
        
        uint256 result = QuadraticMath.sqrt(x);
        
        // Verify: result² <= x < (result+1)²
        assertLe(result * result, x);
        if (result < type(uint128).max) {
            assertGt((result + 1) * (result + 1), x);
        }
    }
}

