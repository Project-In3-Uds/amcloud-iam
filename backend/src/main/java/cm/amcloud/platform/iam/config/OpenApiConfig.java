package cm.amcloud.platform.iam.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        // Define a consistent, simple name for your security scheme
        // Changed "Bearer Authentication" to "bearerAuth" for better compatibility
        final String securitySchemeName = "bearerAuth";

        // Define the security scheme for Bearer Authorization
        SecurityScheme bearerAuthScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .name(securitySchemeName);

        // Add the security requirement to the OpenAPI specification
        // Reference the security scheme by its new consistent name
        SecurityRequirement securityRequirement = new SecurityRequirement().addList(securitySchemeName);

        return new OpenAPI()
                .openapi("3.0.0")
                .info(new Info()
                        .title("AMCLOUD IAM Service API")
                        .version("3.0.0")
                        .description("API documentation for the Identity and Access Management (IAM) microservice.")
                        .contact(new Contact()
                                .name("AMCLOUD Support")
                                .email("project.in3.uds@outlook.com")
                                .url("https://platform.amcloud.cm"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")))
                .servers(Arrays.asList(
                        new Server().url("http://localhost:8081").description("Generated server url")
                ))
                .components(new Components()
                        // Add the security scheme to components using the new consistent name as the key
                        .addSecuritySchemes(securitySchemeName, bearerAuthScheme))
                .addSecurityItem(securityRequirement); 
    }
}