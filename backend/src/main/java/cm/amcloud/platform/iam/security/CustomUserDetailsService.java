package cm.amcloud.platform.iam.security;

import java.util.Set;
import java.util.stream.Collectors; // Import Role

import org.springframework.security.core.authority.SimpleGrantedAuthority; // Import Permission
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import cm.amcloud.platform.iam.model.Permission;
import cm.amcloud.platform.iam.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        cm.amcloud.platform.iam.model.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Collect roles as GrantedAuthorities
        Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toSet());

        // Collect unique scopes from all permissions associated with user's roles
        Set<String> scopes = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream()) // Get all permissions from all roles
                .map(Permission::getScopeValue) // Map to their scope_value
                .filter(scope -> scope != null && !scope.isBlank()) // Filter out null or empty scopes
                .collect(Collectors.toSet());  

        return new CustomUserDetails(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                true, true, true,  
                authorities,
                scopes
        );
    }
}
