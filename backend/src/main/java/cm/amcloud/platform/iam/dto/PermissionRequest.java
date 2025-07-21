package cm.amcloud.platform.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PermissionRequest {
    @NotBlank(message = "Le nom de la permission ne peut pas être vide")
    @Size(min = 3, max = 255, message = "Le nom de la permission doit contenir entre 3 et 255 caractères")
    private String name;

    @NotBlank(message = "La valeur du scope ne peut pas être vide")
    @Size(min = 1, max = 255, message = "La valeur du scope doit contenir entre 1 et 255 caractères")
    private String scopeValue;

    @Size(max = 500, message = "La description de la permission ne peut pas dépasser 500 caractères")
    private String description;
}
