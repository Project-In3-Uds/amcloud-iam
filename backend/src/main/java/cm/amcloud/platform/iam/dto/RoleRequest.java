package cm.amcloud.platform.iam.dto;

import java.util.Set;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RoleRequest {
    @NotBlank(message = "Le nom du rôle ne peut pas être vide")
    @Size(min = 3, max = 255, message = "Le nom du rôle doit contenir entre 3 et 255 caractères")
    private String name;

    @Size(max = 500, message = "La description du rôle ne peut pas dépasser 500 caractères")
    private String description;

    // Pour l'attribution des permissions à un rôle lors de sa création/mise à jour
    private Set<String> permissionNames;
}
