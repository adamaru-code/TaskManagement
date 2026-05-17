package com.example.taskmanagement;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TaskService {

  private final TaskRepository taskRepository;

  @Transactional(readOnly = true)
  public List<TaskResponse> list() {
    return taskRepository
        .findAll(Sort.by("status").ascending().and(Sort.by("displayOrder").ascending()))
        .stream()
        .map(TaskResponse::from)
        .toList();
  }

  @Transactional
  public TaskResponse create(TaskCreateRequest request) {
    LocalDateTime now = LocalDateTime.now();
    Task task =
        new Task(
            null,
            request.getTitle(),
            request.getDescription(),
            request.getPriority(),
            request.getDueDate(),
            "todo",
            taskRepository.countByStatus("todo"),
            now,
            now);
    return TaskResponse.from(taskRepository.save(task));
  }

  @Transactional
  public TaskResponse update(Long id, TaskUpdateRequest request) {
    Task task =
        taskRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    task.setTitle(request.getTitle());
    task.setDescription(request.getDescription());
    task.setPriority(request.getPriority());
    task.setDueDate(request.getDueDate());
    task.setUpdatedAt(LocalDateTime.now());
    return TaskResponse.from(taskRepository.save(task));
  }

  @Transactional
  public void delete(Long id) {
    Task task =
        taskRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    taskRepository.delete(task);
  }

  @Transactional
  public void reorder(TaskReorderRequest request) {
    List<Long> ids = request.getItems().stream().map(TaskReorderRequest.Item::getId).toList();
    List<Task> tasks = taskRepository.findAllById(ids);
    if (tasks.size() != ids.size()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Some tasks not found");
    }
    Map<Long, Task> byId = new HashMap<>();
    tasks.forEach(t -> byId.put(t.getId(), t));
    LocalDateTime now = LocalDateTime.now();
    for (TaskReorderRequest.Item item : request.getItems()) {
      Task task = byId.get(item.getId());
      task.setStatus(item.getStatus());
      task.setDisplayOrder(item.getDisplayOrder());
      task.setUpdatedAt(now);
    }
    taskRepository.saveAll(tasks);
  }
}
