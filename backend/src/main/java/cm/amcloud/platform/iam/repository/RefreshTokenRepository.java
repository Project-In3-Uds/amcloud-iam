package cm.amcloud.platform.iam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cm.amcloud.platform.iam.model.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    // Trouver un token de rafraîchissement actif pour un utilisateur (non révoqué)
    Optional<RefreshToken> findByUserIdAndRevokedAtIsNull(Long userId);
 }
