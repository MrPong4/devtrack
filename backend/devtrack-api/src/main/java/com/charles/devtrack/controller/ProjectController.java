
package com.charles.devtrack.controller;

import com.charles.devtrack.entity.Project;
import com.charles.devtrack.service.ProjectService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:5173")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // Create a project for the logged-in user
    @PostMapping
    public Project createProject(
            @RequestBody Project project,
            Authentication authentication) {

        return projectService.createProject(
                project,
                authentication.getName()
        );
    }

    // Get projects belonging to the logged-in user
    @GetMapping
    public List<Project> getAllProjects(Authentication authentication) {

        return projectService.getAllProjects(authentication.getName());
    }

    // Get a specific project belonging to the logged-in user
    @GetMapping("/{id}")
    public Project getProjectById(
            @PathVariable Long id,
            Authentication authentication) {

        return projectService.getProjectById(id, authentication.getName())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    // Update a project belonging to the logged-in user
    @PutMapping("/{id}")
    public Project updateProject(
            @PathVariable Long id,
            @RequestBody Project project,
            Authentication authentication) {

        return projectService.updateProject(
                id,
                project,
                authentication.getName()
        );
    }

    // Delete a project belonging to the logged-in user
    @DeleteMapping("/{id}")
    public void deleteProject(
            @PathVariable Long id,
            Authentication authentication) {

        projectService.deleteProject(id, authentication.getName());
    }
}
