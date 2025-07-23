package cm.amcloud.platform.iam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank(message = "Le nom d'utilisateur ne peut pas être vide")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;

    @NotBlank(message = "L'e-mail ne peut pas être vide")
    @Email(message = "Format d'e-mail invalide")
    @Size(max = 255, message = "L'e-mail ne peut pas dépasser 255 caractères")
    private String email;

    // Le mot de passe n'est requis que pour la création d'utilisateur, pas pour toutes les mises à jour
    // Il sera validé par PasswordValidationService
    private String password;

    // Le statut de l'utilisateur (par exemple, ACTIVE, PENDING_VERIFICATION, DISABLED)
    @Pattern(regexp = "ACTIVE|PENDING_VERIFICATION|DISABLED", message = "Le statut de l'utilisateur doit être ACTIVE, PENDING_VERIFICATION ou DISABLED")
    private String status;

    // Liste des noms de rôles à associer à l'utilisateur
    private java.util.Set<String> roles;

    // ID du Realm auquel l'utilisateur appartient (pour la création/mise à jour par l'admin)
    private Long realmId;
}
