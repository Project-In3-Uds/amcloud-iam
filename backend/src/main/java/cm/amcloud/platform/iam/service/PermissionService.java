package cm.amcloud.platform.iam.service;

import cm.amcloud.platform.iam.dto.PermissionRequest;
import cm.amcloud.platform.iam.dto.PermissionResponse;
import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.model.Realm; // Import Realm
import cm.amcloud.platform.iam.repository.PermissionRepository;
import cm.amcloud.platform.iam.repository.RealmRepository; // Import RealmRepository
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final RealmRepository realmRepository; // <-- NOUVEAU

    public PermissionService(PermissionRepository permissionRepository, RealmRepository realmRepository) { // <-- NOUVEAU
        this.permissionRepository = permissionRepository;
        this.realmRepository = realmRepository; // <-- NOUVEAU
    }

    /**
     * Crée une nouvelle permission et l'associe à un Realm.
     *
     * @param request Les détails de la permission à créer, incluant l'ID du Realm.
     * @return Le PermissionResponse de la permission créée.
     * @throws IllegalArgumentException si le nom ou la valeur du scope existe déjà dans le Realm, ou si le Realm n'est pas trouvé.
     */
    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        Realm targetRealm = realmRepository.findById(request.getRealmId())
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + request.getRealmId()));

        if (permissionRepository.findByNameAndRealm(request.getName(), targetRealm).isPresent()) { // <-- CHANGEMENT : Vérification par Realm
            throw new IllegalArgumentException("La permission avec le nom '" + request.getName() + "' existe déjà dans le Realm '" + targetRealm.getName() + "'.");
        }
        if (permissionRepository.findByScopeValueAndRealm(request.getScopeValue(), targetRealm).isPresent()) { // <-- CHANGEMENT : Vérification par Realm
            throw new IllegalArgumentException("La permission avec la valeur de scope '" + request.getScopeValue() + "' existe déjà dans le Realm '" + targetRealm.getName() + "'.");
        }

        Permission newPermission = new Permission();
        newPermission.setName(request.getName());
        newPermission.setScopeValue(request.getScopeValue());
        newPermission.setDescription(request.getDescription());
        newPermission.setRealm(targetRealm); // <-- NOUVEAU : Associer la permission au Realm

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
     * Récupère toutes les permissions. (Cette méthode pourrait être supprimée ou limitée aux super-admins si toutes les permissions sont Realm-scoped)
     *
     * @return Une liste de PermissionResponse.
     */
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::convertToPermissionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les permissions d'un Realm spécifique.
     *
     * @param realmId L'ID du Realm.
     * @return Une liste de PermissionResponse pour le Realm donné.
     * @throws IllegalArgumentException si le Realm n'est pas trouvé.
     */
    public List<PermissionResponse> getAllPermissionsByRealm(Long realmId) { // <-- NOUVEAU
        Realm realm = realmRepository.findById(realmId)
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + realmId));
        return permissionRepository.findByRealm(realm).stream()
                .map(this::convertToPermissionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour une permission existante.
     *
     * @param id L'ID de la permission à mettre à jour.
     * @param request Les nouvelles informations de la permission.
     * @return Le PermissionResponse de la permission mise à jour.
     * @throws IllegalArgumentException si la permission n'est pas trouvée ou si le nom/scope est déjà pris dans le même Realm.
     */
    @Transactional
    public PermissionResponse updatePermission(Long id, PermissionRequest request) {
        Permission existingPermission = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permission non trouvée avec l'ID: " + id));

        // Le Realm d'une permission ne doit pas être changé via cette méthode.
        if (request.getRealmId() != null && !request.getRealmId().equals(existingPermission.getRealm().getId())) {
            throw new IllegalArgumentException("Le Realm d'une permission ne peut pas être modifié via cette API.");
        }

        // Vérifier si le nouveau nom est déjà pris par une autre permission dans le MÊME Realm
        if (request.getName() != null && !request.getName().equals(existingPermission.getName())) {
            if (permissionRepository.findByNameAndRealm(request.getName(), existingPermission.getRealm()).isPresent()) { // <-- CHANGEMENT
                throw new IllegalArgumentException("Le nom de permission '" + request.getName() + "' est déjà utilisé par une autre permission dans ce Realm.");
            }
            existingPermission.setName(request.getName());
        }

        // Vérifier si la nouvelle valeur de scope est déjà prise par une autre permission dans le MÊME Realm
        if (request.getScopeValue() != null && !request.getScopeValue().equals(existingPermission.getScopeValue())) {
            if (permissionRepository.findByScopeValueAndRealm(request.getScopeValue(), existingPermission.getRealm()).isPresent()) { // <-- CHANGEMENT
                throw new IllegalArgumentException("La valeur de scope '" + request.getScopeValue() + "' est déjà utilisée par une autre permission dans ce Realm.");
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
        
        // TODO: Implémenter la logique de suppression en cascade ou de gestion des dépendances
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
        response.setRealmId(permission.getRealm().getId()); // <-- NOUVEAU
        response.setRealmName(permission.getRealm().getName()); // <-- NOUVEAU
        return response;
    }
}
