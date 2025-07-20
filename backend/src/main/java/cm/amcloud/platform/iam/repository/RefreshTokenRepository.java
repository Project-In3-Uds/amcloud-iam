package cm.amcloud.platform.iam.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository; // Import User

import cm.amcloud.platform.iam.model.RefreshToken;
import cm.amcloud.platform.iam.model.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUserIdAndRevokedAtIsNull(Long userId);
    // Supprime tous les tokens de rafraîchissement pour un utilisateur donné
    void deleteByUser(User user); 
}
