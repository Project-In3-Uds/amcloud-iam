package cm.amcloud.platform.iam.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cm.amcloud.platform.iam.dto.AuthRequest;
import cm.amcloud.platform.iam.dto.AuthResponse;
import cm.amcloud.platform.iam.dto.ForgotPasswordRequest;
import cm.amcloud.platform.iam.dto.ResetPasswordRequest;
import cm.amcloud.platform.iam.dto.RegisterRequest;
import cm.amcloud.platform.iam.dto.UserRequest;
import cm.amcloud.platform.iam.dto.UserResponse;
import cm.amcloud.platform.iam.exception.AccountLockedException;
import cm.amcloud.platform.iam.exception.InvalidCredentialsException;
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.security.JwtService;
import cm.amcloud.platform.iam.service.UserService;
import cm.amcloud.platform.iam.model.RefreshToken;
import cm.amcloud.platform.iam.repository.RefreshTokenRepository;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/v1/auth")
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

    @Operation(summary = "Authenticate a user and return a JWT Access Token and Refresh Token (via HttpOnly cookie)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Authentication successful",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or account locked")
    })
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request, HttpServletResponse response) {
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

            // Sauvegarder le Refresh Token dans la base de données
            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setToken(refreshTokenString);
            refreshToken.setUser(user);
            refreshToken.setExpiresAt(LocalDateTime.now().plusDays(jwtService.getRefreshTokenExpirationDays())); // Utilise la durée de vie du service JWT
            refreshToken.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);

            // Définir le Refresh Token comme un cookie HttpOnly et Secure
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshTokenString)
                    .httpOnly(true)
                    .secure(true) // Utiliser true en production avec HTTPS
                    .path("/v1/auth") // Chemin où le cookie sera envoyé (ex: pour /v1/auth/refresh-token)
                    .maxAge(jwtService.getRefreshTokenExpirationDays() * 24 * 60 * 60) // Durée de vie en secondes
                    .sameSite("Lax") // Ou "Strict" pour plus de sécurité, "None" si cross-site avec secure=true
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            // Retourner l'Access Token ET l'ID de l'utilisateur dans le corps de la réponse
            return ResponseEntity.ok(new AuthResponse(accessToken, user.getId())); // <-- CHANGEMENT ICI

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

    @Operation(summary = "Verify user email with a token")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Email verified successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid, expired, or already used token")
    })
    @GetMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@RequestParam("token") String token) {
        try {
            userService.verifyEmail(token);
            return new ResponseEntity<>("Votre e-mail a été vérifié avec succès. Votre compte est maintenant actif !", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Une erreur inattendue est survenue lors de la vérification de l'e-mail.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Operation(summary = "Renew Access Token using a Refresh Token from HttpOnly cookie")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tokens refreshed successfully",
                    content = @Content(schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Invalid or expired Refresh Token")
    })
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        Optional<Cookie> refreshTokenCookie = Arrays.stream(request.getCookies() != null ? request.getCookies() : new Cookie[0])
                .filter(cookie -> "refreshToken".equals(cookie.getName()))
                .findFirst();

        if (refreshTokenCookie.isEmpty()) {
            throw new InvalidCredentialsException("Refresh token cookie is missing.");
        }

        String refreshTokenString = refreshTokenCookie.get().getValue();

        try {
            RefreshToken storedRefreshToken = refreshTokenRepository.findByToken(refreshTokenString)
                    .orElseThrow(() -> new InvalidCredentialsException("Refresh token not found or invalid."));

            // Vérifier si le refresh token est expiré ou révoqué
            if (jwtService.isTokenExpired(storedRefreshToken.getToken()) || storedRefreshToken.getRevokedAt() != null) {
                // Si expiré ou révoqué, invalider le cookie côté client en le supprimant
                ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
                        .httpOnly(true)
                        .secure(true) // Utiliser true en production avec HTTPS
                        .path("/v1/auth")
                        .maxAge(0) // Expire immédiatement
                        .sameSite("Lax")
                        .build();
                response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
                throw new InvalidCredentialsException("Refresh token is expired or has been revoked.");
            }

            User user = storedRefreshToken.getUser();
            if (user == null || !user.isEnabled()) {
                throw new InvalidCredentialsException("Associated user not found or is disabled.");
            }

            // Révoquer l'ancien refresh token (rotation du refresh token)
            storedRefreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(storedRefreshToken);

            // Générer un nouvel Access Token et un nouveau Refresh Token
            String newAccessToken = jwtService.generateAccessToken(user.getUsername());
            String newRefreshTokenString = jwtService.generateRefreshToken(user.getUsername());

            // Sauvegarder le nouveau Refresh Token dans la base de données
            RefreshToken newRefreshToken = new RefreshToken();
            newRefreshToken.setToken(newRefreshTokenString);
            newRefreshToken.setUser(user);
            newRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(jwtService.getRefreshTokenExpirationDays()));
            newRefreshToken.setCreatedAt(LocalDateTime.now());
            refreshTokenRepository.save(newRefreshToken);

            // Définir le nouveau Refresh Token comme un cookie HttpOnly et Secure
            ResponseCookie newRefreshCookie = ResponseCookie.from("refreshToken", newRefreshTokenString)
                    .httpOnly(true)
                    .secure(true) // Utiliser true en production avec HTTPS
                    .path("/v1/auth")
                    .maxAge(jwtService.getRefreshTokenExpirationDays() * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, newRefreshCookie.toString());

            // Retourner le nouvel Access Token ET l'ID de l'utilisateur dans le corps de la réponse
            return ResponseEntity.ok(new AuthResponse(newAccessToken, user.getId())); // <-- CHANGEMENT ICI

        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to refresh token: " + e.getMessage());
        }
    }

    @Operation(summary = "Logout user by revoking Refresh Token from HttpOnly cookie")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "400", description = "Invalid or already revoked Refresh Token")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) {
        Optional<Cookie> refreshTokenCookie = Arrays.stream(request.getCookies() != null ? request.getCookies() : new Cookie[0])
                .filter(cookie -> "refreshToken".equals(cookie.getName()))
                .findFirst();

        if (refreshTokenCookie.isEmpty()) {
            return new ResponseEntity<>("Refresh token cookie is missing.", HttpStatus.BAD_REQUEST);
        }

        String refreshTokenString = refreshTokenCookie.get().getValue();

        try {
            userService.logoutUser(refreshTokenString);
            
            // Supprimer le cookie du Refresh Token côté client après la déconnexion
            ResponseCookie expiredCookie = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .secure(true) // Utiliser true en production avec HTTPS
                    .path("/v1/auth")
                    .maxAge(0) // Expire immédiatement
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());

            return new ResponseEntity<>("Logout successful.", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
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
