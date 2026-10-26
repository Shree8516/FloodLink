// What insights-service answers: is this a duplicate (and of which request), how urgent is it (0-100),
// and WHY (human-readable reasons shown in the PriorityBadge tooltip). Read by InsightsClient.
package com.floodlink.request.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record AnalyzeResult(
        // @JsonProperty keeps the JSON name exactly "isDuplicate" (Jackson can otherwise drop the "is")
        @JsonProperty("isDuplicate") boolean isDuplicate,
        Long duplicateOfId,
        int priorityScore,
        List<String> reasons
) {

    // Used when insights-service is unreachable: medium priority, not a duplicate
    public static AnalyzeResult fallback() {
        return new AnalyzeResult(false, null, 50, List.of("Insights service unavailable: default priority 50"));
    }
}
