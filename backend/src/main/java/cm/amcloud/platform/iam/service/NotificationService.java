package cm.amcloud.platform.iam.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate; // Ré-importer RestTemplate
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

/**
 * Service de notification qui agit comme un client HTTP pour un microservice de notification externe.
 * Il envoie des requêtes pour l'envoi d'e-mails de vérification et de réinitialisation de mot de passe.
 *
 * TODO: Migrer vers une communication asynchrone via un broker de messages (ex: RabbitMQ/Kafka)
 * et intégrer un service de découverte (ex: Eureka) pour une architecture de microservices plus robuste.
 */
@Service
public class NotificationService {

    private final RestTemplate restTemplate;

    // URL de base de votre microservice de notification
    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    // Nouvelle propriété pour l'URL de base du frontend
    @Value("${frontend.base.url:http://localhost:3000}") // Valeur par défaut pour le développement
    private String frontendBaseUrl;

    public NotificationService(RestTemplate restTemplate) { // Ré-injecter RestTemplate
        this.restTemplate = restTemplate;
    }

    /**
     * Envoie une demande d'e-mail de vérification au microservice de notification via HTTP (RestTemplate).
     * Le microservice de notification attend un objet avec 'to', 'subject', 'content'.
     *
     * @param recipientEmail L'adresse e-mail du destinataire.
     * @param token Le token de vérification à inclure dans l'e-mail.
     */
    public void sendVerificationEmail(String recipientEmail, String token) {
        String url = notificationServiceUrl + "/api/notifications/send"; // Endpoint générique du microservice de notification
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("to", recipientEmail);
        requestBody.put("subject", "Vérification de votre compte Amcloud IAM");
        String content = "Bonjour,\n\nVeuillez cliquer sur le lien suivant pour vérifier votre compte Amcloud IAM:\n"
                       + frontendBaseUrl + "/verify-email?token=" + token + "\n\n" // Utilise frontendBaseUrl
                       + "Ce lien expirera dans 24 heures.\n\n"
                       + "Cordialement,\nL'équipe Amcloud IAM";
        requestBody.put("content", content);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("Notification: Demande d'envoi d'e-mail de vérification envoyée via HTTP pour " + recipientEmail);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'e-mail de vérification à " + recipientEmail + ": " + e.getMessage());
            // TODO: Gérer l'échec de l'envoi de notification (ex: journalisation, file d'attente de messages)
        }
    }

    /**
     * Envoie une demande d'e-mail de réinitialisation de mot de passe au microservice de notification via HTTP (RestTemplate).
     * Le microservice de notification attend un objet avec 'to', 'subject', 'content'.
     *
     * @param recipientEmail L'adresse e-mail du destinataire.
     * @param token Le token de réinitialisation de mot de passe à inclure dans l'e-mail.
     */
    public void sendPasswordResetEmail(String recipientEmail, String token) {
        String url = notificationServiceUrl + "/api/notifications/send"; // Endpoint générique du microservice de notification
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("to", recipientEmail);
        requestBody.put("subject", "Réinitialisation de votre mot de passe Amcloud IAM");
        String content = "Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe pour votre compte Amcloud IAM.\n"
                       + "Veuillez cliquer sur le lien suivant pour procéder à la réinitialisation:\n"
                       + frontendBaseUrl + "/reset-password?token=" + token + "\n\n" // <-- CORRECTION ICI
                       + "Ce lien expirera dans 1 heure.\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.\n\n"
                       + "Cordialement,\nL'équipe Amcloud IAM";
        requestBody.put("content", content);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("Notification: Demande d'envoi d'e-mail de réinitialisation de mot de passe envoyée via HTTP pour " + recipientEmail);
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi de l'e-mail de réinitialisation à " + recipientEmail + ": " + e.getMessage());
            // TODO: Gérer l'échec de l'envoi de notification (ex: journalisation, file d'attente de messages)
        }
    }
}
