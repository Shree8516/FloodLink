// Body of POST /api/v1/requests/{id}/merge (optional). Without a targetId the duplicate is merged into the
// request insights-service flagged it as a duplicate of (its duplicateOfId).
package com.floodlink.request.dto;

public record MergeHelpRequest(Long targetId) {
}
