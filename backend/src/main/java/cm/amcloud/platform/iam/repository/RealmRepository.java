package cm.amcloud.platform.iam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.Realm;

public interface RealmRepository extends JpaRepository<Realm, Long> {
    Optional<Realm> findByName(String name);
}
