package cm.amcloud.platform.iam.repository;

import cm.amcloud.platform.iam.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
}
