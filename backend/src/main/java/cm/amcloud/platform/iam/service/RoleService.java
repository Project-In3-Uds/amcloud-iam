package cm.amcloud.platform.iam.service;

import cm.amcloud.platform.iam.dto.RoleRequest;
import cm.amcloud.platform.iam.dto.RoleResponse;
import cm.amcloud.platform.iam.dto.RolePermissionAssignmentRequest;
import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.model.Realm; // Import Realm
import cm.amcloud.platform.iam.model.Role;
import cm.amcloud.platform.iam.repository.PermissionRepository;
import cm.amcloud.platform.iam.repository.RealmRepository; // Import RealmRepository
import cm.amcloud.platform.iam.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime; // Import LocalDateTime
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RealmRepository realmRepository; // <-- NOUVEAU

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository, RealmRepository realmRepository) { // <-- NOUVEAU
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.realmRepository = realmRepository; // <-- NOUVEAU
    }

    /**
     * Crée un nouveau rôle et l'associe à un Realm.
     *
     * @param request Les détails du rôle à créer, incluant l'ID du Realm.
     * @return Le RoleResponse du rôle créé.
     * @throws IllegalArgumentException si le nom du rôle existe déjà dans le Realm, ou si le Realm n'est pas trouvé.
     */
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        Realm targetRealm = realmRepository.findById(request.getRealmId())
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + request.getRealmId()));

        if (roleRepository.findByNameAndRealm(request.getName(), targetRealm).isPresent()) { // <-- CHANGEMENT : Vérification par Realm
            throw new IllegalArgumentException("Le rôle avec le nom '" + request.getName() + "' existe déjà dans le Realm '" + targetRealm.getName() + "'.");
        }

        Role newRole = new Role();
        newRole.setName(request.getName());
        newRole.setDescription(request.getDescription());
        newRole.setRealm(targetRealm); // <-- NOUVEAU : Associer le rôle au Realm

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissionNames() != null && !request.getPermissionNames().isEmpty()) {
            for (String permName : request.getPermissionNames()) {
                // Pour l'instant, les permissions sont considérées comme globales ou vérifiées par nom
                // Une implémentation plus stricte pourrait nécessiter findByNameAndRealm(permName, targetRealm)
                permissionRepository.findByName(permName)
                        .ifPresentOrElse(permissions::add, () -> {
                            throw new IllegalArgumentException("La permission '" + permName + "' n'existe pas.");
                        });
            }
        }
        newRole.setPermissions(permissions);

        Role savedRole = roleRepository.save(newRole);
        return convertToRoleResponse(savedRole);
    }

    /**
     * Récupère un rôle par son ID.
     *
     * @param id L'ID du rôle.
     * @return Le RoleResponse du rôle trouvé.
     * @throws IllegalArgumentException si le rôle n'est pas trouvé.
     */
    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé avec l'ID: " + id));
        return convertToRoleResponse(role);
    }

    /**
     * Récupère tous les rôles. (Cette méthode pourrait être supprimée ou limitée aux super-admins si tous les rôles sont Realm-scoped)
     *
     * @return Une liste de RoleResponse.
     */
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::convertToRoleResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère tous les rôles d'un Realm spécifique.
     *
     * @param realmId L'ID du Realm.
     * @return Une liste de RoleResponse pour le Realm donné.
     * @throws IllegalArgumentException si le Realm n'est pas trouvé.
     */
    public List<RoleResponse> getAllRolesByRealm(Long realmId) { // <-- NOUVEAU
        Realm realm = realmRepository.findById(realmId)
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + realmId));
        return roleRepository.findByRealm(realm).stream()
                .map(this::convertToRoleResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour un rôle existant.
     *
     * @param id L'ID du rôle à mettre à jour.
     * @param request Les nouvelles informations du rôle.
     * @return Le RoleResponse du rôle mis à jour.
     * @throws IllegalArgumentException si le rôle n'est pas trouvé ou si le nom est déjà pris dans le même Realm.
     */
    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé avec l'ID: " + id));

        // Le Realm d'un rôle ne doit pas être changé via cette méthode.
        if (request.getRealmId() != null && !request.getRealmId().equals(existingRole.getRealm().getId())) {
            throw new IllegalArgumentException("Le Realm d'un rôle ne peut pas être modifié via cette API.");
        }

        // Vérifier si le nouveau nom est déjà pris par un autre rôle dans le MÊME Realm
        if (request.getName() != null && !request.getName().equals(existingRole.getName())) {
            if (roleRepository.findByNameAndRealm(request.getName(), existingRole.getRealm()).isPresent()) { // <-- CHANGEMENT
                throw new IllegalArgumentException("Le nom de rôle '" + request.getName() + "' est déjà utilisé par un autre rôle dans ce Realm.");
            }
            existingRole.setName(request.getName());
        }

        if (request.getDescription() != null) {
            existingRole.setDescription(request.getDescription());
        }

        // Mettre à jour les permissions si fournies
        if (request.getPermissionNames() != null) {
            Set<Permission> updatedPermissions = new HashSet<>();
            for (String permName : request.getPermissionNames()) {
                // Assurez-vous que les permissions existent.
                // Si les permissions sont aussi Realm-scoped, il faudrait vérifier findByNameAndRealm(permName, existingRole.getRealm())
                permissionRepository.findByName(permName)
                        .ifPresentOrElse(updatedPermissions::add, () -> {
                            throw new IllegalArgumentException("La permission '" + permName + "' n'existe pas.");
                        });
            }
            existingRole.setPermissions(updatedPermissions);
        }

        Role updatedRole = roleRepository.save(existingRole);
        return convertToRoleResponse(updatedRole);
    }

    /**
     * Supprime un rôle par son ID.
     *
     * @param id L'ID du rôle à supprimer.
     * @throws IllegalArgumentException si le rôle n'est pas trouvé.
     */
    @Transactional
    public void deleteRole(Long id) {
        Role roleToDelete = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé avec l'ID: " + id));
        
        // TODO: Implémenter la logique de suppression en cascade ou de gestion des dépendances
        // Avant de supprimer un rôle, assurez-vous qu'il n'est pas attribué à des utilisateurs
        // ou que les relations sont gérées en cascade. Pour l'instant, on suppose la gestion par la DB.
        // Si vous avez des problèmes de contrainte de clé étrangère, vous devrez d'abord
        // supprimer les associations dans `user_roles`.
        roleRepository.delete(roleToDelete);
    }

    /**
     * Attribue des permissions à un rôle.
     *
     * @param roleId L'ID du rôle.
     * @param request La requête contenant les noms des permissions à attribuer.
     * @return Le RoleResponse du rôle mis à jour.
     * @throws IllegalArgumentException si le rôle ou une permission n'est pas trouvé.
     */
    @Transactional
    public RoleResponse assignPermissionsToRole(Long roleId, RolePermissionAssignmentRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé avec l'ID: " + roleId));

        Set<Permission> permissionsToAssign = new HashSet<>();
        for (String permName : request.getPermissionNames()) {
            // Assurez-vous que les permissions existent.
            // Si les permissions sont aussi Realm-scoped, il faudrait vérifier findByNameAndRealm(permName, role.getRealm())
            permissionRepository.findByName(permName)
                    .ifPresentOrElse(permissionsToAssign::add, () -> {
                        throw new IllegalArgumentException("La permission '" + permName + "' n'existe pas.");
                    });
        }
        role.setPermissions(permissionsToAssign); // Remplace les permissions existantes
        Role updatedRole = roleRepository.save(role);
        return convertToRoleResponse(updatedRole);
    }

    /**
     * Convertit une entité Role en RoleResponse DTO.
     *
     * @param role L'entité Role à convertir.
     * @return Le RoleResponse DTO.
     */
    private RoleResponse convertToRoleResponse(Role role) {
        RoleResponse response = new RoleResponse();
        response.setId(role.getId());
        response.setName(role.getName());
        response.setDescription(role.getDescription());
        response.setRealmId(role.getRealm().getId()); // <-- NOUVEAU
        response.setRealmName(role.getRealm().getName()); // <-- NOUVEAU
        if (role.getPermissions() != null) {
            response.setPermissionNames(role.getPermissions().stream()
                    .map(Permission::getName)
                    .collect(Collectors.toSet()));
        } else {
            response.setPermissionNames(new HashSet<>());
        }
        return response;
    }
}
