package cm.amcloud.platform.iam.dto;

import lombok.Data;
import java.util.Set;

@Data
public class RoleResponse {
    private Long id;
    private String name;
    private String description;
    private Set<String> permissionNames; // Noms des permissions associées
}
