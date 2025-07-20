package cm.amcloud.platform.iam.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Exception pour des identifiants invalides
@ResponseStatus(HttpStatus.UNAUTHORIZED) // Renvoie un statut 401 Unauthorized
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}