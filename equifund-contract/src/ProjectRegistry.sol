// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectRegistry
 * @dev Manages whitelist of eligible projects for funding rounds
 * @notice Only admin can add/remove/update projects
 */
contract ProjectRegistry is Ownable {
    struct Project {
        address projectAddress;
        string name;
        string description;
        string metadataURI;
        bool isActive;
        uint256 registeredAt;
    }

    /// @notice Mapping from project address to project details
    mapping(address => Project) public projects;

    /// @notice Array of all registered project addresses
    address[] public projectList;

    /// @notice Mapping to track if address is in projectList (for efficiency)
    mapping(address => bool) private isInList;

    /// @notice Emitted when a new project is registered
    event ProjectRegistered(
        address indexed projectAddress,
        string name,
        uint256 timestamp
    );

    /// @notice Emitted when a project is updated
    event ProjectUpdated(address indexed projectAddress, string name);

    /// @notice Emitted when a project's active status changes
    event ProjectStatusChanged(address indexed projectAddress, bool isActive);

    /// @notice Emitted when a project is removed
    event ProjectRemoved(address indexed projectAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new project
     * @param projectAddr Address of the project (where funds will be sent)
     * @param name Project name
     * @param description Brief description
     * @param metadataURI URI to additional project metadata (IPFS, etc.)
     */
    function registerProject(
        address projectAddr,
        string calldata name,
        string calldata description,
        string calldata metadataURI
    ) external onlyOwner {
        require(projectAddr != address(0), "ProjectRegistry: zero address");
        require(bytes(name).length > 0, "ProjectRegistry: empty name");
        require(!isInList[projectAddr], "ProjectRegistry: already registered");

        projects[projectAddr] = Project({
            projectAddress: projectAddr,
            name: name,
            description: description,
            metadataURI: metadataURI,
            isActive: true,
            registeredAt: block.timestamp
        });

        projectList.push(projectAddr);
        isInList[projectAddr] = true;

        emit ProjectRegistered(projectAddr, name, block.timestamp);
    }

    /**
     * @notice Update an existing project's information
     * @param projectAddr Project address to update
     * @param name New name
     * @param description New description
     * @param metadataURI New metadata URI
     */
    function updateProject(
        address projectAddr,
        string calldata name,
        string calldata description,
        string calldata metadataURI
    ) external onlyOwner {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        require(bytes(name).length > 0, "ProjectRegistry: empty name");

        Project storage project = projects[projectAddr];
        project.name = name;
        project.description = description;
        project.metadataURI = metadataURI;

        emit ProjectUpdated(projectAddr, name);
    }

    /**
     * @notice Toggle a project's active status
     * @param projectAddr Project address to toggle
     */
    function toggleProjectStatus(address projectAddr) external onlyOwner {
        require(isInList[projectAddr], "ProjectRegistry: not registered");

        Project storage project = projects[projectAddr];
        project.isActive = !project.isActive;

        emit ProjectStatusChanged(projectAddr, project.isActive);
    }

    /**
     * @notice Remove a project from the registry
     * @dev This removes from mapping and array
     * @param projectAddr Project address to remove
     */
    function removeProject(address projectAddr) external onlyOwner {
        require(isInList[projectAddr], "ProjectRegistry: not registered");

        // Remove from mapping
        delete projects[projectAddr];
        isInList[projectAddr] = false;

        // Remove from array (swap with last and pop)
        for (uint256 i = 0; i < projectList.length; i++) {
            if (projectList[i] == projectAddr) {
                projectList[i] = projectList[projectList.length - 1];
                projectList.pop();
                break;
            }
        }

        emit ProjectRemoved(projectAddr);
    }

    /**
     * @notice Batch register multiple projects
     * @param projectAddrs Array of project addresses
     * @param names Array of project names
     * @param descriptions Array of descriptions
     * @param metadataURIs Array of metadata URIs
     */
    function batchRegisterProjects(
        address[] calldata projectAddrs,
        string[] calldata names,
        string[] calldata descriptions,
        string[] calldata metadataURIs
    ) external onlyOwner {
        require(
            projectAddrs.length == names.length &&
                names.length == descriptions.length &&
                descriptions.length == metadataURIs.length,
            "ProjectRegistry: array length mismatch"
        );

        for (uint256 i = 0; i < projectAddrs.length; i++) {
            address projectAddr = projectAddrs[i];

            if (
                projectAddr != address(0) &&
                bytes(names[i]).length > 0 &&
                !isInList[projectAddr]
            ) {
                projects[projectAddr] = Project({
                    projectAddress: projectAddr,
                    name: names[i],
                    description: descriptions[i],
                    metadataURI: metadataURIs[i],
                    isActive: true,
                    registeredAt: block.timestamp
                });

                projectList.push(projectAddr);
                isInList[projectAddr] = true;

                emit ProjectRegistered(projectAddr, names[i], block.timestamp);
            }
        }
    }

    // ============ Getter Functions ============

    /**
     * @notice Get full project details
     * @param projectAddr Project address
     * @return project Project struct
     */
    function getProject(
        address projectAddr
    ) external view returns (Project memory project) {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        return projects[projectAddr];
    }

    /**
     * @notice Check if a project is active
     * @param projectAddr Project address
     * @return True if project is registered and active
     */
    function isProjectActive(address projectAddr) external view returns (bool) {
        return isInList[projectAddr] && projects[projectAddr].isActive;
    }

    /**
     * @notice Get all registered project addresses
     * @return Array of project addresses
     */
    function getAllProjects() external view returns (address[] memory) {
        return projectList;
    }

    /**
     * @notice Get all active project addresses
     * @return active Array of active project addresses
     */
    function getActiveProjects()
        external
        view
        returns (address[] memory active)
    {
        // First, count active projects
        uint256 activeCount = 0;
        for (uint256 i = 0; i < projectList.length; i++) {
            if (projects[projectList[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active projects
        active = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < projectList.length; i++) {
            if (projects[projectList[i]].isActive) {
                active[index] = projectList[i];
                index++;
            }
        }

        return active;
    }

    /**
     * @notice Get total number of registered projects
     * @return Total project count
     */
    function getProjectCount() external view returns (uint256) {
        return projectList.length;
    }

    /**
     * @notice Check if a project is registered (regardless of active status)
     * @param projectAddr Project address
     * @return True if registered
     */
    function isProjectRegistered(
        address projectAddr
    ) external view returns (bool) {
        return isInList[projectAddr];
    }

    /**
     * @notice Get project name
     * @param projectAddr Project address
     * @return name Project name
     */
    function getProjectName(
        address projectAddr
    ) external view returns (string memory name) {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        return projects[projectAddr].name;
    }

    /**
     * @notice Get project description
     * @param projectAddr Project address
     * @return description Project description
     */
    function getProjectDescription(
        address projectAddr
    ) external view returns (string memory description) {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        return projects[projectAddr].description;
    }

    /**
     * @notice Get project metadata URI
     * @param projectAddr Project address
     * @return uri Metadata URI
     */
    function getProjectMetadataURI(
        address projectAddr
    ) external view returns (string memory uri) {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        return projects[projectAddr].metadataURI;
    }

    /**
     * @notice Get project registration timestamp
     * @param projectAddr Project address
     * @return timestamp Registration time
     */
    function getProjectRegisteredAt(
        address projectAddr
    ) external view returns (uint256 timestamp) {
        require(isInList[projectAddr], "ProjectRegistry: not registered");
        return projects[projectAddr].registeredAt;
    }
}
