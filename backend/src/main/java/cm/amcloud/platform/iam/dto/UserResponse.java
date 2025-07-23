package cm.amcloud.platform.iam.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String status;
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private Set<String> roles; // Noms des rôles
    private Set<String> permissions; // Noms des permissions (scopes)
    private Long realmId; // <-- NOUVEAU
    private String realmName; // <-- NOUVEAU
}
