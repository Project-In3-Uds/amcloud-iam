package cm.amcloud.platform.iam.dto;

import java.util.Set;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UserRoleAssignmentRequest {
    @NotEmpty(message = "La liste des noms de rôles ne peut pas être vide")
    private Set<String> roleNames;
}
