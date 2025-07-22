package cm.amcloud.platform.iam.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // Import CorsConfiguration
import org.springframework.web.cors.CorsConfiguration; // Import CorsConfigurationSource
import org.springframework.web.cors.CorsConfigurationSource; // Import UrlBasedCorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import cm.amcloud.platform.iam.security.CustomUserDetailsService;
import cm.amcloud.platform.iam.security.GatewayHeaderAuthenticationFilter; // Import Arrays

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final GatewayHeaderAuthenticationFilter gatewayHeaderAuthenticationFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService, GatewayHeaderAuthenticationFilter gatewayHeaderAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.gatewayHeaderAuthenticationFilter = gatewayHeaderAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Active CORS avec la source de configuration
                .authorizeHttpRequests(auth -> auth
                        // Permettre l'accès aux endpoints publics d'authentification, de rafraîchissement, de déconnexion,
                        // de réinitialisation de mot de passe et de vérification d'e-mail.
                        .requestMatchers(
                                "/v1/auth/login",
                                "/v1/auth/register",
                                "/v1/auth/refresh-token",
                                "/v1/auth/logout",
                                "/v1/auth/forgot-password",
                                "/v1/auth/reset-password",
                                "/v1/auth/verify-email",
                                "/.well-known/openid-configuration",
                                "/jwks.json",
                                "/test/public/**"
                        ).permitAll()
                        // Permettre les requêtes OPTIONS pour tous les chemins (nécessaire pour les preflights CORS)
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll() // Ajout important pour CORS preflight
                        // Permettre l'accès aux endpoints Springdoc/Swagger UI
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/webjars/**").permitAll()
                        // Les endpoints /v1/users/**, /v1/roles/**, /v1/permissions/** et /v1/admin/realms/** seront protégés par @PreAuthorize
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(gatewayHeaderAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // Bean pour la configuration CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000")); // Remplacez par l'URL de votre frontend
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-User-Roles", "X-User-Scopes")); // Incluez les en-têtes personnalisés si utilisés
        configuration.setAllowCredentials(true); // Autoriser les credentials (cookies, en-têtes d'autorisation)
        configuration.setMaxAge(3600L); // Cache la réponse preflight pendant 1 heure

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Applique cette configuration à tous les chemins
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
