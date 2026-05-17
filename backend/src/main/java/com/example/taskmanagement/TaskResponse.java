package com.example.taskmanagement;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(
    Long id,
    String title,
    String description,
    String priority,
    LocalDate dueDate,
    String status,
    Integer displayOrder,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {

  public static TaskResponse from(Task t) {
    return new TaskResponse(
        t.getId(),
        t.getTitle(),
        t.getDescription(),
        t.getPriority(),
        t.getDueDate(),
        t.getStatus(),
        t.getDisplayOrder(),
        t.getCreatedAt(),
        t.getUpdatedAt());
  }
}
