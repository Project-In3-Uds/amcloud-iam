package cm.amcloud.platform.iam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Set;

@Entity
@Data
@Table(name = "permissions")
@EqualsAndHashCode(exclude = "roles") // Exclure 'roles' pour éviter les boucles infinies dans toString/hashCode
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "scope_value")
    private String scopeValue;

    @Column(length = 500)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY) // <-- NOUVEAU : Relation Many-to-One avec Realm
    @JoinColumn(name = "realm_id", nullable = false) // <-- NOUVEAU : Colonne de la clé étrangère
    private Realm realm;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles;
}
