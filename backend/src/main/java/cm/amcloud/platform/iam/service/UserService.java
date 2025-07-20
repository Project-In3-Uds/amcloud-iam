package cm.amcloud.platform.iam.service;

import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.model.EmailVerificationToken;
import cm.amcloud.platform.iam.model.Role;
import cm.amcloud.platform.iam.model.RefreshToken; // Import RefreshToken
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.repository.EmailVerificationTokenRepository;
import cm.amcloud.platform.iam.repository.RoleRepository;
import cm.amcloud.platform.iam.repository.UserRepository;
import cm.amcloud.platform.iam.repository.RefreshTokenRepository; // Import RefreshTokenRepository
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidationService passwordValidationService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository; // Inject RefreshTokenRepository

    @Value("${account.lockout.max-attempts:2}")
    private int maxFailedAttempts;

    @Value("${account.lockout.duration-minutes:2}")
    private int lockoutDurationMinutes;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       PasswordValidationService passwordValidationService,
                       EmailVerificationTokenRepository emailVerificationTokenRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository) { // Add RefreshTokenRepository to constructor
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordValidationService = passwordValidationService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository; // Initialize RefreshTokenRepository
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
}
