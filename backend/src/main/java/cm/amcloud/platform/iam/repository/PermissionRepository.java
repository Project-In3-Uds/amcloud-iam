package cm.amcloud.platform.iam.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.Permission;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
}
