package cm.amcloud.platform.iam.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.Realm;
import cm.amcloud.platform.iam.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    // Find all users belonging to a specific Realm
    List<User> findByRealm(Realm realm); // <-- NOUVEAU


}
