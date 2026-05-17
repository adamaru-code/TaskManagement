package com.example.taskmanagement;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskService taskService;

  @GetMapping
  public List<TaskResponse> list() {
    return taskService.list();
  }

  @PostMapping
  public ResponseEntity<TaskResponse> create(@Valid @RequestBody TaskCreateRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(request));
  }

  @PutMapping("/{id}")
  public TaskResponse update(@PathVariable Long id, @Valid @RequestBody TaskUpdateRequest request) {
    return taskService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    taskService.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/reorder")
  public ResponseEntity<Void> reorder(@Valid @RequestBody TaskReorderRequest request) {
    taskService.reorder(request);
    return ResponseEntity.noContent().build();
  }
}
