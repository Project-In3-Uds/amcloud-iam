package cm.amcloud.platform.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RealmRequest {
    @NotBlank(message = "Le nom du Realm ne peut pas être vide")
    @Size(min = 3, max = 255, message = "Le nom du Realm doit contenir entre 3 et 255 caractères")
    private String name;

    @Size(max = 500, message = "La description du Realm ne peut pas dépasser 500 caractères")
    private String description;
}
