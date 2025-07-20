package cm.amcloud.platform.iam.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.PasswordResetToken;
import cm.amcloud.platform.iam.model.User;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUser(User user); // To check for existing tokens for a user
    void deleteByExpiresAtBefore(LocalDateTime now); // To clean up expired tokens
    void deleteByUser(User user); // To delete all tokens for a user (e.g., on password change)
}
