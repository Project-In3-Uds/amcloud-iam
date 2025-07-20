package cm.amcloud.platform.iam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.EmailVerificationToken;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findByUserId(Long userId); 
}
