package cm.amcloud.platform.iam.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cm.amcloud.platform.iam.dto.PermissionRequest;
import cm.amcloud.platform.iam.dto.PermissionResponse;
import cm.amcloud.platform.iam.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Operation(summary = "Crée une nouvelle permission (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Permission créée avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides ou permission existante"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> createPermission(@Valid @RequestBody PermissionRequest request) {
        PermissionResponse newPermission = permissionService.createPermission(request);
        return new ResponseEntity<>(newPermission, HttpStatus.CREATED);
    }

    @Operation(summary = "Récupère une permission par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission trouvée",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "404", description = "Permission non trouvée"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> getPermissionById(@PathVariable Long id) {
        PermissionResponse permission = permissionService.getPermissionById(id);
        return ResponseEntity.ok(permission);
    }

    @Operation(summary = "Récupère toutes les permissions (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des permissions récupérée avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        List<PermissionResponse> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }

    @Operation(summary = "Met à jour une permission par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission mise à jour avec succès",
                    content = @Content(schema = @Schema(implementation = PermissionResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Permission non trouvée"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<PermissionResponse> updatePermission(@PathVariable Long id, @Valid @RequestBody PermissionRequest request) {
        PermissionResponse updatedPermission = permissionService.updatePermission(id, request);
        return ResponseEntity.ok(updatedPermission);
    }

    @Operation(summary = "Supprime une permission par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Permission supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Permission non trouvée"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }
}
