package cm.amcloud.platform.iam.service;

import cm.amcloud.platform.iam.dto.RoleRequest;
import cm.amcloud.platform.iam.dto.RoleResponse;
import cm.amcloud.platform.iam.dto.RolePermissionAssignmentRequest; // Import for assignment DTO
import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.model.Role;
import cm.amcloud.platform.iam.repository.PermissionRepository;
import cm.amcloud.platform.iam.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository; // Pour associer les permissions

    public RoleService(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    /**
     * Crée un nouveau rôle.
     *
     * @param request Les détails du rôle à créer.
     * @return Le RoleResponse du rôle créé.
     * @throws IllegalArgumentException si le nom du rôle existe déjà.
     */
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Le rôle avec le nom '" + request.getName() + "' existe déjà.");
        }

        Role newRole = new Role();
        newRole.setName(request.getName());
        newRole.setDescription(request.getDescription());

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissionNames() != null && !request.getPermissionNames().isEmpty()) {
            for (String permName : request.getPermissionNames()) {
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
     * Récupère tous les rôles.
     *
     * @return Une liste de RoleResponse.
     */
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::convertToRoleResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour un rôle existant.
     *
     * @param id L'ID du rôle à mettre à jour.
     * @param request Les nouvelles informations du rôle.
     * @return Le RoleResponse du rôle mis à jour.
     * @throws IllegalArgumentException si le rôle n'est pas trouvé ou si le nom est déjà pris.
     */
    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role existingRole = roleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle non trouvé avec l'ID: " + id));

        // Vérifier si le nouveau nom est déjà pris par un autre rôle
        if (request.getName() != null && !request.getName().equals(existingRole.getName())) {
            if (roleRepository.findByName(request.getName()).isPresent()) {
                throw new IllegalArgumentException("Le nom de rôle '" + request.getName() + "' est déjà utilisé par un autre rôle.");
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
