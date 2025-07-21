package cm.amcloud.platform.iam.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "realms")
public class Realm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Nom unique du Realm (ex: "default", "client_a", "client_b")

    @Column(length = 500)
    private String description; // Description du Realm

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // TODO:Vous pourriez ajouter d'autres champs pertinents pour un Realm,
    // comme des configurations spécifiques, des paramètres d'intégration, etc.
}
