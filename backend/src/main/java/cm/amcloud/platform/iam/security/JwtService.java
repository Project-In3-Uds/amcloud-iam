package cm.amcloud.platform.iam.security;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set; // Import for Set
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class JwtService {

    private final PrivateKey privateKey;
    private final String issuerUri;
    private final String keyId;
    private final UserDetailsService userDetailsService;
    private final KeyPair keyPair;

    @Value("${jwt.access-token.expiration-seconds:3600}")
    private long accessTokenExpirationSeconds;

    @Value("${jwt.refresh-token.expiration-days:7}")
    private long refreshTokenExpirationDays;

    public JwtService(PrivateKey privateKey, String issuerUri, @Value("${jwt.key-id:my-key-id}") String keyId, UserDetailsService userDetailsService, KeyPair keyPair) {
        this.privateKey = privateKey;
        this.issuerUri = issuerUri;
        this.keyId = keyId;
        this.userDetailsService = userDetailsService;
        this.keyPair = keyPair;
    }

    /**
     * Génère un JWT Access Token pour un sujet donné (par exemple, nom d'utilisateur).
     * Le token inclura 'iss', 'iat', 'exp', 'kid' dans l'en-tête, et les rôles/scopes dans les claims.
     *
     * @param subject Le sujet du JWT (par exemple, ID utilisateur ou nom d'utilisateur).
     * @return La chaîne du JWT Access Token signé.
     */
    public String generateAccessToken(String subject) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(accessTokenExpirationSeconds);

        // Charger les détails de l'utilisateur, qui sont maintenant CustomUserDetails
        UserDetails userDetails = userDetailsService.loadUserByUsername(subject);

        // Extraire les rôles de GrantedAuthority
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // Extraire les scopes de CustomUserDetails
        Set<String> scopes = ((CustomUserDetails) userDetails).getScopes();

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        claims.put("scopes", scopes); // Utiliser les scopes dynamiques

        return Jwts.builder()
                .setHeaderParam("kid", keyId)
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(issuerUri)
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    /**
     * Génère un JWT Refresh Token pour un sujet donné (par exemple, nom d'utilisateur).
     * Ce token a une expiration plus longue et contient généralement moins de claims.
     * Inclut un claim 'jti' pour l'identifiant unique du JWT.
     *
     * @param subject Le sujet du JWT (par exemple, ID utilisateur ou nom d'utilisateur).
     * @return La chaîne du JWT Refresh Token signé.
     */
    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(refreshTokenExpirationDays * 24 * 60 * 60);

        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .setHeaderParam("kid", keyId)
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(issuerUri)
                .setId(jti)
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    /**
     * Extrait le sujet d'un token JWT.
     *
     * @param token La chaîne du token JWT.
     * @return Le sujet (nom d'utilisateur) extrait du token.
     */
    public String extractSubject(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(keyPair.getPublic())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Valide si un token JWT a expiré.
     *
     * @param token La chaîne du token JWT.
     * @return true si le token est expiré, false sinon.
     */
    public boolean isTokenExpired(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(keyPair.getPublic())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration()
                .before(Date.from(Instant.now()));
    }
}
