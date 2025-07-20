package cm.amcloud.platform.iam.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Gère les exceptions de compte verrouillé
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<String> handleAccountLockedException(AccountLockedException ex, WebRequest request) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.UNAUTHORIZED); // 401 Unauthorized
    }

    // Gère les exceptions d'identifiants invalides
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<String> handleInvalidCredentialsException(InvalidCredentialsException ex, WebRequest request) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.UNAUTHORIZED); // 401 Unauthorized
    }

    // Gère les exceptions d'arguments invalides (ex: validation de mot de passe, utilisateur/email existant)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST); // 400 Bad Request
    }

    // Gère toutes les autres RuntimeException non spécifiquement traitées
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex, WebRequest request) {
        // Log l'exception pour le débogage côté serveur
        ex.printStackTrace();
        return new ResponseEntity<>("Une erreur inattendue est survenue: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
    }

    // Gère les exceptions génériques
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGlobalException(Exception ex, WebRequest request) {
        // Log l'exception pour le débogage côté serveur
        ex.printStackTrace();
        return new ResponseEntity<>("Une erreur inattendue est survenue.", HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
    }
}
