// Body that request-service sends to insights-service's POST /api/v1/analyze: the new request plus recent
// unresolved ones to compare against. Built by InsightsClient.
package com.floodlink.request.dto;

import com.floodlink.request.model.HelpRequest;
import com.floodlink.request.model.RequestType;

import java.time.LocalDateTime;
import java.util.List;

public record AnalyzeRequest(Item request, List<Item> recentRequests) {

    // One request in the format insights-service expects (id is null for the new, unsaved request)
    public record Item(
            Long id,
            RequestType type,
            String description,
            double latitude,
            double longitude,
            String address,
            int peopleCount,
            LocalDateTime createdAt
    ) {
        public static Item from(HelpRequest request) {
            return new Item(request.getId(), request.getType(), request.getDescription(),
                    request.getLatitude(), request.getLongitude(), request.getAddress(),
                    request.getPeopleCount(), request.getCreatedAt());
        }
    }
}
