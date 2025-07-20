package cm.amcloud.platform.iam.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
}
