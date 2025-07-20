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
import cm.amcloud.platform.iam.dto.ForgotPasswordRequest;
import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.dto.ResetPasswordRequest;
import cm.amcloud.platform.iam.exception.AccountLockedException;
import cm.amcloud.platform.iam.exception.InvalidCredentialsException;
import cm.amcloud.platform.iam.model.RefreshToken;
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.repository.RefreshTokenRepository;
import cm.amcloud.platform.iam.security.JwtService;
import cm.amcloud.platform.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse; // Assurez-vous que cet import est présent
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthenticationController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService, RefreshTokenRepository refreshTokenRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Operation(summary = "Authenticate a user and return a JWT Access Token and Refresh Token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or account locked")
    })
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) { 
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

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken(refreshTokenString);
            refreshToken.setUser(user);
            refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
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
        // Note: Validation for refreshToken is done manually here as it's a simple String in a Map
        String refreshTokenString = request.get("refreshToken");

        if (refreshTokenString == null || refreshTokenString.isBlank()) {
            throw new InvalidCredentialsException("Refresh token is missing.");
        }

        try {
            RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                    .orElseThrow(() -> new InvalidCredentialsException("Refresh token not found or invalid."));

            if (jwtService.isTokenExpired(storedRefreshToken.getToken()) || storedRefreshToken.getRevokedAt() != null) {
                throw new InvalidCredentialsException("Refresh token is expired or has been revoked.");
            }

            User user = storedRefreshToken.getUser();
            if (user == null || !user.isEnabled()) {
                throw new InvalidCredentialsException("Associated user not found or is disabled.");
            }

            storedRefreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(storedRefreshToken);

            String newAccessToken = jwtService.generateAccessToken(user.getUsername());
            String newRefreshTokenString = jwtService.generateRefreshToken(user.getUsername());

            RefreshToken newRefreshToken = new RefreshToken();
            newRefreshToken.setToken(newRefreshTokenString);
            newRefreshToken.setUser(user);
            newRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
            newRefreshToken.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(newRefreshToken);

            return new AuthResponse(newAccessToken, newRefreshTokenString);

        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to refresh token: " + e.getMessage());
        }
    }

    @Operation(summary = "Logout user by revoking Refresh Token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "400", description = "Invalid or already revoked Refresh Token")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody Map<String, String> request) {
        // Note: Validation for refreshToken is done manually here as it's a simple String in a Map
        String refreshTokenString = request.get("refreshToken");

        if (refreshTokenString == null || refreshTokenString.isBlank()) {
            return new ResponseEntity<>("Refresh token is missing.", HttpStatus.BAD_REQUEST);
        }

        try {
            userService.logoutUser(refreshTokenString);
            return new ResponseEntity<>("Logout successful.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("An unexpected error occurred during logout.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Request a password reset token by email")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset token requested successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid email or user not found/disabled")
    })
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) { 
        try {
            userService.createPasswordResetToken(request.getEmail());
            return new ResponseEntity<>("Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Une erreur inattendue est survenue lors de la demande de réinitialisation de mot de passe.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Reset password using a valid token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Password reset successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid token, passwords mismatch, or password policy not met")
    })
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) { 
        try {
            userService.resetPassword(request.getToken(), request.getNewPassword(), request.getConfirmNewPassword());
            return new ResponseEntity<>("Le mot de passe a été réinitialisé avec succès.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Une erreur inattendue est survenue lors de la réinitialisation du mot de passe.", HttpStatus.INTERNAL_SERVER_ERROR);
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
