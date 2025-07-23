package cm.amcloud.platform.iam.dto;

public class AuthResponse {
    private String accessToken;
    private Long userId; // Nouveau champ pour l'ID de l'utilisateur

    public AuthResponse(String accessToken, Long userId) { // Constructeur mis à jour
        this.accessToken = accessToken;
        this.userId = userId;
    }

    // Getter pour accessToken
    public String getAccessToken() {
        return accessToken;
    }

    // Setter pour accessToken (optionnel)
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    // Getter pour userId
    public Long getUserId() {
        return userId;
    }

    // Setter pour userId (optionnel)
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
