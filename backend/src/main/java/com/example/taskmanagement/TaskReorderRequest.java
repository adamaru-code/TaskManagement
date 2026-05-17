package com.example.taskmanagement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TaskReorderRequest {

  @NotEmpty @Valid private List<Item> items;

  @Getter
  @Setter
  @NoArgsConstructor
  public static class Item {

    @NotNull private Long id;

    @NotNull
    @Pattern(regexp = "todo|in-progress|done")
    private String status;

    @NotNull @PositiveOrZero private Integer displayOrder;
  }
}
