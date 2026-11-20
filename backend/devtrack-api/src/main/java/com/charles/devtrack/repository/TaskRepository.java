
package com.charles.devtrack.repository;

import com.charles.devtrack.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findAllByProjectOwnerEmail(String email);

    Optional<Task> findByIdAndProjectOwnerEmail(Long id, String email);
}
