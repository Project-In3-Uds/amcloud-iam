package cm.amcloud.platform.iam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PasswordValidationService {

    @Value("${password.policy.min-length:8}")
    private int minLength;

    @Value("${password.policy.require-uppercase:false}")
    private boolean requireUppercase;

    @Value("${password.policy.require-lowercase:false}")
    private boolean requireLowercase;

    @Value("${password.policy.require-digit:false}")
    private boolean requireDigit;

    @Value("${password.policy.require-special-char:false}")
    private boolean requireSpecialChar;

    /**
     * Validates a given password against the configured policies.
     * Throws an IllegalArgumentException if the password does not meet the requirements.
     *
     * @param password The raw password string to validate.
     */
    public void validatePassword(String password) {
        if (password == null || password.length() < minLength) {
            throw new IllegalArgumentException("Password must be at least " + minLength + " characters long.");
        }

        if (requireUppercase && !password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter.");
        }

        if (requireLowercase && !password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain at least one lowercase letter.");
        }

        if (requireDigit && !password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must contain at least one digit.");
        }

        // Regex for common special characters. Adjust as needed.
        if (requireSpecialChar && !password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new IllegalArgumentException("Password must contain at least one special character.");
        }
    }
}
