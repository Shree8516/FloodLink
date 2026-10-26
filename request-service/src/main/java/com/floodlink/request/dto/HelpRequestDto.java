// The shape of a help request as sent to the frontend and to auth-realtime-service (see CONTRACT.md).
// We never return the entity directly: the API shape stays stable even if the table changes.
package com.floodlink.request.dto;

import com.floodlink.request.model.ClaimedBy;
import com.floodlink.request.model.HelpRequest;
import com.floodlink.request.model.RequestStatus;
import com.floodlink.request.model.RequestType;

import java.time.LocalDateTime;
import java.util.List;

public record HelpRequestDto(
        Long id,
        RequestType type,
        String description,
        double latitude,
        double longitude,
        String address,
        int peopleCount,
        String contactName,
        String contactPhone,
        RequestStatus status,
        int priorityScore,
        List<String> priorityReasons,
        Long duplicateOfId,
        Long mergedIntoId,
        int reportCount,
        Volunteer claimedBy,
        LocalDateTime createdAt,
        LocalDateTime claimedAt,
        LocalDateTime resolvedAt,
        LocalDateTime updatedAt
) {

    // Just enough about the volunteer to show "Claimed by Priya" on the card
    public record Volunteer(String id, String name) {
    }

    // Converts the database entity into the API shape
    public static HelpRequestDto from(HelpRequest request) {
        ClaimedBy claimed = request.getClaimedBy();
        Volunteer volunteer = claimed == null ? null : new Volunteer(claimed.userId(), claimed.name());
        return new HelpRequestDto(
                request.getId(),
                request.getType(),
                request.getDescription(),
                request.getLatitude(),
                request.getLongitude(),
                request.getAddress(),
                request.getPeopleCount(),
                request.getContactName(),
                request.getContactPhone(),
                request.getStatus(),
                request.getPriorityScore(),
                splitReasons(request.getPriorityReasons()),
                request.getDuplicateOfId(),
                request.getMergedIntoId(),
                request.getReportCount(),
                volunteer,
                request.getCreatedAt(),
                request.getClaimedAt(),
                request.getResolvedAt(),
                request.getUpdatedAt());
    }

    // Reasons are stored as one text column with one reason per line
    private static List<String> splitReasons(String reasons) {
        return reasons == null || reasons.isBlank() ? List.of() : List.of(reasons.split("\n"));
    }
}
