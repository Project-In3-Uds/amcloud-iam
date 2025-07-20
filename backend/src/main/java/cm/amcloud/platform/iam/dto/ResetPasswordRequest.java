package cm.amcloud.platform.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token cannot be empty")
    private String token;

    @NotBlank(message = "New password cannot be empty")
    @Size(min = 8, message = "New password must be at least 8 characters long") // Validation côté client
    private String newPassword;

    @NotBlank(message = "Confirm password cannot be empty")
    private String confirmNewPassword;
}
