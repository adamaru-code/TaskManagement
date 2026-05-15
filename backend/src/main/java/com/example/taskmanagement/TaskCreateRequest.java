package com.example.taskmanagement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TaskCreateRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String title;

    @Size(max = 200)
    private String description;

    @NotBlank
    @Pattern(regexp = "high|medium|low")
    private String priority;

    private LocalDate dueDate;
}
