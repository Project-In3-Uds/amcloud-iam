package cm.amcloud.platform.iam.security;

import java.util.Collection;
import java.util.Set; 

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User; 

public class CustomUserDetails extends User {

    private final Set<String> scopes;

    public CustomUserDetails(String username, String password, Collection<? extends GrantedAuthority> authorities, Set<String> scopes) {
        super(username, password, authorities);
        this.scopes = scopes;
    }

    public CustomUserDetails(String username, String password, boolean enabled, boolean accountNonExpired, boolean credentialsNonExpired, boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities, Set<String> scopes) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
        this.scopes = scopes;
    }

    public Set<String> getScopes() {
        return scopes;
    }
}
