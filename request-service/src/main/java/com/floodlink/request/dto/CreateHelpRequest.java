// Body of POST /api/v1/requests (what the citizen fills in on the form).
// These rules mirror the frontend validation, so bad data is rejected even if someone skips the UI.
package com.floodlink.request.dto;

import com.floodlink.request.model.RequestType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateHelpRequest(
        @NotNull RequestType type,
        @NotBlank @Size(max = 500) String description,
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @NotBlank String address,
        @NotNull @Min(1) @Max(1000) Integer peopleCount,
        @NotBlank String contactName,
        @NotBlank @Pattern(regexp = "\\d{10}", message = "must be a 10-digit phone number") String contactPhone
) {
}
