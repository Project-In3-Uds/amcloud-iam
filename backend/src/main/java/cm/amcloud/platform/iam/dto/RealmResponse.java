package cm.amcloud.platform.iam.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RealmResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
