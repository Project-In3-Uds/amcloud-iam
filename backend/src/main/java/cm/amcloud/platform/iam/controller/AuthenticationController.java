package cm.amcloud.platform.iam.controller;

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
import cm.amcloud.platform.iam.model.User;
import cm.amcloud.platform.iam.security.JwtService;
import cm.amcloud.platform.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthenticationController(AuthenticationManager authenticationManager, JwtService jwtService, UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Operation(summary = "Authenticate a user and return a JWT token")
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

            String token = jwtService.generateToken(request.getUsername());
            return new AuthResponse(token);

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
