package cm.amcloud.platform.iam.controller;

import cm.amcloud.platform.iam.dto.RoleRequest;
import cm.amcloud.platform.iam.dto.RoleResponse;
import cm.amcloud.platform.iam.dto.RolePermissionAssignmentRequest;
import cm.amcloud.platform.iam.service.RoleService;
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
@RequestMapping("/v1/admin/realms/{realmId}/roles") // Endpoint pour la gestion des rôles par Realm
public class RealmRoleManagementController {

    private final RoleService roleService;

    public RealmRoleManagementController(RoleService roleService) {
        this.roleService = roleService;
    }

    @Operation(summary = "Crée un nouveau rôle dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Rôle créé avec succès",
                    content = @Content(schema = @Schema(implementation = RoleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides ou rôle existant dans le Realm"),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> createRoleInRealm(
            @PathVariable Long realmId,
            @Valid @RequestBody RoleRequest roleRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (roleRequest.getRealmId() == null || !roleRequest.getRealmId().equals(realmId)) {
            roleRequest.setRealmId(realmId); // Définir le realmId à partir du chemin si absent ou incorrect
        }
        RoleResponse newRole = roleService.createRole(roleRequest);
        return new ResponseEntity<>(newRole, HttpStatus.CREATED);
    }

    @Operation(summary = "Récupère tous les rôles d'un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des rôles récupérée avec succès",
                    content = @Content(schema = @Schema(implementation = RoleResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé")
    })
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<RoleResponse>> getAllRolesByRealm(@PathVariable Long realmId) {
        List<RoleResponse> roles = roleService.getAllRolesByRealm(realmId);
        return ResponseEntity.ok(roles);
    }

    @Operation(summary = "Récupère un rôle spécifique dans un Realm (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rôle trouvé",
                    content = @Content(schema = @Schema(implementation = RoleResponse.class))),
            @ApiResponse(responseCode = "404", description = "Rôle ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping("/{roleId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> getRoleInRealmById(
            @PathVariable Long realmId,
            @PathVariable Long roleId) {
        RoleResponse role = roleService.getRoleById(roleId);
        // Vérifier que le rôle appartient bien au Realm spécifié
        if (!role.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("Le rôle avec l'ID " + roleId + " n'appartient pas au Realm " + realmId);
        }
        return ResponseEntity.ok(role);
    }

    @Operation(summary = "Met à jour un rôle dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rôle mis à jour avec succès",
                    content = @Content(schema = @Schema(implementation = RoleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Rôle ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PutMapping("/{roleId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> updateRoleInRealm(
            @PathVariable Long realmId,
            @PathVariable Long roleId,
            @Valid @RequestBody RoleRequest roleRequest) {
        // S'assurer que le realmId de la requête correspond au realmId du chemin
        if (roleRequest.getRealmId() == null || !roleRequest.getRealmId().equals(realmId)) {
            roleRequest.setRealmId(realmId);
        }
        RoleResponse updatedRole = roleService.updateRole(roleId, roleRequest);
        // Vérifier que le rôle mis à jour appartient toujours au Realm spécifié
        if (!updatedRole.getRealmId().equals(realmId)) {
            throw new IllegalStateException("Le Realm du rôle a été modifié de manière inattendue.");
        }
        return ResponseEntity.ok(updatedRole);
    }

    @Operation(summary = "Supprime un rôle dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Rôle supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Rôle ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @DeleteMapping("/{roleId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRoleInRealm(
            @PathVariable Long realmId,
            @PathVariable Long roleId) {
        RoleResponse roleToDelete = roleService.getRoleById(roleId);
        if (!roleToDelete.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("Le rôle avec l'ID " + roleId + " n'appartient pas au Realm " + realmId + " et ne peut pas être supprimé via cet endpoint.");
        }
        roleService.deleteRole(roleId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Attribue des permissions à un rôle dans un Realm spécifique (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permissions attribuées avec succès",
                    content = @Content(schema = @Schema(implementation = RoleResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Rôle, permission ou Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping("/{roleId}/assign-permissions")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RoleResponse> assignPermissionsToRoleInRealm(
            @PathVariable Long realmId,
            @PathVariable Long roleId,
            @Valid @RequestBody RolePermissionAssignmentRequest request) {
        RoleResponse role = roleService.getRoleById(roleId);
        if (!role.getRealmId().equals(realmId)) {
            throw new IllegalArgumentException("Le rôle avec l'ID " + roleId + " n'appartient pas au Realm " + realmId + ".");
        }
        RoleResponse updatedRole = roleService.assignPermissionsToRole(roleId, request);
        return ResponseEntity.ok(updatedRole);
    }
}
