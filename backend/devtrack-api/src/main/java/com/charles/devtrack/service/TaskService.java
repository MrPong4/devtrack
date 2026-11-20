
package com.charles.devtrack.service;

import com.charles.devtrack.entity.Project;
import com.charles.devtrack.entity.Task;
import com.charles.devtrack.repository.ProjectRepository;
import com.charles.devtrack.repository.TaskRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public TaskService(
            TaskRepository taskRepository,
            ProjectRepository projectRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
    }

    // Create a task only inside a project owned by the logged-in user
    public Task createTask(Long projectId, Task task, String email) {

        Project project = projectRepository
                .findByIdAndOwnerEmail(projectId, email)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        task.setProject(project);

        return taskRepository.save(task);
    }

    // Get all tasks belonging to the logged-in user
    public List<Task> getAllTasks(String email) {
        return taskRepository.findAllByProjectOwnerEmail(email);
    }

    // Get tasks from a project owned by the logged-in user
    public List<Task> getTasksByProject(Long projectId, String email) {

        Project project = projectRepository
                .findByIdAndOwnerEmail(projectId, email)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        return taskRepository.findByProjectId(project.getId());
    }

    // Update only a task belonging to the logged-in user
    public Task updateTask(Long id, Task updatedTask, String email) {

        Task task = taskRepository
                .findByIdAndProjectOwnerEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(updatedTask.getTitle());
        task.setDescription(updatedTask.getDescription());
        task.setPriority(updatedTask.getPriority());
        task.setStatus(updatedTask.getStatus());
        task.setDueDate(updatedTask.getDueDate());

        return taskRepository.save(task);
    }

    // Delete only a task belonging to the logged-in user
    @Transactional
    public void deleteTask(Long id, String email) {

        Task task = taskRepository
                .findByIdAndProjectOwnerEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        taskRepository.delete(task);
    }
}
