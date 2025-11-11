// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuadraticMath
 * @dev Library for quadratic funding calculations
 * @notice Implements the quadratic funding formula: matching ∝ (√sum of contributions)²
 */
library QuadraticMath {
    /// @dev Maximum value to prevent overflow in square root calculations
    uint256 private constant MAX_SQRT_INPUT = type(uint128).max;

    struct Contribution {
        address donor;
        uint256 amount;
    }

    /**
     * @notice Calculate matching amounts for multiple projects using quadratic funding
     * @dev Implements QF formula where each project's match = (sumOfSqrts)² / totalSumOfSqrts² * matchingPool
     * @param matchingPool Total matching pool available for distribution
     * @param projectContributions Array of contribution arrays, one per project
     * @return matches Array of matching amounts for each project
     */
    function calculateMatch(
        uint256 matchingPool,
        Contribution[][] memory projectContributions
    ) external pure returns (uint256[] memory matches) {
        require(
            matchingPool > 0,
            "QuadraticMath: matching pool must be positive"
        );
        require(projectContributions.length > 0, "QuadraticMath: no projects");

        uint256 projectCount = projectContributions.length;
        matches = new uint256[](projectCount);

        // Calculate sum of square roots for each project
        uint256[] memory projectSumOfSqrts = new uint256[](projectCount);
        uint256 totalSumOfSquares = 0;

        for (uint256 i = 0; i < projectCount; i++) {
            uint256 sumOfSqrts = 0;

            // Sum square roots of individual contributions
            for (uint256 j = 0; j < projectContributions[i].length; j++) {
                uint256 amount = projectContributions[i][j].amount;
                if (amount > 0) {
                    sumOfSqrts += sqrt(amount);
                }
            }

            projectSumOfSqrts[i] = sumOfSqrts;

            // Square the sum: (√a + √b + √c)²
            if (sumOfSqrts > 0) {
                totalSumOfSquares += sumOfSqrts * sumOfSqrts;
            }
        }

        // Distribute matching pool proportionally
        if (totalSumOfSquares == 0) {
            return matches; // All zeros if no contributions
        }

        uint256 distributedTotal = 0;
        for (uint256 i = 0; i < projectCount; i++) {
            if (projectSumOfSqrts[i] > 0) {
                uint256 projectSquare = projectSumOfSqrts[i] *
                    projectSumOfSqrts[i];
                matches[i] = (projectSquare * matchingPool) / totalSumOfSquares;
                distributedTotal += matches[i];
            }
        }

        // Handle rounding dust - give to first non-zero project
        if (distributedTotal < matchingPool) {
            uint256 dust = matchingPool - distributedTotal;
            for (uint256 i = 0; i < projectCount; i++) {
                if (matches[i] > 0) {
                    matches[i] += dust;
                    break;
                }
            }
        }

        return matches;
    }

    /**
     * @notice Calculate individual project's matching amount
     * @param totalMatchingPool Total matching pool available
     * @param totalSumOfSquares Sum of all (sumOfSqrts)² across all projects
     * @param projectSumOfSqrts This project's sum of square roots
     * @return matchAmount The matching amount for this project
     */
    function calculateProjectMatch(
        uint256 totalMatchingPool,
        uint256 totalSumOfSquares,
        uint256 projectSumOfSqrts
    ) external pure returns (uint256 matchAmount) {
        if (totalSumOfSquares == 0 || projectSumOfSqrts == 0) {
            return 0;
        }

        uint256 projectSquare = projectSumOfSqrts * projectSumOfSqrts;
        matchAmount = (projectSquare * totalMatchingPool) / totalSumOfSquares;

        return matchAmount;
    }

    /**
     * @notice Calculate square root using Babylonian method
     * @dev Uses Newton's method for integer square root
     * @param x The number to calculate square root of
     * @return y The square root of x
     */
    function sqrt(uint256 x) public pure returns (uint256 y) {
        if (x == 0) return 0;
        if (x <= 3) return 1;

        uint256 z = (x + 1) / 2;
        y = x;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }

        return y;
    }

    /**
     * @notice Sum square roots of an array of amounts
     * @param amounts Array of contribution amounts
     * @return sum Sum of square roots
     */
    function sumSquareRoots(
        uint256[] memory amounts
    ) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] > 0) {
                sum += sqrt(amounts[i]);
            }
        }
        return sum;
    }

    /**
     * @notice Normalize contributions to prevent overflow
     * @dev Scales down large values proportionally
     * @param amounts Array of amounts to normalize
     * @return normalized Normalized amounts
     */
    function normalizeContributions(
        uint256[] memory amounts
    ) external pure returns (uint256[] memory normalized) {
        normalized = new uint256[](amounts.length);

        // Find maximum value
        uint256 maxAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] > maxAmount) {
                maxAmount = amounts[i];
            }
        }

        // If max is within safe range, no normalization needed
        if (maxAmount <= MAX_SQRT_INPUT) {
            return amounts;
        }

        // Scale down proportionally
        uint256 scaleFactor = maxAmount / MAX_SQRT_INPUT + 1;
        for (uint256 i = 0; i < amounts.length; i++) {
            normalized[i] = amounts[i] / scaleFactor;
        }

        return normalized;
    }

    /**
     * @notice Validate that matching calculation is correct
     * @dev Sanity check to ensure total matches don't exceed pool
     * @param totalPool Total matching pool
     * @param matches Array of individual matches
     * @return valid True if validation passes
     */
    function validateMatchingCalculation(
        uint256 totalPool,
        uint256[] memory matches
    ) external pure returns (bool valid) {
        uint256 sum = 0;
        for (uint256 i = 0; i < matches.length; i++) {
            sum += matches[i];
        }
        return sum <= totalPool;
    }
}
