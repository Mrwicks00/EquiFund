// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing and development
 * @notice Mimics USDC with 6 decimals
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    /**
     * @notice Constructor
     * @dev Mints initial supply to deployer
     */
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1 million USDC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }
    
    /**
     * @notice Override decimals to return 6 (like real USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @notice Mint new tokens (only owner can mint)
     * @param to Address to mint to
     * @param amount Amount to mint (in token units, not wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Faucet function for testing - anyone can claim 1000 USDC
     * @dev Useful for local development and testing
     */
    function faucet() external {
        require(
            balanceOf(msg.sender) < 10_000 * 10**DECIMALS,
            "MockUSDC: already have enough tokens"
        );
        _mint(msg.sender, 1_000 * 10**DECIMALS); // 1000 USDC
    }
    
    /**
     * @notice Batch mint to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            recipients.length == amounts.length,
            "MockUSDC: array length mismatch"
        );
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}

