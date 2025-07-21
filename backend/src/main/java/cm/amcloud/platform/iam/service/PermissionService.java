package cm.amcloud.platform.iam.service;

import cm.amcloud.platform.iam.dto.PermissionRequest;
import cm.amcloud.platform.iam.dto.PermissionResponse;
import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.repository.PermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;

    public PermissionService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    /**
     * Crée une nouvelle permission.
     *
     * @param request Les détails de la permission à créer.
     * @return Le PermissionResponse de la permission créée.
     * @throws IllegalArgumentException si le nom ou la valeur du scope existe déjà.
     */
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("La permission avec le nom '" + request.getName() + "' existe déjà.");
        }
        if (permissionRepository.findByScopeValue(request.getScopeValue()).isPresent()) {
            throw new IllegalArgumentException("La permission avec la valeur de scope '" + request.getScopeValue() + "' existe déjà.");
        }

        Permission newPermission = new Permission();
        newPermission.setName(request.getName());
        newPermission.setScopeValue(request.getScopeValue());
        newPermission.setDescription(request.getDescription());

        Permission savedPermission = permissionRepository.save(newPermission);
        return convertToPermissionResponse(savedPermission);
    }

    /**
     * Récupère une permission par son ID.
     *
     * @param id L'ID de la permission.
     * @return Le PermissionResponse de la permission trouvée.
     * @throws IllegalArgumentException si la permission n'est pas trouvée.
     */
    public PermissionResponse getPermissionById(Long id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission non trouvée avec l'ID: " + id));
        return convertToPermissionResponse(permission);
    }

    /**
     * Récupère toutes les permissions.
     *
     * @return Une liste de PermissionResponse.
     */
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::convertToPermissionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour une permission existante.
     *
     * @param id L'ID de la permission à mettre à jour.
     * @param request Les nouvelles informations de la permission.
     * @return Le PermissionResponse de la permission mise à jour.
     * @throws IllegalArgumentException si la permission n'est pas trouvée ou si le nom/scope est déjà pris.
     */
    @Transactional
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Permission existingPermission = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission non trouvée avec l'ID: " + id));

        // Vérifier si le nouveau nom est déjà pris par une autre permission
        if (request.getName() != null && !request.getName().equals(existingPermission.getName())) {
            if (permissionRepository.findByName(request.getName()).isPresent()) {
                throw new IllegalArgumentException("Le nom de permission '" + request.getName() + "' est déjà utilisé par une autre permission.");
            }
            existingPermission.setName(request.getName());
        }

        // Vérifier si la nouvelle valeur de scope est déjà prise par une autre permission
        if (request.getScopeValue() != null && !request.getScopeValue().equals(existingPermission.getScopeValue())) {
            if (permissionRepository.findByScopeValue(request.getScopeValue()).isPresent()) {
                throw new IllegalArgumentException("La valeur de scope '" + request.getScopeValue() + "' est déjà utilisée par une autre permission.");
            }
            existingPermission.setScopeValue(request.getScopeValue());
        }

        if (request.getDescription() != null) {
            existingPermission.setDescription(request.getDescription());
        }

        Permission updatedPermission = permissionRepository.save(existingPermission);
        return convertToPermissionResponse(updatedPermission);
    }

    /**
     * Supprime une permission par son ID.
     *
     * @param id L'ID de la permission à supprimer.
     * @throws IllegalArgumentException si la permission n'est pas trouvée.
     */
    @Transactional
    public void deletePermission(Long id) {
        Permission permissionToDelete = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission non trouvée avec l'ID: " + id));
        
        // Avant de supprimer une permission, assurez-vous qu'elle n'est pas attribuée à des rôles.
        // Si vous avez des problèmes de contrainte de clé étrangère, vous devrez d'abord
        // supprimer les associations dans `role_permissions`.
        permissionRepository.delete(permissionToDelete);
    }

    /**
     * Convertit une entité Permission en PermissionResponse DTO.
     *
     * @param permission L'entité Permission à convertir.
     * @return Le PermissionResponse DTO.
     */
    private PermissionResponse convertToPermissionResponse(Permission permission) {
        PermissionResponse response = new PermissionResponse();
        response.setId(permission.getId());
        response.setName(permission.getName());
        response.setScopeValue(permission.getScopeValue());
        response.setDescription(permission.getDescription());
        return response;
    }
}
