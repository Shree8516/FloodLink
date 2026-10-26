// Body of PUT /api/v1/requests/{id} (admin edit). Type, location and status are deliberately not editable here:
// status only changes through claim/resolve, and moving a request would confuse volunteers already on the way.
package com.floodlink.request.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateHelpRequest(
        @NotBlank @Size(max = 500) String description,
        @NotBlank String address,
        @NotNull @Min(1) @Max(1000) Integer peopleCount,
        @NotBlank String contactName,
        @NotBlank @Pattern(regexp = "\\d{10}", message = "must be a 10-digit phone number") String contactPhone
) {
}
