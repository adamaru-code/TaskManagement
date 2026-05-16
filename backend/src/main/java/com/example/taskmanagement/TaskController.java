package com.example.taskmanagement;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;

    @GetMapping
    public List<Task> list() {
        return taskRepository.findAll(Sort.by("status").ascending().and(Sort.by("displayOrder").ascending()));
    }

    @PostMapping
    public ResponseEntity<Task> create(@Valid @RequestBody TaskCreateRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Task task = new Task(
            null,
            request.getTitle(),
            request.getDescription(),
            request.getPriority(),
            request.getDueDate(),
            "todo",
            taskRepository.countByStatus("todo"),
            now,
            now
        );
        Task saved = taskRepository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody TaskUpdateRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setUpdatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }
}
