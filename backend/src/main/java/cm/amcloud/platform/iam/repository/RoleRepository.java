package cm.amcloud.platform.iam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.Role;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
