package cm.amcloud.platform.iam.model;

import jakarta.persistence.*;
import lombok.Data; // Import de Lombok Data
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Data // Lombok générera tous les getters, setters, equals, hashCode, et toString
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(name = "password_hash")
    private String password;

    @Column(unique = true)
    private String email;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    private boolean enabled = true;

    @Column(name = "failed_attempts")
    private Integer failedAttempts = 0;

    @Column(name = "lockout_time")
    private LocalDateTime lockoutTime;

    @ManyToOne(fetch = FetchType.LAZY) // <-- NOUVEAU : Relation Many-to-One avec Realm
    @JoinColumn(name = "realm_id", nullable = false) // <-- NOUVEAU : Colonne de la clé étrangère
    private Realm realm;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;
}
