// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ProjectRegistry.sol";

contract ProjectRegistryTest is Test {
    ProjectRegistry public registry;
    
    address public owner = address(this);
    address public project1 = address(0x1);
    address public project2 = address(0x2);
    address public project3 = address(0x3);
    
    event ProjectRegistered(address indexed projectAddress, string name, uint256 timestamp);
    event ProjectUpdated(address indexed projectAddress, string name);
    event ProjectStatusChanged(address indexed projectAddress, bool isActive);
    event ProjectRemoved(address indexed projectAddress);
    
    function setUp() public {
        registry = new ProjectRegistry();
    }
    
    function testConstructor() public view {
        assertEq(registry.owner(), owner);
        assertEq(registry.getProjectCount(), 0);
    }
    
    function testRegisterProject() public {
        vm.expectEmit(true, false, false, false);
        emit ProjectRegistered(project1, "Project 1", block.timestamp);
        
        registry.registerProject(
            project1,
            "Project 1",
            "Description 1",
            "ipfs://metadata1"
        );
        
        assertTrue(registry.isProjectRegistered(project1));
        assertTrue(registry.isProjectActive(project1));
        assertEq(registry.getProjectCount(), 1);
    }
    
    function testRegisterProjectRevertsZeroAddress() public {
        vm.expectRevert("ProjectRegistry: zero address");
        registry.registerProject(address(0), "Project", "Desc", "URI");
    }
    
    function testRegisterProjectRevertsEmptyName() public {
        vm.expectRevert("ProjectRegistry: empty name");
        registry.registerProject(project1, "", "Desc", "URI");
    }
    
    function testRegisterProjectRevertsAlreadyRegistered() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        vm.expectRevert("ProjectRegistry: already registered");
        registry.registerProject(project1, "Project 1 Again", "Desc", "URI");
    }
    
    function testRegisterProjectOnlyOwner() public {
        vm.prank(project1);
        vm.expectRevert();
        registry.registerProject(project2, "Project", "Desc", "URI");
    }
    
    function testGetProject() public {
        registry.registerProject(
            project1,
            "Project 1",
            "Description 1",
            "ipfs://metadata1"
        );
        
        ProjectRegistry.Project memory proj = registry.getProject(project1);
        
        assertEq(proj.projectAddress, project1);
        assertEq(proj.name, "Project 1");
        assertEq(proj.description, "Description 1");
        assertEq(proj.metadataURI, "ipfs://metadata1");
        assertTrue(proj.isActive);
        assertEq(proj.registeredAt, block.timestamp);
    }
    
    function testGetProjectRevertsNotRegistered() public {
        vm.expectRevert("ProjectRegistry: not registered");
        registry.getProject(project1);
    }
    
    function testUpdateProject() public {
        registry.registerProject(project1, "Project 1", "Desc 1", "URI 1");
        
        vm.expectEmit(true, false, false, true);
        emit ProjectUpdated(project1, "Project 1 Updated");
        
        registry.updateProject(
            project1,
            "Project 1 Updated",
            "Desc Updated",
            "URI Updated"
        );
        
        ProjectRegistry.Project memory proj = registry.getProject(project1);
        assertEq(proj.name, "Project 1 Updated");
        assertEq(proj.description, "Desc Updated");
        assertEq(proj.metadataURI, "URI Updated");
    }
    
    function testUpdateProjectRevertsNotRegistered() public {
        vm.expectRevert("ProjectRegistry: not registered");
        registry.updateProject(project1, "Project 1", "Desc", "URI");
    }
    
    function testUpdateProjectRevertsEmptyName() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        vm.expectRevert("ProjectRegistry: empty name");
        registry.updateProject(project1, "", "Desc", "URI");
    }
    
    function testUpdateProjectOnlyOwner() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        vm.prank(project1);
        vm.expectRevert();
        registry.updateProject(project1, "Updated", "Desc", "URI");
    }
    
    function testToggleProjectStatus() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        assertTrue(registry.isProjectActive(project1));
        
        vm.expectEmit(true, false, false, true);
        emit ProjectStatusChanged(project1, false);
        
        registry.toggleProjectStatus(project1);
        
        assertFalse(registry.isProjectActive(project1));
        
        registry.toggleProjectStatus(project1);
        
        assertTrue(registry.isProjectActive(project1));
    }
    
    function testToggleProjectStatusRevertsNotRegistered() public {
        vm.expectRevert("ProjectRegistry: not registered");
        registry.toggleProjectStatus(project1);
    }
    
    function testToggleProjectStatusOnlyOwner() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        vm.prank(project1);
        vm.expectRevert();
        registry.toggleProjectStatus(project1);
    }
    
    function testRemoveProject() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        registry.registerProject(project2, "Project 2", "Desc", "URI");
        
        assertEq(registry.getProjectCount(), 2);
        
        vm.expectEmit(true, false, false, false);
        emit ProjectRemoved(project1);
        
        registry.removeProject(project1);
        
        assertEq(registry.getProjectCount(), 1);
        assertFalse(registry.isProjectRegistered(project1));
        assertTrue(registry.isProjectRegistered(project2));
    }
    
    function testRemoveProjectRevertsNotRegistered() public {
        vm.expectRevert("ProjectRegistry: not registered");
        registry.removeProject(project1);
    }
    
    function testRemoveProjectOnlyOwner() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        
        vm.prank(project1);
        vm.expectRevert();
        registry.removeProject(project1);
    }
    
    function testGetAllProjects() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        registry.registerProject(project2, "Project 2", "Desc", "URI");
        registry.registerProject(project3, "Project 3", "Desc", "URI");
        
        address[] memory projects = registry.getAllProjects();
        
        assertEq(projects.length, 3);
        assertEq(projects[0], project1);
        assertEq(projects[1], project2);
        assertEq(projects[2], project3);
    }
    
    function testGetActiveProjects() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        registry.registerProject(project2, "Project 2", "Desc", "URI");
        registry.registerProject(project3, "Project 3", "Desc", "URI");
        
        // Deactivate project2
        registry.toggleProjectStatus(project2);
        
        address[] memory activeProjects = registry.getActiveProjects();
        
        assertEq(activeProjects.length, 2);
        assertEq(activeProjects[0], project1);
        assertEq(activeProjects[1], project3);
    }
    
    function testGetActiveProjectsEmpty() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        registry.toggleProjectStatus(project1);
        
        address[] memory activeProjects = registry.getActiveProjects();
        assertEq(activeProjects.length, 0);
    }
    
    function testBatchRegisterProjects() public {
        address[] memory projects = new address[](3);
        projects[0] = project1;
        projects[1] = project2;
        projects[2] = project3;
        
        string[] memory names = new string[](3);
        names[0] = "Project 1";
        names[1] = "Project 2";
        names[2] = "Project 3";
        
        string[] memory descriptions = new string[](3);
        descriptions[0] = "Desc 1";
        descriptions[1] = "Desc 2";
        descriptions[2] = "Desc 3";
        
        string[] memory uris = new string[](3);
        uris[0] = "URI 1";
        uris[1] = "URI 2";
        uris[2] = "URI 3";
        
        registry.batchRegisterProjects(projects, names, descriptions, uris);
        
        assertEq(registry.getProjectCount(), 3);
        assertTrue(registry.isProjectActive(project1));
        assertTrue(registry.isProjectActive(project2));
        assertTrue(registry.isProjectActive(project3));
    }
    
    function testBatchRegisterProjectsRevertsLengthMismatch() public {
        address[] memory projects = new address[](2);
        string[] memory names = new string[](3);
        string[] memory descriptions = new string[](2);
        string[] memory uris = new string[](2);
        
        vm.expectRevert("ProjectRegistry: array length mismatch");
        registry.batchRegisterProjects(projects, names, descriptions, uris);
    }
    
    function testGetProjectName() public {
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        assertEq(registry.getProjectName(project1), "Project 1");
    }
    
    function testGetProjectDescription() public {
        registry.registerProject(project1, "Project 1", "Description", "URI");
        assertEq(registry.getProjectDescription(project1), "Description");
    }
    
    function testGetProjectMetadataURI() public {
        registry.registerProject(project1, "Project 1", "Desc", "ipfs://test");
        assertEq(registry.getProjectMetadataURI(project1), "ipfs://test");
    }
    
    function testGetProjectRegisteredAt() public {
        uint256 registrationTime = block.timestamp;
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        assertEq(registry.getProjectRegisteredAt(project1), registrationTime);
    }
    
    function testIsProjectActive() public {
        assertFalse(registry.isProjectActive(project1));
        
        registry.registerProject(project1, "Project 1", "Desc", "URI");
        assertTrue(registry.isProjectActive(project1));
        
        registry.toggleProjectStatus(project1);
        assertFalse(registry.isProjectActive(project1));
    }
}

