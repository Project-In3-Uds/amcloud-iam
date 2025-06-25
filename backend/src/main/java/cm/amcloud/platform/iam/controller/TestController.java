package cm.amcloud.platform.iam.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * TestController: Provides example endpoints to demonstrate Spring Security
 * and JWT validation.
 */
@RestController
public class TestController {

    /**
     * Public endpoint: Accessible without any authentication.
     * Test with: GET http://localhost:8081/test/public/hello
     * @return A greeting message.
     */
    @GetMapping("/test/public/hello")
    public Mono<String> publicHello() {
        return Mono.just("Hello from public endpoint in IAM!");
    }

    /**
     * Secured endpoint: Requires any valid JWT token.
     * Test with: GET http://localhost:8081/test/api/secured
     * Header: Authorization: Bearer <YOUR_VALID_JWT_TOKEN>
     * @param authentication The authenticated user's information.
     * @return A secured message with user details.
     */
    @GetMapping("/test/api/secured")
    public Mono<String> securedEndpoint(Authentication authentication) {
        return Mono.just("Hello, " + authentication.getName() + "! You accessed a secured endpoint in IAM. Authorities: " + authentication.getAuthorities());
    }

    /**
     * Admin-only endpoint: Requires a JWT token with the 'ADMIN' role.
     * Test with: GET http://localhost:8081/test/api/admin/dashboard
     * Header: Authorization: Bearer <YOUR_ADMIN_JWT_TOKEN>
     * (Your JWT payload must contain {"roles": ["ADMIN"]})
     * @param authentication The authenticated user's information.
     * @return An admin-specific message.
     */
    @GetMapping("/test/api/admin/dashboard")
    public Mono<String> adminDashboard(Authentication authentication) {
        return Mono.just("Welcome, Admin " + authentication.getName() + "! This is the admin dashboard in IAM.");
    }

    /**
     * Scoped endpoint: Requires a JWT token with the 'read' scope.
     * Test with: GET http://localhost:8081/test/api/data/read
     * Header: Authorization: Bearer <YOUR_SCOPED_JWT_TOKEN>
     * (Your JWT payload must contain {"scope": "read"} or {"scopes": ["read"]})
     * @return A data access message.
     */
    @GetMapping("/test/api/data/read")
    public Mono<String> readData() {
        return Mono.just("Data read successfully with 'read' scope!");
    }
}
 