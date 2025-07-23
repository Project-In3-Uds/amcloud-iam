package cm.amcloud.platform.iam.controller;

import cm.amcloud.platform.iam.dto.UserRequest;
import cm.amcloud.platform.iam.dto.UserResponse;
import cm.amcloud.platform.iam.dto.UserRoleAssignmentRequest;
import cm.amcloud.platform.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/admin/realms/{realmId}/users") // Endpoint pour la gestion des utilisateurs par Realm
public class RealmUserManagementController {

    private final UserService userService;

    public RealmUserManagementController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Crée un nouvel utilisateur dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Utilisateur créé avec succès",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides ou utilisateur existant"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> createUserInRealm(
            @PathVariable Long realmId,
            @Valid @RequestBody UserRequest userRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (userRequest.getRealmId() == null || !userRequest.getRealmId().equals(realmId)) {
            userRequest.setRealmId(realmId); // Définir le realmId à partir du chemin si absent ou incorrect
        }
        UserResponse newUser = userService.createUser(userRequest);
        return new ResponseEntity<>(newUser, HttpStatus.CREATED);
    }

    @Operation(summary = "Récupère tous les utilisateurs d'un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des utilisateurs récupérée avec succès",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsersByRealm(@PathVariable Long realmId) {
        List<UserResponse> users = userService.getAllUsersByRealm(realmId);
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Récupère un utilisateur spécifique dans un Realm (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Utilisateur trouvé",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> getUserInRealmById(
            @PathVariable Long realmId,
            @PathVariable Long userId) {
        UserResponse user = userService.getUserById(userId);
        // Vérifier que l'utilisateur appartient bien au Realm spécifié
        if (!user.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("L'utilisateur avec l'ID " + userId + " n'appartient pas au Realm " + realmId);
        }
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Met à jour un utilisateur dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Utilisateur mis à jour avec succès",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> updateUserInRealm(
            @PathVariable Long realmId,
            @PathVariable Long userId,
            @Valid @RequestBody UserRequest userRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (userRequest.getRealmId() == null || !userRequest.getRealmId().equals(realmId)) {
            userRequest.setRealmId(realmId);
        }
        UserResponse updatedUser = userService.updateUser(userId, userRequest);
        // Vérifier que l'utilisateur mis à jour appartient toujours au Realm spécifié
        if (!updatedUser.getRealmId().equals(realmId)) {
            throw new IllegalStateException("Le Realm de l'utilisateur a été modifié de manière inattendue.");
        }
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Supprime un utilisateur dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Utilisateur supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Utilisateur ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteUserInRealm(
            @PathVariable Long realmId,
            @PathVariable Long userId) {
        UserResponse userToDelete = userService.getUserById(userId);
        if (!userToDelete.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("L'utilisateur avec l'ID " + userId + " n'appartient pas au Realm " + realmId + " et ne peut pas être supprimé via cet endpoint.");
        }
        userService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Attribue des rôles à un utilisateur dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rôles attribués avec succès",
                    content = @Content(schema = @Schema(implementation = UserResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Utilisateur, rôle ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping("/{userId}/assign-roles")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserResponse> assignRolesToUserInRealm(
            @PathVariable Long realmId,
            @PathVariable Long userId,
            @Valid @RequestBody UserRoleAssignmentRequest request) {
        UserResponse user = userService.getUserById(userId);
        if (!user.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("L'utilisateur avec l'ID " + userId + " n'appartient pas au Realm " + realmId + ".");
        }
        UserResponse updatedUser = userService.assignRolesToUser(userId, request);
        return ResponseEntity.ok(updatedUser);
    }
}
