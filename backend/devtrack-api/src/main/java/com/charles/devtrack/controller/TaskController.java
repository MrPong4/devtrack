
package com.charles.devtrack.controller;

import com.charles.devtrack.entity.Task;
import com.charles.devtrack.service.TaskService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // Create a task under a project owned by the logged-in user
    @PostMapping("/project/{projectId}")
    public Task createTask(
            @PathVariable Long projectId,
            @RequestBody Task task,
            Authentication authentication) {

        return taskService.createTask(
                projectId,
                task,
                authentication.getName()
        );
    }

    // Get all tasks belonging to the logged-in user
    @GetMapping
    public List<Task> getAllTasks(Authentication authentication) {

        return taskService.getAllTasks(authentication.getName());
    }

    // Get tasks for a project owned by the logged-in user
    @GetMapping("/project/{projectId}")
    public List<Task> getTasksByProject(
            @PathVariable Long projectId,
            Authentication authentication) {

        return taskService.getTasksByProject(
                projectId,
                authentication.getName()
        );
    }

    // Update a task belonging to the logged-in user
    @PutMapping("/{id}")
    public Task updateTask(
            @PathVariable Long id,
            @RequestBody Task task,
            Authentication authentication) {

        return taskService.updateTask(
                id,
                task,
                authentication.getName()
        );
    }

    // Delete a task belonging to the logged-in user
    @DeleteMapping("/{id}")
    public void deleteTask(
            @PathVariable Long id,
            Authentication authentication) {

        taskService.deleteTask(id, authentication.getName());
    }
}
