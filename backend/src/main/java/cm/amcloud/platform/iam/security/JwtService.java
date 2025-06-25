package cm.amcloud.platform.iam.security;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors; // Added for stream operations

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority; // Added import
import org.springframework.security.core.userdetails.UserDetails; // Added import
import org.springframework.security.core.userdetails.UserDetailsService; // Added import
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

/**
 * JwtService: Handles the creation and signing of JWTs in the IAM service.
 * This service uses the PrivateKey and KeyPair provided by IAMServiceConfig to sign tokens
 * and includes standard JWT claims like 'iss' (issuer) and 'exp' (expiration), and 'kid' in the header.
 */
@Service
public class JwtService {

    private final PrivateKey privateKey;
    private final String issuerUri; // Injected from IAMServiceConfig
    private final KeyPair keyPair; // Inject KeyPair to access the public key's ID (if needed)
    private final UserDetailsService userDetailsService; // Injected to retrieve user roles

    // Token expiration in seconds (e.g., 1 hour), configurable via application properties
    @Value("${jwt.expiration-seconds:3600}")
    private long expirationSeconds;

    // You might want to configure a specific key ID or use a default
    @Value("${jwt.key-id:my-key-id}")
    private String keyId;

    /**
     * Constructor for JwtService.
     * Spring will inject the PrivateKey, issuerUri, KeyPair, and UserDetailsService beans.
     *
     * @param privateKey The private key used for signing JWTs.
     * @param issuerUri The issuer URI of this IAM service.
     * @param keyPair The KeyPair, which can be used to access key details.
     * @param userDetailsService The UserDetailsService to load user details and roles.
     */
    public JwtService(PrivateKey privateKey, String issuerUri, KeyPair keyPair, UserDetailsService userDetailsService) {
        this.privateKey = privateKey;
        this.issuerUri = issuerUri;
        this.keyPair = keyPair;
        this.userDetailsService = userDetailsService; // Initialize UserDetailsService
    }

    /**
     * Generates a JWT for a given subject (e.g., username) and optional claims.
     * The token will include 'iss', 'iat', 'exp', and 'kid' in the header.
     * This method now fetches user roles from the database using the provided subject.
     *
     * @param subject The subject of the JWT (e.g., user ID or username).
     * @param claims  Additional claims to include in the JWT payload.
     * @return The signed JWT string.
     */
    public String generateToken(String subject, Map<String, Object> claims) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(expirationSeconds);

        // Fetch user details to get roles from the database
        UserDetails userDetails = userDetailsService.loadUserByUsername(subject);

        // Extract role names from GrantedAuthority objects
        List<String> roles = userDetails.getAuthorities().stream()
                                        .map(GrantedAuthority::getAuthority)
                                        .collect(Collectors.toList());

        // Add fetched roles to claims, overriding any default or existing 'roles' claim
        claims.put("roles", roles);

        // Add scopes to claims if not already present (assuming scopes are not dynamically fetched from DB for simplicity here)
        claims.putIfAbsent("scopes", List.of("read", "write")); // Example default scopes

        return Jwts.builder()
                .setHeaderParam("kid", keyId) // Add the 'kid' to the header
                .setClaims(claims) // Set claims
                .setSubject(subject) // Set the subject
                .setIssuedAt(Date.from(now)) // Set issued at time
                .setExpiration(Date.from(expiration)) // Set expiration time
                .setIssuer(issuerUri) // IMPORTANT: Add the 'iss' (issuer) claim
                .signWith(privateKey, SignatureAlgorithm.RS256) // Use the correct signing method
                .compact();
    }

    /**
     * Generates a JWT for a given subject with specified roles and scopes.
     * This method now uses the primary generateToken method to fetch roles from DB.
     * The provided roles and scopes will be added to the claims, but roles will be
     * overwritten by roles fetched from the database.
     *
     * @param subject The subject of the JWT (e.g., user ID or username).
     * @param roles   The roles to include in the JWT payload (will be overwritten by DB roles).
     * @param scopes  The scopes to include in the JWT payload.
     * @return The signed JWT string.
     */
    public String generateToken(String subject, List<String> roles, List<String> scopes) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        claims.put("scopes", scopes); // Ensure required scopes are included
        return generateToken(subject, claims);
    }

    /***
     * Generates a JWT with only the subject.
     * This method now uses the primary generateToken method to fetch roles from DB.
     *
     * @param subject The subject of the JWT.
     * @return The signed JWT string.
     */
    public String generateToken(String subject) {
        return generateToken(subject, new HashMap<>()); // Call the overloaded method with an empty claims map
    }
}
