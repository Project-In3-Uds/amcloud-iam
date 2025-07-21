package cm.amcloud.platform.iam.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Filtre d'authentification pour le service IAM qui lit les en-têtes d'authentification
 * transférés par la passerelle (X-User-ID, X-User-Roles, X-User-Scopes) et peuple
 * le SecurityContextHolder.
 *
 * Ce filtre fait confiance à l'authentification préalable effectuée par la passerelle.
 */
@Component
public class GatewayHeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Vérifier si le contexte de sécurité est déjà peuplé (ex: par d'autres filtres ou tests)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String userId = request.getHeader("X-User-ID");
        final String userRoles = request.getHeader("X-User-Roles");
        final String userScopes = request.getHeader("X-User-Scopes");

        // Si l'ID utilisateur est présent, tenter d'authentifier
        if (userId != null && !userId.isEmpty()) {
            Collection<GrantedAuthority> authorities = new HashSet<>();

            // Ajouter les rôles
            if (userRoles != null && !userRoles.isEmpty()) {
                Arrays.stream(userRoles.split(","))
                      .map(String::trim)
                      .filter(role -> !role.isEmpty())
                      .map(SimpleGrantedAuthority::new) // Les rôles incluent déjà "ROLE_"
                      .forEach(authorities::add);
            }

            // Ajouter les scopes
            if (userScopes != null && !userScopes.isEmpty()) {
                Arrays.stream(userScopes.split(","))
                      .map(String::trim)
                      .filter(scope -> !scope.isEmpty())
                      .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope.toUpperCase())) // Ajouter "SCOPE_"
                      .forEach(authorities::add);
            }

            // Créer un objet d'authentification
            // Nous utilisons userId comme principal car le JWT a été validé par la passerelle
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, // Principal: l'ID utilisateur ou le nom d'utilisateur
                    null,   // Credentials: pas de mot de passe ici, car déjà authentifié
                    authorities
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Mettre à jour le SecurityContextHolder
            SecurityContextHolder.getContext().setAuthentication(authentication);
            System.out.println("Utilisateur " + userId + " authentifié via les en-têtes de la passerelle.");
        }

        filterChain.doFilter(request, response);
    }
}
