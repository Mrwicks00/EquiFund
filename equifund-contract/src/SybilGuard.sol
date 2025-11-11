// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SybilGuard
 * @dev Basic Sybil resistance mechanism using time-based cooldowns
 * @notice MVP implementation - uses simple cooldown period between contributions
 */
contract SybilGuard is Ownable {
    /// @notice Time required between contributions from the same address
    uint256 public cooldownPeriod;

    /// @notice Timestamp of last contribution for each address
    mapping(address => uint256) public lastContributionTime;

    /// @notice Whitelist of verified addresses that bypass cooldown
    mapping(address => bool) public verifiedAddresses;

    /// @notice Emitted when a contribution is recorded
    event ContributionRecorded(address indexed donor, uint256 timestamp);

    /// @notice Emitted when cooldown period is updated
    event CooldownUpdated(uint256 oldPeriod, uint256 newPeriod);

    /// @notice Emitted when address verification status changes
    event VerificationStatusChanged(address indexed addr, bool isVerified);

    /**
     * @notice Constructor
     * @param _cooldownPeriod Initial cooldown period in seconds (e.g., 3600 for 1 hour)
     */
    constructor(uint256 _cooldownPeriod) Ownable(msg.sender) {
        require(_cooldownPeriod > 0, "SybilGuard: cooldown must be positive");
        cooldownPeriod = _cooldownPeriod;
    }

    /**
     * @notice Check if an address is eligible to contribute
     * @param donor Address to check
     * @return eligible True if address can contribute now
     */
    function checkEligibility(
        address donor
    ) public view returns (bool eligible) {
        // Verified addresses can always contribute
        if (verifiedAddresses[donor]) {
            return true;
        }

        // Check if cooldown period has passed
        uint256 lastTime = lastContributionTime[donor];
        if (lastTime == 0) {
            return true; // First time contributor
        }

        return block.timestamp >= lastTime + cooldownPeriod;
    }

    /**
     * @notice Record a contribution from an address
     * @dev Should be called by EquiFundPool contract
     * @param donor Address making the contribution
     */
    function recordContribution(address donor) external {
        require(
            checkEligibility(donor),
            "SybilGuard: cooldown period not elapsed"
        );

        lastContributionTime[donor] = block.timestamp;
        emit ContributionRecorded(donor, block.timestamp);
    }

    /**
     * @notice Add an address to verified whitelist
     * @dev Only owner can verify addresses
     * @param donor Address to verify
     */
    function addVerifiedAddress(address donor) external onlyOwner {
        require(donor != address(0), "SybilGuard: zero address");
        require(!verifiedAddresses[donor], "SybilGuard: already verified");

        verifiedAddresses[donor] = true;
        emit VerificationStatusChanged(donor, true);
    }

    /**
     * @notice Remove an address from verified whitelist
     * @dev Only owner can remove verification
     * @param donor Address to remove verification from
     */
    function removeVerifiedAddress(address donor) external onlyOwner {
        require(verifiedAddresses[donor], "SybilGuard: not verified");

        verifiedAddresses[donor] = false;
        emit VerificationStatusChanged(donor, false);
    }

    /**
     * @notice Update the cooldown period
     * @dev Only owner can update cooldown
     * @param newPeriod New cooldown period in seconds
     */
    function updateCooldown(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "SybilGuard: cooldown must be positive");

        uint256 oldPeriod = cooldownPeriod;
        cooldownPeriod = newPeriod;
        emit CooldownUpdated(oldPeriod, newPeriod);
    }

    /**
     * @notice Batch verify multiple addresses
     * @dev Gas-efficient way to verify multiple addresses at once
     * @param donors Array of addresses to verify
     */
    function batchAddVerifiedAddresses(
        address[] calldata donors
    ) external onlyOwner {
        for (uint256 i = 0; i < donors.length; i++) {
            address donor = donors[i];
            if (donor != address(0) && !verifiedAddresses[donor]) {
                verifiedAddresses[donor] = true;
                emit VerificationStatusChanged(donor, true);
            }
        }
    }

    // ============ Getter Functions ============

    /**
     * @notice Check if an address can contribute (alias for checkEligibility)
     * @param donor Address to check
     * @return True if eligible to contribute
     */
    function canContribute(address donor) external view returns (bool) {
        return checkEligibility(donor);
    }

    /**
     * @notice Get time remaining until next contribution allowed
     * @param donor Address to check
     * @return timeRemaining Time in seconds until next contribution (0 if can contribute now)
     */
    function timeUntilNextContribution(
        address donor
    ) external view returns (uint256 timeRemaining) {
        if (verifiedAddresses[donor]) {
            return 0; // Verified addresses have no cooldown
        }

        uint256 lastTime = lastContributionTime[donor];
        if (lastTime == 0) {
            return 0; // First time contributor
        }

        uint256 nextAllowedTime = lastTime + cooldownPeriod;
        if (block.timestamp >= nextAllowedTime) {
            return 0; // Cooldown elapsed
        }

        return nextAllowedTime - block.timestamp;
    }

    /**
     * @notice Check if an address is verified
     * @param donor Address to check
     * @return True if address is verified
     */
    function isVerified(address donor) external view returns (bool) {
        return verifiedAddresses[donor];
    }

    /**
     * @notice Get the current cooldown period
     * @return Period in seconds
     */
    function getCooldownPeriod() external view returns (uint256) {
        return cooldownPeriod;
    }

    /**
     * @notice Get the last contribution timestamp for an address
     * @param donor Address to check
     * @return timestamp Last contribution time (0 if never contributed)
     */
    function getLastContributionTime(
        address donor
    ) external view returns (uint256 timestamp) {
        return lastContributionTime[donor];
    }
}
