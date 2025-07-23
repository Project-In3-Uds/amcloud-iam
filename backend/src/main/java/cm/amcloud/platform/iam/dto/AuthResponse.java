package cm.amcloud.platform.iam.dto;

public class AuthResponse {
    private String accessToken; // Renamed from 'token' for clarity
    // private String refreshToken; // Supprimé

    public AuthResponse(String accessToken) { // Constructeur mis à jour
        this.accessToken = accessToken;
    }

    // Getter
    public String getAccessToken() {
        return accessToken;
    }

    // Setter (optional, if you need to modify after creation, but usually DTOs are immutable)
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    // Supprimé: getRefreshToken()
    // Supprimé: setRefreshToken()
}
