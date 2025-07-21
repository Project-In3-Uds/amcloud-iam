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

import cm.amcloud.platform.iam.dto.RealmRequest;
import cm.amcloud.platform.iam.dto.RealmResponse;
import cm.amcloud.platform.iam.service.RealmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/admin/realms") // Endpoint pour la gestion des Realms par l'administrateur
public class RealmController {

    private final RealmService realmService;

    public RealmController(RealmService realmService) {
        this.realmService = realmService;
    }

    @Operation(summary = "Crée un nouveau Realm (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Realm créé avec succès",
                    content = @Content(schema = @Schema(implementation = RealmResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides ou Realm existant"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RealmResponse> createRealm(@Valid @RequestBody RealmRequest request) {
        RealmResponse newRealm = realmService.createRealm(request);
        return new ResponseEntity<>(newRealm, HttpStatus.CREATED);
    }

    @Operation(summary = "Récupère un Realm par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Realm trouvé",
                    content = @Content(schema = @Schema(implementation = RealmResponse.class))),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RealmResponse> getRealmById(@PathVariable Long id) {
        RealmResponse realm = realmService.getRealmById(id);
        return ResponseEntity.ok(realm);
    }

    @Operation(summary = "Récupère tous les Realms (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des Realms récupérée avec succès",
                    content = @Content(schema = @Schema(implementation = RealmResponse.class))),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<RealmResponse>> getAllRealms() {
        List<RealmResponse> realms = realmService.getAllRealms();
        return ResponseEntity.ok(realms);
    }

    @Operation(summary = "Met à jour un Realm par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Realm mis à jour avec succès",
                    content = @Content(schema = @Schema(implementation = RealmResponse.class))),
            @ApiResponse(responseCode = "400", description = "Données d'entrée invalides"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<RealmResponse> updateRealm(@PathVariable Long id, @Valid @RequestBody RealmRequest request) {
        RealmResponse updatedRealm = realmService.updateRealm(id, request);
        return ResponseEntity.ok(updatedRealm);
    }

    @Operation(summary = "Supprime un Realm par ID (ADMIN seulement)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Realm supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Realm non trouvé"),
            @ApiResponse(responseCode = "403", description = "Accès refusé")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteRealm(@PathVariable Long id) {
        realmService.deleteRealm(id);
        return ResponseEntity.noContent().build();
    }
}
