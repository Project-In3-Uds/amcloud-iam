package cm.amcloud.platform.iam.service;

import java.time.LocalDateTime;
import java.util.HashSet; // Import UserRequest
import java.util.List;
import java.util.Optional; // Import UserResponse
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors; // Import Permission

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.dto.UserRequest;
import cm.amcloud.platform.iam.dto.UserResponse;
import cm.amcloud.platform.iam.model.EmailVerificationToken;
import cm.amcloud.platform.iam.model.PasswordResetToken;
import cm.amcloud.platform.iam.model.Permission;
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
    private final NotificationService notificationService;

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
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordValidationService = passwordValidationService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.notificationService = notificationService;
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

        notificationService.sendVerificationEmail(savedUser.getEmail(), verificationToken.getToken());

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
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(passwordResetTokenExpirationHours));
        passwordResetTokenRepository.save(resetToken);

        notificationService.sendPasswordResetEmail(user.getEmail(), resetToken.getToken());

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

        passwordValidationService.validatePassword(newPassword);

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark the token as used
        resetToken.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(resetToken);

        // Revoke all refresh tokens for this user for security after password change
        refreshTokenRepository.deleteByUser(user);
    }

    /**
     * Verifies an email using a provided token.
     *
     * @param tokenString The email verification token.
     * @throws IllegalArgumentException if the token is invalid, expired, or already used.
     */
    @Transactional
    public void verifyEmail(String tokenString) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email verification token."));

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Email verification token has expired.");
        }

        if (verificationToken.getVerifiedAt() != null) {
            throw new IllegalArgumentException("Email verification token has already been used.");
        }

        User user = verificationToken.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Associated user not found for this token.");
        }

        user.setEnabled(true); // Enable the user account
        user.setStatus("ACTIVE"); // Set status to ACTIVE
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        verificationToken.setVerifiedAt(LocalDateTime.now()); // Mark token as used
        emailVerificationTokenRepository.save(verificationToken);
    }

    /**
     * Crée un nouvel utilisateur avec les rôles spécifiés.
     *
     * @param userRequest Les détails de l'utilisateur à créer.
     * @return Le UserResponse de l'utilisateur créé.
     * @throws IllegalArgumentException si le nom d'utilisateur ou l'e-mail existe déjà, ou si la politique de mot de passe n'est pas respectée.
     */
    @Transactional
    public UserResponse createUser(UserRequest userRequest) {
        if (userRepository.findByUsername(userRequest.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Le nom d'utilisateur existe déjà.");
        }
        if (userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("L'e-mail est déjà enregistré.");
        }
        if (userRequest.getPassword() == null || userRequest.getPassword().isBlank()) {
            throw new IllegalArgumentException("Le mot de passe ne peut pas être vide pour la création d'utilisateur.");
        }

        passwordValidationService.validatePassword(userRequest.getPassword());

        User newUser = new User();
        newUser.setUsername(userRequest.getUsername());
        newUser.setEmail(userRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        newUser.setStatus(userRequest.getStatus() != null ? userRequest.getStatus() : "ACTIVE"); // Par défaut 'ACTIVE' si non spécifié
        newUser.setEnabled(true); // Toujours activé par défaut pour les créations admin
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        newUser.setFailedAttempts(0);
        newUser.setLockoutTime(null);

        Set<Role> roles = new HashSet<>();
        if (userRequest.getRoles() != null && !userRequest.getRoles().isEmpty()) {
            for (String roleName : userRequest.getRoles()) {
                roleRepository.findByName(roleName)
                        .ifPresentOrElse(roles::add, () -> {
                            throw new IllegalArgumentException("Le rôle '" + roleName + "' n'existe pas.");
                        });
            }
        } else {
            // Assigner un rôle par défaut si aucun n'est spécifié, par exemple ROLE_USER
            roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
        }
        newUser.setRoles(roles);

        User savedUser = userRepository.save(newUser);
        return convertToUserResponse(savedUser);
    }

    /**
     * Récupère un utilisateur par son ID.
     *
     * @param id L'ID de l'utilisateur.
     * @return Le UserResponse de l'utilisateur trouvé.
     * @throws IllegalArgumentException si l'utilisateur n'est pas trouvé.
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));
        return convertToUserResponse(user);
    }

    /**
     * Met à jour les informations d'un utilisateur existant.
     *
     * @param id L'ID de l'utilisateur à mettre à jour.
     * @param userRequest Les nouvelles informations de l'utilisateur.
     * @return Le UserResponse de l'utilisateur mis à jour.
     * @throws IllegalArgumentException si l'utilisateur n'est pas trouvé, ou si l'e-mail/nom d'utilisateur est déjà pris.
     */
    @Transactional
    public UserResponse updateUser(Long id, UserRequest userRequest) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));

        // Vérifier si le nouvel e-mail est déjà pris par un autre utilisateur
        if (userRequest.getEmail() != null && !userRequest.getEmail().equals(existingUser.getEmail())) {
            if (userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
                throw new IllegalArgumentException("L'e-mail '" + userRequest.getEmail() + "' est déjà utilisé par un autre utilisateur.");
            }
            existingUser.setEmail(userRequest.getEmail());
        }

        // Vérifier si le nouveau nom d'utilisateur est déjà pris par un autre utilisateur
        if (userRequest.getUsername() != null && !userRequest.getUsername().equals(existingUser.getUsername())) {
            if (userRepository.findByUsername(userRequest.getUsername()).isPresent()) {
                throw new IllegalArgumentException("Le nom d'utilisateur '" + userRequest.getUsername() + "' est déjà utilisé par un autre utilisateur.");
            }
            existingUser.setUsername(userRequest.getUsername());
        }

        // Mettre à jour le mot de passe si fourni
        if (userRequest.getPassword() != null && !userRequest.getPassword().isBlank()) {
            passwordValidationService.validatePassword(userRequest.getPassword());
            existingUser.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }

        // Mettre à jour le statut si fourni
        if (userRequest.getStatus() != null && !userRequest.getStatus().isBlank()) {
            existingUser.setStatus(userRequest.getStatus());
            // Si le statut est DISABLED, désactiver le compte
            existingUser.setEnabled(!userRequest.getStatus().equals("DISABLED"));
        }

        // Mettre à jour les rôles si fournis
        if (userRequest.getRoles() != null) {
            Set<Role> updatedRoles = new HashSet<>();
            for (String roleName : userRequest.getRoles()) {
                roleRepository.findByName(roleName)
                        .ifPresentOrElse(updatedRoles::add, () -> {
                            throw new IllegalArgumentException("Le rôle '" + roleName + "' n'existe pas.");
                        });
            }
            existingUser.setRoles(updatedRoles);
        }

        existingUser.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(existingUser);
        return convertToUserResponse(updatedUser);
    }

    /**
     * Supprime un utilisateur par son ID.
     *
     * @param id L'ID de l'utilisateur à supprimer.
     * @throws IllegalArgumentException si l'utilisateur n'est pas trouvé.
     */
    @Transactional
    public void deleteUser(Long id) {
        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));
        
        // Supprimer les tokens de rafraîchissement et de réinitialisation de mot de passe associés
        refreshTokenRepository.deleteByUser(userToDelete);
        passwordResetTokenRepository.deleteByUser(userToDelete);
        emailVerificationTokenRepository.deleteByUser(userToDelete);  

        userRepository.delete(userToDelete);
    }

    /**
     * Convertit une entité User en UserResponse DTO.
     *
     * @param user L'entité User à convertir.
     * @return Le UserResponse DTO.
     */
    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setStatus(user.getStatus());
        response.setEnabled(user.isEnabled());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        response.setLastLoginAt(user.getLastLoginAt());

        // Mapper les noms des rôles
        if (user.getRoles() != null) {
            response.setRoles(user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet()));

            // Mapper les noms des permissions (scopes)
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getName) // Ou getScopeValue() si vous préférez les scopes bruts
                    .collect(Collectors.toSet());
            response.setPermissions(permissions);
        } else {
            response.setRoles(new HashSet<>());
            response.setPermissions(new HashSet<>());
        }
        return response;
    }
    /**
     * Récupère tous les utilisateurs.
     *
     * @return Une liste de UserResponse pour tous les utilisateurs.
     */
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList()); 
    }
}
