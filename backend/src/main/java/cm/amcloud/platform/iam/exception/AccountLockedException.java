package cm.amcloud.platform.iam.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Exception pour un compte verrouillé
@ResponseStatus(HttpStatus.UNAUTHORIZED) // Renvoie un statut 401 Unauthorized
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) {
        super(message);
    }
}


