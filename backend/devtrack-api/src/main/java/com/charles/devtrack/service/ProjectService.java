
package com.charles.devtrack.service;

import com.charles.devtrack.entity.Project;
import com.charles.devtrack.entity.User;
import com.charles.devtrack.repository.ProjectRepository;
import com.charles.devtrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public Project createProject(Project project, String email) {

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        project.setOwner(owner);

        return projectRepository.save(project);
    }

    public List<Project> getAllProjects(String email) {
        return projectRepository.findAllByOwnerEmail(email);
    }

    public Optional<Project> getProjectById(Long id, String email) {
        return projectRepository.findByIdAndOwnerEmail(id, email);
    }

    public Project updateProject(
            Long id,
            Project updatedProject,
            String email) {

        Project project = projectRepository.findByIdAndOwnerEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setName(updatedProject.getName());
        project.setDescription(updatedProject.getDescription());

        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Long id, String email) {

        Project project = projectRepository.findByIdAndOwnerEmail(id, email)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        projectRepository.delete(project);
    }
}
