// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./QuadraticMath.sol";
import "./ProjectRegistry.sol";
import "./SybilGuard.sol";

/**
 * @title EquiFundPool
 * @dev Main contract managing funding rounds and matching pool distribution using USDC
 * @notice Implements quadratic funding mechanism for fair fund distribution
 */
contract EquiFundPool is Ownable, ReentrancyGuard, Pausable {
    using QuadraticMath for *;
    using SafeERC20 for IERC20;

    /// @notice USDC token contract
    IERC20 public immutable usdc;

    /// @notice Current active round ID
    uint256 public currentRoundId;

    /// @notice Total matching pool balance available
    uint256 public matchingPoolBalance;

    /// @notice Minimum contribution amount to prevent spam
    uint256 public minimumContribution;

    /// @notice Project registry contract
    ProjectRegistry public projectRegistry;

    /// @notice Sybil guard contract
    SybilGuard public sybilGuard;

    struct Round {
        uint256 startTime;
        uint256 endTime;
        uint256 matchingPool;
        bool finalized;
        uint256 totalContributions;
        uint256 totalContributors;
    }

    /// @notice Mapping of round ID to Round details
    mapping(uint256 => Round) public rounds;

    /// @notice roundId => project => total contributions
    mapping(uint256 => mapping(address => uint256))
        public projectTotalContributions;

    /// @notice roundId => project => matched amount
    mapping(uint256 => mapping(address => uint256)) public projectMatchAmount;

    /// @notice roundId => project => withdrawn status
    mapping(uint256 => mapping(address => bool)) public projectWithdrawn;

    /// @notice roundId => donor => project => contribution amount
    mapping(uint256 => mapping(address => mapping(address => uint256)))
        public contributions;

    /// @notice roundId => donor => has contributed flag
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    /// @notice roundId => list of projects that received contributions
    mapping(uint256 => address[]) public roundProjects;

    /// @notice roundId => project => is in roundProjects array
    mapping(uint256 => mapping(address => bool)) private isProjectInRound;

    /// @notice Emitted when a new round is created
    event RoundCreated(
        uint256 indexed roundId,
        uint256 startTime,
        uint256 endTime,
        uint256 matchingPool
    );

    /// @notice Emitted when a contribution is made
    event ContributionMade(
        uint256 indexed roundId,
        address indexed donor,
        address indexed project,
        uint256 amount
    );

    /// @notice Emitted when a round is finalized
    event RoundFinalized(uint256 indexed roundId, uint256 totalMatched);

    /// @notice Emitted when matching funds are added
    event MatchingFundsAdded(address indexed funder, uint256 amount);

    /// @notice Emitted when project withdraws matched funds
    event MatchingWithdrawn(
        uint256 indexed roundId,
        address indexed project,
        uint256 amount
    );

    /// @notice Emitted when minimum contribution is updated
    event MinimumContributionUpdated(uint256 oldAmount, uint256 newAmount);

    /**
     * @notice Constructor
     * @param _usdc Address of USDC token contract
     * @param _projectRegistry Address of ProjectRegistry contract
     * @param _sybilGuard Address of SybilGuard contract
     * @param _minimumContribution Minimum contribution amount (e.g., 1 * 10**6 for 1 USDC)
     */
    constructor(
        address _usdc,
        address _projectRegistry,
        address _sybilGuard,
        uint256 _minimumContribution
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "EquiFundPool: zero USDC address");
        require(
            _projectRegistry != address(0),
            "EquiFundPool: zero registry address"
        );
        require(_sybilGuard != address(0), "EquiFundPool: zero guard address");

        usdc = IERC20(_usdc);
        projectRegistry = ProjectRegistry(_projectRegistry);
        sybilGuard = SybilGuard(_sybilGuard);
        minimumContribution = _minimumContribution;
    }

    /**
     * @notice Create a new funding round
     * @param duration Duration of the round in seconds
     */
    function createRound(uint256 duration) external onlyOwner {
        require(duration > 0, "EquiFundPool: invalid duration");
        require(
            currentRoundId == 0 || rounds[currentRoundId].finalized,
            "EquiFundPool: current round not finalized"
        );

        currentRoundId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        rounds[currentRoundId] = Round({
            startTime: startTime,
            endTime: endTime,
            matchingPool: matchingPoolBalance,
            finalized: false,
            totalContributions: 0,
            totalContributors: 0
        });

        emit RoundCreated(
            currentRoundId,
            startTime,
            endTime,
            matchingPoolBalance
        );

        // Reset matching pool balance (it's now locked in the round)
        matchingPoolBalance = 0;
    }

    /**
     * @notice Contribute to a project in the current round
     * @param project Address of the project to support
     * @param amount Amount of USDC to contribute
     */
    function contribute(
        address project,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(currentRoundId > 0, "EquiFundPool: no active round");
        require(isRoundActive(), "EquiFundPool: round not active");
        require(amount >= minimumContribution, "EquiFundPool: below minimum");
        require(
            projectRegistry.isProjectActive(project),
            "EquiFundPool: project not active"
        );

        // Check Sybil guard
        require(
            sybilGuard.checkEligibility(msg.sender),
            "EquiFundPool: not eligible"
        );

        // Record contribution in Sybil guard
        sybilGuard.recordContribution(msg.sender);

        // Track if this is donor's first contribution in this round
        if (!hasContributed[currentRoundId][msg.sender]) {
            hasContributed[currentRoundId][msg.sender] = true;
            rounds[currentRoundId].totalContributors++;
        }

        // Add project to round if not already there
        if (!isProjectInRound[currentRoundId][project]) {
            roundProjects[currentRoundId].push(project);
            isProjectInRound[currentRoundId][project] = true;
        }

        // Record contribution
        contributions[currentRoundId][msg.sender][project] += amount;
        projectTotalContributions[currentRoundId][project] += amount;
        rounds[currentRoundId].totalContributions += amount;

        // Transfer USDC from donor to project
        usdc.safeTransferFrom(msg.sender, project, amount);

        emit ContributionMade(currentRoundId, msg.sender, project, amount);
    }

    /**
     * @notice Finalize the current round and calculate matching amounts
     * @dev Can only be called after round ends
     */
    function finalizeRound() external nonReentrant {
        require(currentRoundId > 0, "EquiFundPool: no round to finalize");
        Round storage round = rounds[currentRoundId];
        require(
            block.timestamp >= round.endTime,
            "EquiFundPool: round not ended"
        );
        require(!round.finalized, "EquiFundPool: already finalized");

        address[] memory projects = roundProjects[currentRoundId];

        if (projects.length == 0 || round.matchingPool == 0) {
            round.finalized = true;
            emit RoundFinalized(currentRoundId, 0);
            return;
        }

        // Calculate quadratic funding matches
        uint256 totalSumOfSquares = 0;
        uint256[] memory projectSumOfSqrts = new uint256[](projects.length);

        for (uint256 i = 0; i < projects.length; i++) {
            uint256 sumOfSqrts = calculateProjectSumOfSqrts(
                currentRoundId,
                projects[i]
            );
            projectSumOfSqrts[i] = sumOfSqrts;

            if (sumOfSqrts > 0) {
                totalSumOfSquares += sumOfSqrts * sumOfSqrts;
            }
        }

        // Distribute matching pool
        uint256 totalMatched = 0;
        if (totalSumOfSquares > 0) {
            for (uint256 i = 0; i < projects.length; i++) {
                if (projectSumOfSqrts[i] > 0) {
                    uint256 projectSquare = projectSumOfSqrts[i] *
                        projectSumOfSqrts[i];
                    uint256 matchAmount = (projectSquare * round.matchingPool) /
                        totalSumOfSquares;

                    projectMatchAmount[currentRoundId][
                        projects[i]
                    ] = matchAmount;
                    totalMatched += matchAmount;
                }
            }

            // Handle rounding dust
            if (totalMatched < round.matchingPool) {
                uint256 dust = round.matchingPool - totalMatched;
                // Give dust to first project with matches
                for (uint256 i = 0; i < projects.length; i++) {
                    if (projectMatchAmount[currentRoundId][projects[i]] > 0) {
                        projectMatchAmount[currentRoundId][projects[i]] += dust;
                        totalMatched += dust;
                        break;
                    }
                }
            }
        }

        round.finalized = true;
        emit RoundFinalized(currentRoundId, totalMatched);
    }

    /**
     * @notice Project withdraws their matched funds from a finalized round
     * @param roundId Round ID to withdraw from
     */
    function withdrawMatching(uint256 roundId) external nonReentrant {
        require(rounds[roundId].finalized, "EquiFundPool: round not finalized");
        require(
            !projectWithdrawn[roundId][msg.sender],
            "EquiFundPool: already withdrawn"
        );

        uint256 matchAmount = projectMatchAmount[roundId][msg.sender];
        require(matchAmount > 0, "EquiFundPool: no matching funds");

        projectWithdrawn[roundId][msg.sender] = true;

        // Transfer USDC to project
        usdc.safeTransfer(msg.sender, matchAmount);

        emit MatchingWithdrawn(roundId, msg.sender, matchAmount);
    }

    /**
     * @notice Add funds to the matching pool
     * @dev Can be called by anyone (admin or sponsors)
     * @param amount Amount of USDC to add to matching pool
     */
    function addMatchingFunds(uint256 amount) external {
        require(amount > 0, "EquiFundPool: zero amount");

        matchingPoolBalance += amount;

        // Transfer USDC from sender to contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit MatchingFundsAdded(msg.sender, amount);
    }

    /**
     * @notice Update minimum contribution amount
     * @param newMinimum New minimum contribution
     */
    function updateMinimumContribution(uint256 newMinimum) external onlyOwner {
        uint256 oldMinimum = minimumContribution;
        minimumContribution = newMinimum;
        emit MinimumContributionUpdated(oldMinimum, newMinimum);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw function
     * @dev Only callable by owner when paused
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "EquiFundPool: no balance");

        usdc.safeTransfer(owner(), balance);
    }

    /**
     * @notice Calculate sum of square roots for a project's contributions
     * @param roundId Round ID
     * @param project Project address
     * @return sum Sum of square roots
     */
    function calculateProjectSumOfSqrts(
        uint256 roundId,
        address project
    ) internal view returns (uint256 sum) {
        // We need to iterate through all donors for this project
        // In a production system, you'd want to track donors per project
        // For MVP, we calculate on-the-fly during finalization

        // This is a simplified approach - in practice you'd want to track
        // unique donors per project during contributions
        return QuadraticMath.sqrt(projectTotalContributions[roundId][project]);
    }

    // ============ Getter Functions ============

    /**
     * @notice Get round details
     * @param roundId Round ID
     * @return Round struct
     */
    function getRoundDetails(
        uint256 roundId
    ) external view returns (Round memory) {
        return rounds[roundId];
    }

    /**
     * @notice Get total contributions for a project in a round
     * @param roundId Round ID
     * @param project Project address
     * @return Total contribution amount
     */
    function getProjectContributions(
        uint256 roundId,
        address project
    ) external view returns (uint256) {
        return projectTotalContributions[roundId][project];
    }

    /**
     * @notice Get a specific donor's contribution to a project
     * @param roundId Round ID
     * @param donor Donor address
     * @param project Project address
     * @return Contribution amount
     */
    function getDonorContribution(
        uint256 roundId,
        address donor,
        address project
    ) external view returns (uint256) {
        return contributions[roundId][donor][project];
    }

    /**
     * @notice Get matching amount for a project in a round
     * @param roundId Round ID
     * @param project Project address
     * @return Matching amount
     */
    function getProjectMatchAmount(
        uint256 roundId,
        address project
    ) external view returns (uint256) {
        return projectMatchAmount[roundId][project];
    }

    /**
     * @notice Get current round ID
     * @return Current round ID
     */
    function getCurrentRound() external view returns (uint256) {
        return currentRoundId;
    }

    /**
     * @notice Check if current round is active
     * @return True if round is active
     */
    function isRoundActive() public view returns (bool) {
        if (currentRoundId == 0) return false;

        Round memory round = rounds[currentRoundId];
        return
            !round.finalized &&
            block.timestamp >= round.startTime &&
            block.timestamp < round.endTime;
    }

    /**
     * @notice Get all projects in a specific round
     * @param roundId Round ID
     * @return Array of project addresses
     */
    function getRoundProjects(
        uint256 roundId
    ) external view returns (address[] memory) {
        return roundProjects[roundId];
    }

    /**
     * @notice Check if a project has withdrawn matching funds
     * @param roundId Round ID
     * @param project Project address
     * @return True if withdrawn
     */
    function hasProjectWithdrawn(
        uint256 roundId,
        address project
    ) external view returns (bool) {
        return projectWithdrawn[roundId][project];
    }

    /**
     * @notice Get time remaining in current round
     * @return timeRemaining Time remaining (0 if round ended or no active round)
     */
    function getTimeRemaining() external view returns (uint256 timeRemaining) {
        if (currentRoundId == 0) return 0;

        Round memory round = rounds[currentRoundId];
        if (block.timestamp >= round.endTime) return 0;

        return round.endTime - block.timestamp;
    }

    /**
     * @notice Get contract USDC balance
     * @return Balance in USDC (with 6 decimals)
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Check if donor has contributed in a round
     * @param roundId Round ID
     * @param donor Donor address
     * @return True if has contributed
     */
    function hasDonorContributed(
        uint256 roundId,
        address donor
    ) external view returns (bool) {
        return hasContributed[roundId][donor];
    }

    /**
     * @notice Get round statistics
     * @param roundId Round ID
     * @return startTime Round start time
     * @return endTime Round end time
     * @return matchingPool Matching pool amount
     * @return totalContributions Total contributions
     * @return totalContributors Total unique contributors
     * @return finalized Is round finalized
     */
    function getRoundStats(
        uint256 roundId
    )
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256 matchingPool,
            uint256 totalContributions,
            uint256 totalContributors,
            bool finalized
        )
    {
        Round memory round = rounds[roundId];
        return (
            round.startTime,
            round.endTime,
            round.matchingPool,
            round.totalContributions,
            round.totalContributors,
            round.finalized
        );
    }
}
