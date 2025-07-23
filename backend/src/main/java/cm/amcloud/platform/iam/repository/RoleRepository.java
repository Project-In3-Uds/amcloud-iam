package cm.amcloud.platform.iam.repository;

import cm.amcloud.platform.iam.model.Realm;
import cm.amcloud.platform.iam.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List; // Import List
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
    List<Role> findByRealm(Realm realm); // <-- NOUVEAU
    Optional<Role> findByNameAndRealm(String name, Realm realm); // Utile pour la validation d'unicité par Realm
}
