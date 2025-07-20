package cm.amcloud.platform.iam.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.model.EmailVerificationToken;
import cm.amcloud.platform.iam.model.PasswordResetToken;
import cm.amcloud.platform.iam.model.RefreshToken;
import cm.amcloud.platform.iam.model.Role;
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.repository.EmailVerificationTokenRepository;
import cm.amcloud.platform.iam.repository.PasswordResetTokenRepository;
import cm.amcloud.platform.iam.repository.RefreshTokenRepository;
import cm.amcloud.platform.iam.repository.RoleRepository;
import cm.amcloud.platform.iam.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidationService passwordValidationService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${account.lockout.max-attempts:2}")
    private int maxFailedAttempts;

    @Value("${account.lockout.duration-minutes:1440}")
    private int lockoutDurationMinutes;

    @Value("${password.reset.token-expiration-hours:1}")
    private int passwordResetTokenExpirationHours;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       PasswordValidationService passwordValidationService,
                       EmailVerificationTokenRepository emailVerificationTokenRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordValidationService = passwordValidationService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    /**
     * Registers a new user, hashes their password, and generates an email verification token.
     *
     * @param request The registration request containing username, email, and raw password.
     * @return The newly created User entity.
     * @throws IllegalArgumentException if username/email already exists or password policy is not met.
     */
    @Transactional
    public User registerNewUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered.");
        }

        passwordValidationService.validatePassword(request.getPassword());

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setStatus("PENDING_VERIFICATION");
        newUser.setEnabled(false);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        newUser.setFailedAttempts(0);
        newUser.setLockoutTime(null);

        Optional<Role> userRoleOptional = roleRepository.findByName("ROLE_USER");
        if (userRoleOptional.isEmpty()) {
             Role userRole = new Role();
             userRole.setName("ROLE_USER");
             userRole = roleRepository.save(userRole);
             userRoleOptional = Optional.of(userRole);
        }
        Set<Role> roles = new HashSet<>();
        userRoleOptional.ifPresent(roles::add);
        newUser.setRoles(roles);


        User savedUser = userRepository.save(newUser);

        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setToken(UUID.randomUUID().toString());
        verificationToken.setUser(savedUser);
        verificationToken.setExpiresAt(LocalDateTime.now().plusHours(24));
        verificationToken.setCreatedAt(LocalDateTime.now());

        emailVerificationTokenRepository.save(verificationToken);

        // TODO: Envoyer l'e-mail de vérification via le service de notification
        // notificationService.sendVerificationEmail(savedUser.getEmail(), verificationToken.getToken());

        return savedUser;
    }

    /**
     * Finds a user by username.
     *
     * @param username The username to search for.
     * @return The User entity if found.
     * @throws RuntimeException if the user is not found.
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    /**
     * Increments the failed login attempts for a user. If the max attempts are reached,
     * the user account is locked for a specified duration.
     *
     * @param user The User entity whose failed attempts need to be updated.
     */
    @Transactional
    public void incrementFailedAttempts(User user) {
        user.setFailedAttempts(user.getFailedAttempts() + 1);
        user.setUpdatedAt(LocalDateTime.now());

        if (user.getFailedAttempts() >= maxFailedAttempts) {
            user.setLockoutTime(LocalDateTime.now().plusMinutes(lockoutDurationMinutes));
        }
        userRepository.save(user);
    }

    /**
     * Resets the failed login attempts and lockout time for a user.
     * This should be called upon a successful login.
     *
     * @param user The User entity to reset.
     */
    @Transactional
    public void resetFailedAttempts(User user) {
        user.setFailedAttempts(0);
        user.setLockoutTime(null);
        user.setEnabled(true);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Checks if a user account is currently locked.
     *
     * @param user The User entity to check.
     * @return true if the account is locked, false otherwise.
     */
    public boolean isAccountLocked(User user) {
        return user.getLockoutTime() != null && user.getLockoutTime().isAfter(LocalDateTime.now());
    }

    /**
     * Revokes a refresh token, effectively logging out the user from that session.
     *
     * @param refreshTokenString The refresh token string to revoke.
     * @throws IllegalArgumentException if the refresh token is not found or already revoked.
     */
    @Transactional
    public void logoutUser(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found or invalid."));

        if (refreshToken.getRevokedAt() != null) {
            throw new IllegalArgumentException("Refresh token already revoked.");
        }

        refreshToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Creates a new password reset token for the given user email.
     * If an existing token for the user is found, it is invalidated.
     *
     * @param email The email of the user requesting a password reset.
     * @return The generated password reset token string.
     * @throws IllegalArgumentException if the user is not found or is disabled.
     */
    @Transactional
    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User with this email not found."));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("User account is disabled.");
        }

        // Invalidate any existing password reset tokens for this user
        passwordResetTokenRepository.deleteByUser(user);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(passwordResetTokenExpirationHours)); // Configurable expiration
        passwordResetTokenRepository.save(resetToken);

        // TODO: Envoyer l'e-mail de réinitialisation de mot de passe via le service de notification
        // notificationService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());

        return resetToken.getToken();
    }

    /**
     * Resets the user's password using a valid password reset token.
     *
     * @param tokenString The password reset token.
     * @param newPassword The new raw password.
     * @param confirmNewPassword The confirmation of the new raw password.
     * @throws IllegalArgumentException if token is invalid/expired/used, passwords don't match, or password policy not met.
     */
    @Transactional
    public void resetPassword(String tokenString, String newPassword, String confirmNewPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new IllegalArgumentException("Invalid password reset token."));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset token has expired.");
        }

        if (resetToken.getUsedAt() != null) {
            throw new IllegalArgumentException("Password reset token has already been used.");
        }

        if (!newPassword.equals(confirmNewPassword)) {
            throw new IllegalArgumentException("New password and confirmation do not match.");
        }

        passwordValidationService.validatePassword(newPassword); // Validate new password against policy

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark the token as used
        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        // Optionally, revoke all refresh tokens for this user for security after password change
        refreshTokenRepository.deleteByUser(user);
    }
}
