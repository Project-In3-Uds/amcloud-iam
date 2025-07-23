package cm.amcloud.platform.iam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Set;

@Entity
@Data
@Table(name = "roles")
@EqualsAndHashCode(exclude = {"users", "permissions"}) // Exclure 'users' et 'permissions' pour éviter les boucles infinies dans toString/hashCode
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY) // <-- NOUVEAU : Relation Many-to-One avec Realm
    @JoinColumn(name = "realm_id", nullable = false) // <-- NOUVEAU : Colonne de la clé étrangère
    private Realm realm;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "role_permissions",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;
}
