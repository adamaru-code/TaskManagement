package com.example.taskmanagement;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    int countByStatus(String status);
}
