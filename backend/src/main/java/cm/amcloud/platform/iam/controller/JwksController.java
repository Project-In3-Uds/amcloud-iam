package cm.amcloud.platform.iam.controller;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.PublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Map;

/**
 * JwksController: Exposes the JSON Web Key Set (JWKS) endpoint for the IAM service.
 * This endpoint provides the public keys used by clients (like the Gateway)
 * to verify JWT signatures issued by this IAM service.
 */
@RestController
public class JwksController {

    private final PublicKey publicKey;

    // The Key ID (kid) that will be included in the JWKS.
    // This must match the 'kid' included in the JWT header by JwtService.
    @Value("${jwt.key-id:my-key-id}")
    private String keyId;

    /**
     * Constructor for JwksController.
     * Spring will inject the PublicKey bean from IAMServiceConfig.
     *
     * @param publicKey The PublicKey bean containing the public key for signature verification.
     */
    public JwksController(PublicKey publicKey) {
        this.publicKey = publicKey;
    }

    /**
     * Returns the JSON Web Key Set (JWKS).
     * This endpoint is typically found at `/jwks.json` relative to the issuer URI.
     *
     * @return A Map representing the JWK Set.
     */
    @GetMapping("/jwks.json")
    public Map<String, Object> jwks() {
        // Cast the generic PublicKey to RSAPublicKey as we are using RSA keys.
        RSAPublicKey rsaPublicKey = (RSAPublicKey) publicKey;

        // Log the Key ID and public key modulus for debugging purposes.
        System.out.println("Serving JWKS with kid: " + keyId);
        System.out.println("Public Key Modulus: " + rsaPublicKey.getModulus());

        // Build an RSA JWK from the public key.
        // It's crucial to include 'kid' (Key ID) for key rotation and matching.
        // The 'use' parameter indicates the public key's intended use ('sig' for signature verification).
        // The 'alg' parameter indicates the algorithm used for signing (e.g., RS256).
        RSAKey jwk = new RSAKey.Builder(rsaPublicKey)
                .algorithm(JWSAlgorithm.RS256) // The algorithm used for signing (must match what you use in JwtService)
                .keyUse(com.nimbusds.jose.jwk.KeyUse.SIGNATURE) // Key is used for signature verification
                .keyID(keyId) // Unique ID for this key (important for key rotation and matching JWT header)
                .build();

        // Create a JWKSet containing your public key.
        JWKSet jwkSet = new JWKSet(jwk);

        // Convert the JWKSet to a JSON object (Map) for the HTTP response.
        return jwkSet.toJSONObject();
    }
}
