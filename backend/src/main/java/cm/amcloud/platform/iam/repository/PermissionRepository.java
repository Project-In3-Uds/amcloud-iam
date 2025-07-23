package cm.amcloud.platform.iam.repository;

import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.model.Realm; // Import Realm
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List; // Import List
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    Optional<Permission> findByName(String name);
    Optional<Permission> findByScopeValue(String scopeValue);
    List<Permission> findByRealm(Realm realm); // <-- NOUVEAU
    Optional<Permission> findByNameAndRealm(String name, Realm realm); // Utile pour la validation d'unicité par Realm
    Optional<Permission> findByScopeValueAndRealm(String scopeValue, Realm realm); // Utile pour la validation d'unicité par Realm
}
