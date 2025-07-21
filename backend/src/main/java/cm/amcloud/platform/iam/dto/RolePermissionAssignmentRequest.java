package cm.amcloud.platform.iam.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class RolePermissionAssignmentRequest {
    @NotEmpty(message = "La liste des noms de permissions ne peut pas être vide")
    private Set<String> permissionNames;
}
