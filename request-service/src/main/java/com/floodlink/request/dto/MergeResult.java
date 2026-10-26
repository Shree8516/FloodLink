// Response of POST /api/v1/requests/{id}/merge, and the data of the "request:merged" live event.
// Both requests changed (the duplicate became MERGED, the original's reportCount went up), so both are sent.
// "id" repeats the original's id because auth-realtime-service requires data.id on every event.
package com.floodlink.request.dto;

public record MergeResult(Long id, HelpRequestDto original, HelpRequestDto merged) {

    public static MergeResult of(HelpRequestDto original, HelpRequestDto merged) {
        return new MergeResult(original.id(), original, merged);
    }
}
