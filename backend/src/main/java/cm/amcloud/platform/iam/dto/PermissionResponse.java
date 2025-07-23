package cm.amcloud.platform.iam.dto;

import lombok.Data;

@Data
public class PermissionResponse {
    private Long id;
    private String name;
    private String scopeValue;
    private String description;
    private Long realmId; // <-- NOUVEAU
    private String realmName; // <-- NOUVEAU
}
