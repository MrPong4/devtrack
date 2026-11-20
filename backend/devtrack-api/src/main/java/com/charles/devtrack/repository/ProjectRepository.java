
package com.charles.devtrack.repository;

import com.charles.devtrack.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwnerEmail(String email);

    Optional<Project> findByIdAndOwnerEmail(Long id, String email);
}
