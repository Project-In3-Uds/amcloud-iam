package cm.amcloud.platform.iam.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * OpenIdConfigurationController: Exposes the OpenID Connect Discovery endpoint.
 * This endpoint provides metadata about the IAM service, including the JWK Set URI,
 * which clients (like the Gateway) use to configure themselves.
 */
@RestController
public class OpenIdConfigurationController {

    // Injected from IAMServiceConfig
    private final String issuerUri;

    /**
     * Constructor for OpenIdConfigurationController.
     *
     * @param issuerUri The issuer URI of this IAM service.
     */
    public OpenIdConfigurationController(@Value("${iam.issuer-uri}") String issuerUri) {
        this.issuerUri = issuerUri;
    }

    /**
     * Returns the OpenID Connect Discovery metadata.
     * This endpoint is typically found at `/.well-known/openid-configuration` relative to the issuer URI.
     *
     * @return A Map representing the OIDC configuration.
     */
    @GetMapping("/.well-known/openid-configuration")
    public Map<String, Object> getOpenIdConfiguration() {
        Map<String, Object> config = new HashMap<>();
        config.put("issuer", issuerUri);
        config.put("jwks_uri", issuerUri + "/jwks.json"); // Point to your JWK Set endpoint
        // Add other standard OIDC metadata as needed for your specific implementation.
        // These are examples; adjust based on your IAM service's capabilities.
        config.put("authorization_endpoint", issuerUri + "/oauth2/authorize"); // Example authorization endpoint
        config.put("token_endpoint", issuerUri + "/oauth2/token"); // Example token endpoint
        config.put("userinfo_endpoint", issuerUri + "/oauth2/userinfo"); // Example user info endpoint
        config.put("response_types_supported", Collections.singletonList("code")); // Supported response types
        config.put("subject_types_supported", Collections.singletonList("public")); // Supported subject types
        config.put("id_token_signing_alg_values_supported", Collections.singletonList("RS256")); // Supported signing algorithms
        config.put("scopes_supported", Arrays.asList("openid", "profile", "email")); // Supported scopes
        config.put("token_endpoint_auth_methods_supported", Arrays.asList("client_secret_basic", "client_secret_post")); // Supported client authentication methods
        // ... more OIDC metadata fields can be added here as per OpenID Connect Discovery specification ...

        return config;
    }
}
