package cm.amcloud.platform.iam;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource; // Import for TestPropertySource annotation

/**
 * Integration test for the Spring Boot application context loading.
 * This test uses an in-memory H2 database to avoid requiring a running PostgreSQL
 * instance during test execution, ensuring tests can run without external database setup.
 * It also provides dummy properties for JWT and other application configurations
 * to allow the full Spring context to load successfully, preventing placeholder resolution errors.
 *
 * This version addresses common warnings related to Spring Cloud Config, Hibernate JPA dialect,
 * and JPA Open-In-View for a cleaner test output.
 */
@SpringBootTest // Loads the full Spring application context.
                // Essential for integration tests that require Spring beans to be started.
@TestPropertySource(properties = {
    // --- Database configuration for tests (using H2 in-memory) ---
    // The JDBC URL for an in-memory H2 database named 'testdb'.
    // DB_CLOSE_DELAY=-1 keeps the database alive as long as the JVM is running,
    // which is useful when multiple tests share the same database instance.
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",

    // --- JWT configuration properties ---
    // Provides dummy values for JWT properties required by the application context.
    // These are typically used by JwtService or security configurations.
    "jwt.private-key-path=classpath:keys/private.pem",
    "jwt.public-key-path=classpath:keys/public.pem",
    "jwt.expiration=3600",
    "jwt.key-id=my-test-key-id",

    // --- Server and Issuer URI configuration ---
    "server.port=8081",
    "iam.issuer-uri=http://localhost:8081",

    // --- JPA and Hibernate configuration properties ---
    // These properties are often required for JPA/Hibernate setup, even with an in-memory database.
    // The PostgreSQL dialect is specified to align with production configuration, even if H2 is used for tests.
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
    "spring.sql.init.mode=always",
    "spring.jpa.hibernate.ddl-auto=update",
    "spring.jpa.open-in-view=false",

    // --- Spring Cloud Config Server URL ---
    // If your application connects to a Spring Cloud Config Server.
    "spring.cloud.config.uri=http://localhost:8888",
    "spring.cloud.config.enabled=false"
})
class IamApplicationTests {

    /**
     * This test method simply verifies that the Spring application context
     * loads successfully without any errors. It's a basic sanity check
     * for the application's overall configuration and bean wiring.
     * No specific assertions are needed here, as the test passes if the context loads without exceptions.
     */
    @Test
    void contextLoads() {
        // The test passes if the application context loads without throwing exceptions.
        // This confirms that all required properties are resolved and beans can be created.
    }

}
