package cm.amcloud.platform.iam.controller;

import cm.amcloud.platform.iam.dto.PermissionRequest;
import cm.amcloud.platform.iam.dto.PermissionResponse;
import cm.amcloud.platform.iam.service.PermissionService;
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
@RequestMapping("/v1/admin/realms/{realmId}/permissions") // Endpoint pour la gestion des permissions par Realm
public class RealmPermissionManagementController {

    private final PermissionService permissionService;

    public RealmPermissionManagementController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Operation(summary = "Crée une nouvelle permission dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Permission créée avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides ou permission existante dans le Realm"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> createPermissionInRealm(
            @PathVariable Long realmId,
            @Valid @RequestBody PermissionRequest permissionRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (permissionRequest.getRealmId() == null || !permissionRequest.getRealmId().equals(realmId)) {
            permissionRequest.setRealmId(realmId); // Définir le realmId à partir du chemin si absent ou incorrect
        }
        PermissionResponse newPermission = permissionService.createPermission(permissionRequest);
        return new ResponseEntity<>(newPermission, HttpStatus.CREATED);
    }

    @Operation(summary = "Récupère toutes les permissions d'un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des permissions récupérée avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<PermissionResponse>> getAllPermissionsByRealm(@PathVariable Long realmId) {
        List<PermissionResponse> permissions = permissionService.getAllPermissionsByRealm(realmId);
        return ResponseEntity.ok(permissions);
    }

    @Operation(summary = "Récupère une permission spécifique dans un Realm (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission trouvée",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Permission ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping("/{permissionId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> getPermissionInRealmById(
            @PathVariable Long realmId,
            @PathVariable Long permissionId) {
        PermissionResponse permission = permissionService.getPermissionById(permissionId);
        // Vérifier que la permission appartient bien au Realm spécifié
        if (!permission.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("La permission avec l'ID " + permissionId + " n'appartient pas au Realm " + realmId);
        }
        return ResponseEntity.ok(permission);
    }

    @Operation(summary = "Met à jour une permission dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission mise à jour avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Permission ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PutMapping("/{permissionId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> updatePermissionInRealm(
            @PathVariable Long realmId,
            @PathVariable Long permissionId,
            @Valid @RequestBody PermissionRequest permissionRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (permissionRequest.getRealmId() == null || !permissionRequest.getRealmId().equals(realmId)) {
            permissionRequest.setRealmId(realmId);
        }
        PermissionResponse updatedPermission = permissionService.updatePermission(permissionId, permissionRequest);
        // Vérifier que la permission mise à jour appartient toujours au Realm spécifié
        if (!updatedPermission.getRealmId().equals(realmId)) {
            throw new IllegalStateException("Le Realm de la permission a été modifié de manière inattendue.");
        }
        return ResponseEntity.ok(updatedPermission);
    }

    @Operation(summary = "Supprime une permission dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Permission supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Permission ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @DeleteMapping("/{permissionId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deletePermissionInRealm(
            @PathVariable Long realmId,
            @PathVariable Long permissionId) {
        PermissionResponse permissionToDelete = permissionService.getPermissionById(permissionId);
        if (!permissionToDelete.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("La permission avec l'ID " + permissionId + " n'appartient pas au Realm " + realmId + " et ne peut pas être supprimée via cet endpoint.");
        }
        permissionService.deletePermission(permissionId);
        return ResponseEntity.noContent().build();
    }
}
