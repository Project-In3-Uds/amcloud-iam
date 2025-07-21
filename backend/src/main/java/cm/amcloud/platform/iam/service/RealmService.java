package cm.amcloud.platform.iam.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import cm.amcloud.platform.iam.dto.RealmRequest;
import cm.amcloud.platform.iam.dto.RealmResponse;
import cm.amcloud.platform.iam.model.Realm;
import cm.amcloud.platform.iam.repository.RealmRepository;

@Service
public class RealmService {

    private final RealmRepository realmRepository;

    public RealmService(RealmRepository realmRepository) {
        this.realmRepository = realmRepository;
    }

    /**
     * Crée un nouveau Realm.
     *
     * @param request Les détails du Realm à créer.
     * @return Le RealmResponse du Realm créé.
     * @throws IllegalArgumentException si le nom du Realm existe déjà.
     */
    @Transactional
    public RealmResponse createRealm(RealmRequest request) {
        if (realmRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Le Realm avec le nom '" + request.getName() + "' existe déjà.");
        }

        Realm newRealm = new Realm();
        newRealm.setName(request.getName());
        newRealm.setDescription(request.getDescription());
        newRealm.setCreatedAt(LocalDateTime.now());
        newRealm.setUpdatedAt(LocalDateTime.now());

        Realm savedRealm = realmRepository.save(newRealm);
        return convertToRealmResponse(savedRealm);
    }

    /**
     * Récupère un Realm par son ID.
     *
     * @param id L'ID du Realm.
     * @return Le RealmResponse du Realm trouvé.
     * @throws IllegalArgumentException si le Realm n'est pas trouvé.
     */
    public RealmResponse getRealmById(Long id) {
        Realm realm = realmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + id));
        return convertToRealmResponse(realm);
    }

    /**
     * Récupère tous les Realms.
     *
     * @return Une liste de RealmResponse.
     */
    public List<RealmResponse> getAllRealms() {
        return realmRepository.findAll().stream()
                .map(this::convertToRealmResponse)
                .collect(Collectors.toList());
    }

    /**
     * Met à jour un Realm existant.
     *
     * @param id L'ID du Realm à mettre à jour.
     * @param request Les nouvelles informations du Realm.
     * @return Le RealmResponse du Realm mis à jour.
     * @throws IllegalArgumentException si le Realm n'est pas trouvé ou si le nom est déjà pris.
     */
    @Transactional
    public RealmResponse updateRealm(Long id, RealmRequest request) {
        Realm existingRealm = realmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + id));

        // Vérifier si le nouveau nom est déjà pris par un autre Realm
        if (request.getName() != null && !request.getName().equals(existingRealm.getName())) {
            if (realmRepository.findByName(request.getName()).isPresent()) {
                throw new IllegalArgumentException("Le nom de Realm '" + request.getName() + "' est déjà utilisé par un autre Realm.");
            }
            existingRealm.setName(request.getName());
        }

        if (request.getDescription() != null) {
            existingRealm.setDescription(request.getDescription());
        }
        existingRealm.setUpdatedAt(LocalDateTime.now());

        Realm updatedRealm = realmRepository.save(existingRealm);
        return convertToRealmResponse(updatedRealm);
    }

    /**
     * Supprime un Realm par son ID.
     *
     * @param id L'ID du Realm à supprimer.
     * @throws IllegalArgumentException si le Realm n'est pas trouvé.
     */
    @Transactional
    public void deleteRealm(Long id) {
        Realm realmToDelete = realmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Realm non trouvé avec l'ID: " + id));
        
        // TODO: Implémenter la logique de suppression en cascade ou de gestion des dépendances
        // Avant de supprimer un Realm, assurez-vous que tous les utilisateurs, rôles, permissions
        // et autres ressources qui lui sont associées sont gérés (déplacés, supprimés, etc.).
        // Cela dépendra de votre stratégie d'isolation des Realms.
        realmRepository.delete(realmToDelete);
    }

    /**
     * Convertit une entité Realm en RealmResponse DTO.
     *
     * @param realm L'entité Realm à convertir.
     * @return Le RealmResponse DTO.
     */
    private RealmResponse convertToRealmResponse(Realm realm) {
        RealmResponse response = new RealmResponse();
        response.setId(realm.getId());
        response.setName(realm.getName());
        response.setDescription(realm.getDescription());
        response.setCreatedAt(realm.getCreatedAt());
        response.setUpdatedAt(realm.getUpdatedAt());
        return response;
    }
}
