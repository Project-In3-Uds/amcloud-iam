package cm.amcloud.platform.iam.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cm.amcloud.platform.iam.dto.AuthRequest;
import cm.amcloud.platform.iam.dto.AuthResponse;
import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.exception.AccountLockedException;
import cm.amcloud.platform.iam.exception.InvalidCredentialsException;
import cm.amcloud.platform.iam.model.RefreshToken;
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.repository.RefreshTokenRepository;
import cm.amcloud.platform.iam.security.JwtService;
import cm.amcloud.platform.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content; // Import RefreshToken model
import io.swagger.v3.oas.annotations.media.Schema; // Import RefreshTokenRepository
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses; // Import for LocalDateTime
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository; // Inject RefreshTokenRepository

    public AuthenticationController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService, RefreshTokenRepository refreshTokenRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository; // Initialize RefreshTokenRepository
    }

    @Operation(summary = "Authenticate a user and return a JWT Access Token and Refresh Token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or account locked")
    })
    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        User user = null;
        try {
            user = userService.findByUsername(request.getUsername());

            if (userService.isAccountLocked(user)) {
                throw new AccountLockedException("Le compte est verrouillé. Veuillez réessayer plus tard.");
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            userService.resetFailedAttempts(user);

            String accessToken = jwtService.generateAccessToken(request.getUsername());
            String refreshTokenString = jwtService.generateRefreshToken(request.getUsername());

            // Save the Refresh Token to the database
            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken(refreshTokenString);
            refreshToken.setUser(user); // Link to the authenticated user
            // Set expiration based on the JWT's expiration (from JwtService)
            // For simplicity, we'll re-calculate it here, or you can pass it from JwtService
            refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7)); // Assuming 7 days as per jwt.refresh-token.expiration-days
            refreshToken.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);

            return new AuthResponse(accessToken, refreshTokenString);

        } catch (BadCredentialsException e) {
            if (user != null) {
                userService.incrementFailedAttempts(user);
                if (userService.isAccountLocked(user)) {
                    throw new AccountLockedException("Identifiants invalides. Compte verrouillé en raison de trop de tentatives échouées.");
                }
            }
            throw new InvalidCredentialsException("Identifiants invalides.");
        } catch (AccountLockedException e) {
            throw e;
        } catch (AuthenticationException e) {
            throw new RuntimeException("Échec de l'authentification: " + e.getMessage());
        } catch (RuntimeException e) {
            throw e;
        }
    }

    @Operation(summary = "Register a new user and generate an email verification token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = User.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or user already exists")
    })
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            userService.registerNewUser(request);
            return new ResponseEntity<>("Utilisateur enregistré avec succès. Veuillez vérifier votre e-mail pour la vérification.", HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            throw e;
        }
    }

    @Operation(summary = "Renew Access Token using a Refresh Token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired Refresh Token")
    })
    @PostMapping("/refresh-token")
    public AuthResponse refreshToken(@RequestBody Map<String, String> request) {
        String refreshTokenString = request.get("refreshToken");

        if (refreshTokenString == null || refreshTokenString.isBlank()) {
            throw new InvalidCredentialsException("Refresh token is missing.");
        }

        try {
            // 1. Find the refresh token in the database
            RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                    .orElseThrow(() -> new InvalidCredentialsException("Refresh token not found or invalid."));

            // 2. Check if the refresh token is expired or revoked
            if (jwtService.isTokenExpired(storedRefreshToken.getToken()) || storedRefreshToken.getRevokedAt() != null) {
                throw new InvalidCredentialsException("Refresh token is expired or has been revoked.");
            }

            // 3. Get the user associated with the refresh token
            User user = storedRefreshToken.getUser();
            if (user == null || !user.isEnabled()) {
                throw new InvalidCredentialsException("Associated user not found or is disabled.");
            }

            // 4. Implement Refresh Token Rotation: Revoke the old token
            storedRefreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(storedRefreshToken);

            // 5. Generate new Access Token and new Refresh Token
            String newAccessToken = jwtService.generateAccessToken(user.getUsername());
            String newRefreshTokenString = jwtService.generateRefreshToken(user.getUsername());

            // 6. Save the new Refresh Token
            RefreshToken newRefreshToken = new RefreshToken();
            newRefreshToken.setToken(newRefreshTokenString);
            newRefreshToken.setUser(user);
            newRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(7)); // Assuming 7 days
            newRefreshToken.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(newRefreshToken);

            return new AuthResponse(newAccessToken, newRefreshTokenString);

        } catch (InvalidCredentialsException e) {
            throw e; // Re-throw custom exception for global handling
        } catch (Exception e) {
            // Log the exception for debugging
            e.printStackTrace();
            throw new RuntimeException("Failed to refresh token: " + e.getMessage());
        }
    }

    @Operation(summary = "Access a protected resource")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Access granted"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    @GetMapping("/secure-endpoint")
    public String secureEndpoint() {
        return "Vous avez accédé à une ressource protégée !";
    }
}
